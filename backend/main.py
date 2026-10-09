from fastapi import FastAPI
import models
import database
from routes import router as requests_router

app = FastAPI(title="WITH", version="1.0.0")

models.Base.metadata.create_all(bind=database.engine)

app.include_router(requests_router)

@app.get("/")
def read_root():
    return {"message": "Добро пожаловать в WITH!"}