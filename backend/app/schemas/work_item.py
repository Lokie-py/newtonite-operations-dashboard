from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

WorkItemStatus = Literal[
    "open",
    "in_progress",
    "blocked",
    "completed",
]

WorkItemPriority = Literal[
    "low",
    "medium",
    "high",
    "urgent",
]


class WorkItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: WorkItemStatus = "open"
    priority: WorkItemPriority = "medium"
    team_id: int = Field(gt=0)
    assigned_to_id: int | None = Field(default=None, gt=0)


class WorkItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: WorkItemStatus | None = None
    priority: WorkItemPriority | None = None
    team_id: int | None = Field(default=None, gt=0)
    assigned_to_id: int | None = Field(default=None, gt=0)
    expected_version: int = Field(ge=1)


class WorkItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: str
    priority: str
    team_id: int
    created_by_id: int
    assigned_to_id: int | None
    version: int
    created_at: datetime
    updated_at: datetime
