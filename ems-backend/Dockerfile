FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create storage directory
RUN mkdir -p /app/storage/events

EXPOSE 8000

# Development can override this command in docker-compose.yml. Never use reload in the image default.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
