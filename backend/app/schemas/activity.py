from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    work_item_id: int
    actor_id: int
    action: str
    details: dict[str, Any] | None
    created_at: datetime
