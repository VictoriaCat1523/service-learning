from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from typing import List
import models
import database
import schemas
import auth

router = APIRouter(tags=["Заявки, Отклики и Авторизация"])

# ==========================================
# АВТОРИЗАЦИЯ И ПОЛЬЗОВАТЕЛИ (без изменений)
# ==========================================

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserRegister, db: Session = Depends(database.get_db)):
    if user.password != user.password_confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Пароли не совпадают")
    
    existing_username = db.query(models.User).filter(func.lower(models.User.username) == user.username.lower()).first()
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"field": "username", "message": "Этот username уже занят"})

    existing_email = db.query(models.User).filter(func.lower(models.User.email) == user.email.lower()).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"field": "email", "message": "Этот email уже зарегистрирован"})
    
    hashed_password = auth.hash_password(user.password)
    new_user = models.User(
        username=user.username, email=user.email, first_name=user.first_name, last_name=user.last_name,
        gender=user.gender, city=user.city, birth_date=user.birth_date, hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(func.lower(models.User.email) == user.email.strip().lower()).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверное имя пользователя или пароль")
        
    token_lifetime = timedelta(days=30 if user.remember_me else 1)
    access_token = auth.create_access_token(data={"sub": str(db_user.id)}, expires_delta=token_lifetime)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/users/me", response_model=schemas.UserResponse)
def update_current_user_profile(
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    existing_username = db.query(models.User).filter(func.lower(models.User.username) == user_data.username.lower(), models.User.id != current_user.id).first()
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"field": "username", "message": "Этот username уже занят"})

    existing_email = db.query(models.User).filter(func.lower(models.User.email) == user_data.email.lower(), models.User.id != current_user.id).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"field": "email", "message": "Этот email уже зарегистрирован"})

    current_user.username = user_data.username
    current_user.email = user_data.email
    current_user.first_name = user_data.first_name
    current_user.last_name = user_data.last_name
    current_user.gender = user_data.gender
    current_user.city = user_data.city
    current_user.birth_date = user_data.birth_date

    db.commit()
    db.refresh(current_user)
    return current_user


# ==========================================
# ЗАЯВКИ И ОТКЛИКИ (ОБНОВЛЕНО)
# ==========================================

# 1. СОЗДАНИЕ ЗАЯВКИ (добавлены новые поля из формы)
@router.post("/requests/", response_model=schemas.RequestResponseModel)
def create_request(
    request: schemas.RequestCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db_request = models.Request(
        title=request.title,
        description=request.description,
        activity_type=request.activity_type,
        location=request.location,
        date_time=request.date_time,
        people_count=request.people_count,       # НОВОЕ
        budget=request.budget,                   # НОВОЕ
        file_path=request.file_path,             # НОВОЕ
        status="active",                         # НОВОЕ
        user_id=current_user.id
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

# 2. ПОЛУЧЕНИЕ ВСЕХ АКТИВНЫХ ЗАЯВОК (ЛЕНТА) с фильтрами
@router.get("/requests/", response_model=List[schemas.RequestResponseModel])
def get_requests(
    skip: int = 0, 
    limit: int = 100, 
    activity_type: str | None = None,
    db: Session = Depends(database.get_db)
):
    # Показываем только активные заявки
    query = db.query(models.Request).filter(models.Request.status == "active")
    
    # Если передан фильтр по категории, применяем его
    if activity_type:
        query = query.filter(func.lower(models.Request.activity_type) == activity_type.lower())
    
    requests = query.offset(skip).limit(limit).all()
    return requests

# 3. МОИ ЗАЯВКИ (вкладка "Публикации")
@router.get("/requests/my", response_model=List[schemas.RequestResponseModel])
def get_my_requests(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Request).filter(models.Request.user_id == current_user.id).all()

# 4. ОТКЛИК НА ЗАЯВКУ (Кнопка "Откликнуться" / Join)
@router.post("/requests/{request_id}/join", response_model=schemas.ResponseRead)
def join_request(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    
    if db_request.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя откликнуться на собственную заявку")

    existing_response = db.query(models.RequestResponse).filter(
        models.RequestResponse.request_id == request_id,
        models.RequestResponse.user_id == current_user.id
    ).first()
    if existing_response:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Вы уже откликнулись на эту заявку")

    new_response = models.RequestResponse(
        request_id=request_id,
        user_id=current_user.id,
        status="pending"
    )
    db.add(new_response)
    
    # === СОЗДАЕМ УВЕДОМЛЕНИЕ ДЛЯ АВТОРА ЗАЯВКИ ===
    notification = models.Notification(
        user_id=db_request.user_id,
        title="Новый отклик на вашу заявку",
        message=f"Пользователь {current_user.first_name} {current_user.last_name} (@{current_user.username}) откликнулся на заявку '{db_request.title}'.\nEmail для связи: {current_user.email}",
        notification_type="response",
        related_request_id=db_request.id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(new_response)
    return new_response

# 5. МОИ ОТКЛИКИ (вкладка "Отклики")
@router.get("/responses/my", response_model=List[schemas.ResponseRead])
def get_my_responses(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.RequestResponse).filter(
        models.RequestResponse.user_id == current_user.id
    ).all()

# ==========================================
# УВЕДОМЛЕНИЯ
# ==========================================

@router.get("/notifications/", response_model=List[schemas.NotificationResponse])
def get_my_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()
    return notifications

@router.patch("/notifications/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    notification.is_read = 1
    db.commit()
    return {"message": "Отмечено как прочитанное"}

# ==========================================
# ПРИНЯТИЕ / ОТКЛОНЕНИЕ ОТКЛИКОВ (для автора заявки)
# ==========================================

@router.patch("/responses/{response_id}/accept")
def accept_response(
    response_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    response = db.query(models.RequestResponse).filter(models.RequestResponse.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    
    request = db.query(models.Request).filter(models.Request.id == response.request_id).first()
    if request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только автор заявки может принимать отклики")
    
    response.status = "accepted"
    
    # Создаем уведомление для откликнувшегося
    responder = db.query(models.User).filter(models.User.id == response.user_id).first()
    notification = models.Notification(
        user_id=response.user_id,
        title="Ваш отклик принят!",
        message=f"Ваш отклик на заявку '{request.title}' принят. Свяжитесь с организатором: {current_user.email}",
        notification_type="response_accepted",
        related_request_id=request.id
    )
    db.add(notification)
    
    # Проверяем, не набрано ли нужное количество людей
    accepted_count = db.query(models.RequestResponse).filter(
        models.RequestResponse.request_id == request.id,
        models.RequestResponse.status == "accepted"
    ).count()
    
    if accepted_count >= request.people_count:
        request.status = "full"
    
    db.commit()
    return {"message": "Отклик принят"}


@router.patch("/responses/{response_id}/decline")
def decline_response(
    response_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    response = db.query(models.RequestResponse).filter(models.RequestResponse.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    
    request = db.query(models.Request).filter(models.Request.id == response.request_id).first()
    if request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только автор заявки может отклонять отклики")
    
    response.status = "declined"
    
    # Уведомление для откликнувшегося
    notification = models.Notification(
        user_id=response.user_id,
        title="Ваш отклик отклонен",
        message=f"К сожалению, ваш отклик на заявку '{request.title}' отклонен.",
        notification_type="response_declined",
        related_request_id=request.id
    )
    db.add(notification)
    
    db.commit()
    return {"message": "Отклик отклонен"}


# ==========================================
# ЭНДПОИНТ ДЛЯ АВТОРА: ВСЕ ОТКЛИКИ НА ЕГО ЗАЯВКИ
# ==========================================

@router.get("/requests/{request_id}/responses")
def get_responses_for_my_request(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только автор может видеть отклики")
    
    responses = db.query(models.RequestResponse).filter(
        models.RequestResponse.request_id == request_id
    ).all()
    
    result = []
    for resp in responses:
        user = db.query(models.User).filter(models.User.id == resp.user_id).first()
        result.append({
            "id": resp.id,
            "status": resp.status,
            "created_at": resp.created_at,
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email
            }
        })
    return result


# ==========================================
# СЧЕТЧИК НЕПРОЧИТАННЫХ УВЕДОМЛЕНИЙ
# ==========================================

@router.get("/notifications/unread-count")
def get_unread_count(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == 0
    ).count()
    return {"unread_count": count}


# ==========================================
# ПРОЧИТАТЬ ВСЕ УВЕДОМЛЕНИЯ
# ==========================================

@router.patch("/notifications/read-all")
def read_all_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == 0
    ).update({models.Notification.is_read: 1})
    db.commit()
    return {"message": "Все уведомления отмечены как прочитанные"}

@router.get("/requests/{request_id}", response_model=schemas.RequestResponseModel)
def get_request(
    request_id: int,
    db: Session = Depends(database.get_db)
):
    request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return request


# ==========================================
# 🆕 ИЗМЕНЕНИЕ СТАТУСА ЗАЯВКИ (ОТМЕНА / ЗАВЕРШЕНИЕ / ВОЗВРАТ)
# ==========================================

@router.patch("/requests/{request_id}/status")
def update_request_status(
    request_id: int,
    status_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # 1. Ищем заявку
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    # 2. Только автор может менять статус
    if db_request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только автор заявки может изменить её статус")

    # 3. Получаем новый статус
    new_status = status_data.get("status")
    allowed_statuses = ["cancelled", "completed", "active"]
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Недопустимый статус")

    current_status = db_request.status

    # 4. Логика переходов между статусами
    # Завершённую заявку менять нельзя
    if current_status == "completed":
        raise HTTPException(status_code=400, detail="Завершённую заявку нельзя изменить")

    # Возврат к активной разрешён только из cancelled
    if new_status == "active" and current_status != "cancelled":
        raise HTTPException(status_code=400, detail="Вернуть к активной можно только отменённую заявку")

    # Нельзя сделать active → active или cancelled → cancelled
    if new_status == current_status:
        raise HTTPException(status_code=400, detail=f"Заявка уже в статусе '{current_status}'")

    # 5. === ОТМЕНА ЗАЯВКИ ===
    if new_status == "cancelled":
        # Находим все активные отклики (pending и accepted), чтобы отклонить их
        active_responses = db.query(models.RequestResponse).filter(
            models.RequestResponse.request_id == request_id,
            models.RequestResponse.status.in_(["pending", "accepted"])
        ).all()

        for response in active_responses:
            response.status = "declined"

            # Уведомление пользователю, который откликнулся
            notification = models.Notification(
                user_id=response.user_id,
                title="Заявка отменена",
                message=f"Заявка '{db_request.title}' была отменена организатором.",
                notification_type="request_cancelled",
                related_request_id=db_request.id
            )
            db.add(notification)

        db_request.status = "cancelled"
        db.commit()
        db.refresh(db_request)

        return {
            "message": "Заявка отменена. Все откликнувшиеся получили уведомления.",
            "new_status": "cancelled",
            "request_id": request_id,
            "notified_count": len(active_responses)
        }

    # 6. === ЗАВЕРШЕНИЕ ЗАЯВКИ ===
    elif new_status == "completed":
        db_request.status = "completed"
        db.commit()
        db.refresh(db_request)

        return {
            "message": "Заявка завершена",
            "new_status": "completed",
            "request_id": request_id
        }

    # 7. === ВОЗВРАТ К АКТИВНОЙ (из cancelled) ===
    elif new_status == "active" and current_status == "cancelled":
        # Восстанавливаем все declined-отклики обратно в pending
        declined_responses = db.query(models.RequestResponse).filter(
            models.RequestResponse.request_id == request_id,
            models.RequestResponse.status == "declined"
        ).all()

        for response in declined_responses:
            response.status = "pending"

            # Уведомляем пользователя, что заявка снова активна
            notification = models.Notification(
                user_id=response.user_id,
                title="Заявка снова активна!",
                message=f"Заявка '{db_request.title}', на которую вы откликались, снова активна. Организатор возобновил её.",
                notification_type="request_reactivated",
                related_request_id=db_request.id
            )
            db.add(notification)

        # Сбрасываем статус с full на active (если вдруг был full)
        db_request.status = "active"
        db.commit()
        db.refresh(db_request)

        return {
            "message": "Заявка снова активна. Все откликнувшиеся получили уведомления.",
            "new_status": "active",
            "request_id": request_id,
            "restored_responses": len(declined_responses)
        }


# ==========================================
# 🆕 АВТОЗАВЕРШЕНИЕ ПРОСРОЧЕННЫХ ЗАЯВОК
# ==========================================

@router.post("/requests/auto-complete")
def auto_complete_expired_requests(
    db: Session = Depends(database.get_db)
):
    """
    Находит все активные/полные заявки с прошедшей датой и завершает их.
    Можно вызывать вручную через POST /api/requests/auto-complete
    или настроить cron-задачу для автоматического запуска.
    """
    from datetime import datetime

    now = datetime.utcnow()

    # Находим заявки в статусах active/full, у которых дата уже прошла
    expired_requests = db.query(models.Request).filter(
        models.Request.status.in_(["active", "full"]),
        models.Request.date_time < now
    ).all()

    completed_count = 0
    for request in expired_requests:
        request.status = "completed"
        completed_count += 1

    db.commit()

    return {
        "message": "Автозавершение выполнено",
        "completed_count": completed_count,
        "checked_at": now.isoformat()
    }