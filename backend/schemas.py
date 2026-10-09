from pydantic import BaseModel, ConfigDict
from datetime import datetime

# схемы для пользователя

class UserCreate(BaseModel): # ждём от пользователя при регистрации
    username: str
    email: str
    password: str

class UserResponse(BaseModel): # отдаём обратно
    id: int
    username: str
    email: str
    
    model_config = ConfigDict(from_attributes=True)


# схемы для заявки

class RequestCreate(BaseModel): # отправляет пользователь
    title: str
    description: str
    activity_type: str
    location: str
    date_time: datetime

class RequestResponse(BaseModel): # показываем в ленте
    id: int
    title: str
    description: str
    activity_type: str
    location: str
    date_time: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# схема для регистрации

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    password_confirm: str

    def check_passwords_match(self): # валидация
        if self.password != self.password_confirm:
            raise ValueError("Пароли не совпадают")
        return self


# схема для входа

class UserLogin(BaseModel):
    email: str                                    #ИЗМЕНЕНО  НА EMAIL
    password: str


# схема для токена (возвращаем после входа)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"