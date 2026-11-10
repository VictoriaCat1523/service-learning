from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, date
import re

# схемы для пользователя

class UserCreate(BaseModel): # ждём от пользователя при регистрации
    username: str
    email: str
    password: str

class UserResponse(BaseModel): # отдаём обратно
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    gender: str
    city: str
    birth_date: date
        
    model_config = ConfigDict(from_attributes=True)

# схема для редактирования профиля

class UserUpdate(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    gender: str
    city: str
    birth_date: date

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if not re.fullmatch(r'[а-яёА-ЯЁa-zA-Z]+(?:[- ][а-яёА-ЯЁa-zA-Z]+)*', value):
            raise ValueError('Используйте только русские или английские буквы, пробел и дефис')

        return value

    @field_validator('username')
    @classmethod
    def validate_username(cls, value):
        value = value.strip()

        if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.]{1,18}[a-zA-Z0-9]', value):
            raise ValueError('Username должен содержать 3–20 символов: латинские буквы, цифры, точку или нижнее подчёркивание')

        return value

    @field_validator('email')
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()

        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
            raise ValueError('Введите корректный адрес электронной почты')

        return value

    @field_validator('city')
    @classmethod
    def validate_city(cls, value):
        value = value.strip()

        if not value:
            raise ValueError('Укажите город')

        return value
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
    first_name: str
    last_name: str
    gender: str
    city: str
    birth_date: date
    password: str
    password_confirm: str

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if not re.fullmatch(r'[а-яёА-ЯЁa-zA-Z]+(?:[- ][а-яёА-ЯЁa-zA-Z]+)*', value):
            raise ValueError('Используйте только русские или английские буквы, пробел и дефис')

        return value

    @field_validator('username')
    @classmethod
    def validate_username(cls, value):
        value = value.strip()

        if not re.fullmatch(r'[a-zA-Z0-9](?:[a-zA-Z0-9_.]{1,18}[a-zA-Z0-9])?', value):
            raise ValueError('Username должен содержать 3–20 символов: латинские буквы, цифры, точку или нижнее подчёркивание')

        return value

    @field_validator('email')
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()

        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
            raise ValueError('Введите корректный адрес электронной почты')

        return value

    @field_validator('password')
    @classmethod
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        if len(value.encode('utf-8')) > 72:
            raise ValueError('Пароль слишком длинный')
        if not re.search(r'[A-ZА-ЯЁ]', value):
            raise ValueError('Добавьте хотя бы одну заглавную букву')

        if not re.search(r'[a-zа-яё]', value):
            raise ValueError('Добавьте хотя бы одну строчную букву')

        if not re.search(r'\d', value):
            raise ValueError('Добавьте хотя бы одну цифру')

        if not re.search(r'[^a-zA-Zа-яёА-ЯЁ0-9\s]', value):
            raise ValueError('Добавьте хотя бы один специальный символ')

        return value

# схема для входа

class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: bool = False


# схема для токена (возвращаем после входа)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"