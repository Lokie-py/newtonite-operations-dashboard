from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MembershipRole = Literal[
    "member",
    "team_lead",
    "admin",
]


class MembershipCreate(BaseModel):
    user_id: int = Field(gt=0)
    team_id: int = Field(gt=0)
    role: MembershipRole = "member"


class MembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    team_id: int
    role: MembershipRole
    joined_at: datetime
