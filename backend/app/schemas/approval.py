from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ApprovalStatus = Literal[
    "pending",
    "approved",
    "rejected",
]


class ApprovalCreate(BaseModel):
    work_item_id: int = Field(gt=0)
    reviewer_id: int | None = Field(default=None, gt=0)


class ApprovalDecision(BaseModel):
    status: Literal["approved", "rejected"]
    decision_note: str | None = Field(default=None, max_length=2000)


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    work_item_id: int
    requested_by_id: int
    reviewer_id: int | None
    status: ApprovalStatus
    decision_note: str | None
    created_at: datetime
    decided_at: datetime | None
