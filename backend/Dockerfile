FROM python:3.11-slim

WORKDIR /app

# Copy requirements file first to leverage docker caching
COPY backend/requirements.txt ./backend/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend and frontend source directories
COPY backend/ ./backend/
COPY frontend/ ./frontend/

EXPOSE 5000

# Set default env variables (can be overridden in docker-compose.yml)
ENV MYSQL_HOST=mysql
ENV MYSQL_USER=root
ENV MYSQL_PASSWORD=password
ENV MYSQL_DB=appdb

# Run flask app
CMD ["python", "backend/app.py"]
