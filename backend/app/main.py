from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.onboarding import router as onboarding_router
from app.core.config import settings

app = FastAPI(title="Clyra API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(onboarding_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "clyra-api"}
