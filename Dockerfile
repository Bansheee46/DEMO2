# Используем официальный Python-образ
FROM python:3.10-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости
COPY requirements.txt ./

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем все файлы проекта
COPY . .

# Переменные окружения (можно переопределить при запуске)
ENV FLASK_ENV=production
ENV SECRET_KEY=замени_на_секретный_ключ

# Открываем порт (Flask по умолчанию 5000, gunicorn 8000)
EXPOSE 8000

# Запуск через gunicorn (более безопасно для продакшена)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "server:app"] 