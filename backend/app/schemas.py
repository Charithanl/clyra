from typing import Literal

from pydantic import BaseModel, Field


class OnboardingRequest(BaseModel):
    account_type: Literal["brand", "creator"]
    profile_data: dict = Field(default_factory=dict)


class OnboardingResponse(BaseModel):
    user_id: str
    account_type: Literal["brand", "creator"]
    profile_data: dict
