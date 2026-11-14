# Context = root repo atau services/api. Kode di /srv/services/api.
FROM python:3.11-slim
WORKDIR /srv/services/api
COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/api/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
