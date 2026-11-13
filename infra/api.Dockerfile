# Context = root repo (butuh services/api dan data/sample). Kode di /srv/services/api agar path demo_reset cocok.
FROM python:3.11-slim
WORKDIR /srv/services/api
COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/api/ .
COPY data/ /srv/data/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
