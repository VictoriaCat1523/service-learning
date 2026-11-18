from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class RequestStatus(str, enum.Enum):
    active = "active"
    full = "full"
    closed = "closed"

class ResponseStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    city = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    requests = relationship("Request", back_populates="user")
    responses = relationship("RequestResponse", back_populates="user")

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    activity_type = Column(String, nullable=False) # категория
    location = Column(String, nullable=False)
    date_time = Column(DateTime, nullable=False)
    people_count = Column(Integer, default=1)
    budget = Column(String, nullable=True) # или Integer, если только цифры
    file_path = Column(String, nullable=True)
    status = Column(String, default=RequestStatus.active)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="requests")
    responses = relationship("RequestResponse", back_populates="request")

class RequestResponse(Base):
    __tablename__ = "request_responses"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default=ResponseStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("Request", back_populates="responses")
    user = relationship("User", back_populates="responses")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, nullable=False)
    is_read = Column(Integer, default=0)  # 0 = не прочитано, 1 = прочитано
    related_request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="notifications")
