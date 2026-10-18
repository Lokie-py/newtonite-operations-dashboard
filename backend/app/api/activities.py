from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.services.activity_service import (
    list_all_activities,
    list_work_item_activities,
)

router = APIRouter(tags=["Activity History"])


@router.get(
    "/activities/",
    response_model=list[ActivityResponse],
)
def get_all_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_all_activities(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/work-items/{work_item_id}/activities/",
    response_model=list[ActivityResponse],
)
def get_work_item_activities(
    work_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return list_work_item_activities(
            db=db,
            work_item_id=work_item_id,
            current_user=current_user,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
