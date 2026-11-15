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
    # Проверка: заявка существует
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    
    # Проверка: нельзя откликнуться на свою заявку
    if db_request.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя откликнуться на собственную заявку")

    # Проверка: пользователь уже откликался
    existing_response = db.query(models.RequestResponse).filter(
        models.RequestResponse.request_id == request_id,
        models.RequestResponse.user_id == current_user.id
    ).first()
    if existing_response:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Вы уже откликнулись на эту заявку")

    # Создаем отклик
    new_response = models.RequestResponse(
        request_id=request_id,
        user_id=current_user.id,
        status="pending"
    )
    db.add(new_response)
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