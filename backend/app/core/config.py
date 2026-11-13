from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://clyra:clyra@localhost:5432/clyra"
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
