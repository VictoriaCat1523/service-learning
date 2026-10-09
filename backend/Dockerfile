FROM python:3.10-slim

# Системные зависимости для сборки библиотек базы данных
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Сначала копируем зависимости, чтобы Docker их кэшировал
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь остальной код
COPY . .

# Команда запуска (уточни у бэкендера, через что запускать: uvicorn, gunicorn или просто python main.py)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]