from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    user_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    account_type: Mapped[str] = mapped_column(String(20), nullable=False)
    profile_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
