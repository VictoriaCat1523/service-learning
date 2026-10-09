import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://devops_user:local_password_123@localhost:5432/auth_db"
)                             #database_urs изменен на os.getenv для postgresql

engine = create_engine(
    SQLALCHEMY_DATABASE_URL 
)                             # убрал connect_args={"check_same_thread": False}, лишний для PostgreSQL


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()