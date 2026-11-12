from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_name: str = "NCRI API"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000"
    database_url: str = "postgresql+psycopg://ncri:ncri_dev_password@localhost:5432/ncri"
    max_upload_bytes: int = 5_000_000
    # Governance: true HANYA setelah ahli menyetujui definisi target prediksi (lihat docs/model-card.md)
    prediction_target_validated: bool = False
    app_env: str = "development"
    # Auth: sesi = JWT di cookie httpOnly. Di luar development, auth_secret WAJIB diisi (>= 32 karakter).
    auth_secret: str = "dev-only-insecure-secret-change-me"
    token_ttl_minutes: int = 480
    cookie_secure: bool = False        # True di HTTPS
    cookie_samesite: str = "lax"       # "none" bila web & API beda situs (wajib cookie_secure=True)
    login_rate_per_minute: int = 10
    login_max_failures: int = 5          # gagal login per email dalam login_lock_minutes => dikunci sementara
    login_lock_minutes: int = 15
    trusted_proxy_hops: int = 0          # jumlah reverse proxy tepercaya di depan API (0 = langsung ke internet)
    # LLM: kunci hanya di backend. llm_provider: "" (nonaktif) | "fake" (contoh deterministik, dev) | "anthropic"
    llm_provider: str = ""
    llm_model: str = "claude-sonnet-5-5"
    llm_api_key: str = ""
    llm_timeout_seconds: float = 60.0
    llm_rate_per_minute: int = 10


settings = Settings()
