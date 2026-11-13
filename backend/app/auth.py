from fastapi import Header, HTTPException, status
from jwt import PyJWKClient, decode

from app.core.config import settings


def get_current_user(authorization: str | None = Header(default=None), x_dev_user_id: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        if settings.environment == "development" and x_dev_user_id:
            return x_dev_user_id
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Clerk session token")
    if not settings.clerk_jwks_url:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Clerk JWKS URL is not configured")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        signing_key = PyJWKClient(settings.clerk_jwks_url).get_signing_key_from_jwt(token).key
        claims = decode(token, signing_key, algorithms=["RS256"], issuer=settings.clerk_issuer or None, options={"verify_aud": False})
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Clerk session token") from exc
    subject = claims.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Clerk token has no user subject")
    return subject
