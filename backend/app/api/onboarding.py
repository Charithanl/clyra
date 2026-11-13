from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import OnboardingProfile
from app.schemas import OnboardingRequest, OnboardingResponse

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


@router.post("", response_model=OnboardingResponse)
def save_onboarding(payload: OnboardingRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)) -> OnboardingResponse:
    profile = db.scalar(select(OnboardingProfile).where(OnboardingProfile.user_id == user_id))
    if profile is None:
        profile = OnboardingProfile(user_id=user_id, account_type=payload.account_type, profile_data=payload.profile_data)
        db.add(profile)
    else:
        profile.account_type = payload.account_type
        profile.profile_data = payload.profile_data
    db.commit()
    db.refresh(profile)
    return OnboardingResponse(user_id=profile.user_id, account_type=profile.account_type, profile_data=profile.profile_data)
