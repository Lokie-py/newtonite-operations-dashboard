from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.membership import Membership
from app.models.user import User
from app.models.work_item import WorkItem
from app.schemas.work_item import (
    WorkItemCreate,
    WorkItemResponse,
    WorkItemUpdate,
)
from app.services.work_item_service import (
    create_work_item,
    list_work_items,
    update_work_item,
)

router = APIRouter(prefix="/work-items", tags=["Work Items"])


class PriorityUpdateRequest(BaseModel):
    priority: Literal["low", "medium", "high", "urgent"]
    expected_version: int = Field(ge=1)


@router.post(
    "/",
    response_model=WorkItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_work_item_endpoint(
    item_data: WorkItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_work_item(db, item_data, current_user)

    except ValueError as exc:
        message = str(exc)

        if message == "You are not a member of this team":
            code = status.HTTP_403_FORBIDDEN
        elif message in {
            "Assigned user does not exist or is inactive",
            "Assignee must belong to the selected team",
        }:
            code = status.HTTP_400_BAD_REQUEST
        else:
            code = status.HTTP_422_UNPROCESSABLE_ENTITY

        raise HTTPException(status_code=code, detail=message) from exc


@router.get("/")
def get_work_items(
    team_id: int | None = Query(default=None, gt=0),
    status_filter: (
        Literal["open", "in_progress", "blocked", "completed"] | None
    ) = Query(default=None, alias="status"),
    priority: Literal["low", "medium", "high", "urgent"] | None = None,
    search: str | None = Query(default=None, max_length=200),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="updatedAt", alias="sortBy", max_length=30),
    sort_order: Literal["asc", "desc"] = Query(
        default="desc",
        alias="sortOrder",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        items, total = list_work_items(
            db=db,
            current_user=current_user,
            team_id=team_id,
            status=status_filter,
            priority=priority,
            search=search,
            offset=offset,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        return {
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get("/{item_id}", response_model=WorkItemResponse)
def get_work_item_endpoint(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(WorkItem)
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .filter(
            WorkItem.id == item_id,
            Membership.user_id == current_user.id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work item not found or access denied",
        )

    return item


@router.patch("/{item_id}", response_model=WorkItemResponse)
def update_work_item_endpoint(
    item_id: int,
    item_data: WorkItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return update_work_item(
            db=db,
            item_id=item_id,
            item_data=item_data,
            current_user=current_user,
        )

    except ValueError as exc:
        message = str(exc)

        if message == "Work item not found or access denied":
            code = status.HTTP_404_NOT_FOUND
        elif "modified by another request" in message:
            code = status.HTTP_409_CONFLICT
        elif "member" in message or "belong" in message:
            code = status.HTTP_403_FORBIDDEN
        elif "Assignee" in message or "Assigned user" in message:
            code = status.HTTP_400_BAD_REQUEST
        else:
            code = status.HTTP_422_UNPROCESSABLE_ENTITY

        raise HTTPException(
            status_code=code,
            detail=message,
        ) from exc


@router.post("/{item_id}/priority", response_model=WorkItemResponse)
def update_work_item_priority_endpoint(
    item_id: int,
    payload: PriorityUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        item_data = WorkItemUpdate(
            priority=payload.priority,
            expected_version=payload.expected_version,
        )

        return update_work_item(
            db=db,
            item_id=item_id,
            item_data=item_data,
            current_user=current_user,
        )

    except ValueError as exc:
        message = str(exc)

        if message == "Work item not found or access denied":
            code = status.HTTP_404_NOT_FOUND
        elif "modified by another request" in message:
            code = status.HTTP_409_CONFLICT
        elif "member" in message or "belong" in message:
            code = status.HTTP_403_FORBIDDEN
        elif "Assignee" in message or "Assigned user" in message:
            code = status.HTTP_400_BAD_REQUEST
        else:
            code = status.HTTP_422_UNPROCESSABLE_ENTITY

        raise HTTPException(
            status_code=code,
            detail=message,
        ) from exc
