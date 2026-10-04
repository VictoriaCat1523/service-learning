from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# вход
@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль"
        )
    
    access_token = auth.create_access_token(
        data={"sub": db_user.username}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

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