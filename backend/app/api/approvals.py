from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalDecision,
    ApprovalResponse,
)
from app.services.approval_service import (
    create_approval,
    decide_approval,
    list_approvals,
)

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.post(
    "/",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_approval_endpoint(
    approval_data: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_approval(db, approval_data, current_user)
    except ValueError as exc:
        message = str(exc)

        if "not found or access denied" in message:
            code = status.HTTP_404_NOT_FOUND
        elif "Reviewer" in message:
            code = status.HTTP_400_BAD_REQUEST
        else:
            code = status.HTTP_422_UNPROCESSABLE_ENTITY

        raise HTTPException(status_code=code, detail=message) from exc


@router.get("/", response_model=list[ApprovalResponse])
def get_approvals(
    work_item_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_approvals(
        db=db,
        current_user=current_user,
        work_item_id=work_item_id,
    )


@router.post("/{approval_id}/decision", response_model=ApprovalResponse)
def decide_approval_endpoint(
    approval_id: int,
    decision: ApprovalDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return decide_approval(
            db=db,
            approval_id=approval_id,
            decision=decision,
            current_user=current_user,
        )
    except ValueError as exc:
        message = str(exc)

        if "not found or access denied" in message:
            code = status.HTTP_404_NOT_FOUND
        elif "already been decided" in message:
            code = status.HTTP_409_CONFLICT
        elif "assigned reviewer" in message or "own approval" in message:
            code = status.HTTP_403_FORBIDDEN
        else:
            code = status.HTTP_400_BAD_REQUEST

        raise HTTPException(status_code=code, detail=message) from exc
