from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import auth
from app.auth_routes import router as auth_router
from app.config import settings
from app.llm.routes import router as llm_router
from app.reports import router as reports_router
from app.submissions import router as submissions_router
from app.routes import public, router

auth.check_secret()  # gagal cepat bila konfigurasi tidak aman di luar development

app = FastAPI(title=settings.app_name, version="0.3.0", description="National Cultural Risk Intelligence API",
              dependencies=[Depends(auth.csrf_guard)])
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins.split(","), allow_credentials=True,
                   allow_methods=["*"], allow_headers=["content-type", auth.CSRF_HEADER])
for r in (public, auth_router, router, llm_router, reports_router, submissions_router):
    app.include_router(r, prefix=settings.api_v1_prefix)
