from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import models
import database
import schemas
import auth

router = APIRouter(tags=["Заявки и Авторизация"])

# регистрация
@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserRegister, db: Session = Depends(database.get_db)):
    if user.password != user.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароли не совпадают"
        )
    
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | 
        (models.User.email == user.email)
    ).first()
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем или почтой уже существует"
        )
    
    hashed_password = auth.hash_password(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        gender=user.gender,
        city=user.city,
        birth_date=user.birth_date,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# вход
@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль"
        )
        
    token_lifetime = timedelta(
        days=30 if user.remember_me else 1
    )

    access_token = auth.create_access_token(
        data={"sub": db_user.username},
        expires_delta=token_lifetime
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# получение данных текущего пользователя
@router.get("/users/me", response_model=schemas.UserResponse)
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    return current_user

# редактирование профиля
@router.put("/users/me", response_model=schemas.UserResponse)
def update_current_user_profile(
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Проверяем, не занят ли новый username другим пользователем
    existing_username = db.query(models.User).filter(
        models.User.username == user_data.username,
        models.User.id != current_user.id
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот username уже занят"
        )

    # Проверяем, не занят ли новый email другим пользователем
    existing_email = db.query(models.User).filter(
        models.User.email == user_data.email,
        models.User.id != current_user.id
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот email уже используется"
        )

    # Обновляем данные пользователя
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

# создание заявки
@router.post("/requests/", response_model=schemas.RequestResponse)
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
        user_id=current_user.id
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request

# получение списка заявок
@router.get("/requests/", response_model=List[schemas.RequestResponse])
def get_requests(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    requests = db.query(models.Request).offset(skip).limit(limit).all()
    return requests