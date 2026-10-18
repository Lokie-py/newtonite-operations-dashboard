from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.approval import Approval
from app.models.membership import Membership
from app.models.user import User
from app.models.work_item import WorkItem
from app.schemas.approval import ApprovalCreate, ApprovalDecision


def create_approval(
    db: Session,
    approval_data: ApprovalCreate,
    current_user: User,
) -> Approval:
    work_item = db.scalar(
        select(WorkItem)
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(
            WorkItem.id == approval_data.work_item_id,
            Membership.user_id == current_user.id,
        )
    )

    if work_item is None:
        raise ValueError("Work item not found or access denied")

    if approval_data.reviewer_id is not None:
        reviewer = db.get(User, approval_data.reviewer_id)

        if reviewer is None or not reviewer.is_active:
            raise ValueError("Reviewer does not exist or is inactive")

        reviewer_membership = db.scalar(
            select(Membership).where(
                Membership.user_id == reviewer.id,
                Membership.team_id == work_item.team_id,
            )
        )

        if reviewer_membership is None:
            raise ValueError("Reviewer must belong to the work item's team")

    approval = Approval(
        work_item_id=work_item.id,
        requested_by_id=current_user.id,
        reviewer_id=approval_data.reviewer_id,
        status="pending",
    )

    try:
        db.add(approval)
        db.flush()

        db.add(
            Activity(
                work_item_id=work_item.id,
                actor_id=current_user.id,
                action="approval_requested",
                details={
                    "approval_id": approval.id,
                    "reviewer_id": approval.reviewer_id,
                },
            )
        )

        db.commit()
        db.refresh(approval)
        return approval

    except Exception:
        db.rollback()
        raise


def list_approvals(
    db: Session,
    current_user: User,
    work_item_id: int | None = None,
) -> list[Approval]:
    statement = (
        select(Approval)
        .join(
            WorkItem,
            WorkItem.id == Approval.work_item_id,
        )
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(Membership.user_id == current_user.id)
    )

    if work_item_id is not None:
        statement = statement.where(Approval.work_item_id == work_item_id)

    statement = statement.order_by(
        Approval.created_at.desc(),
        Approval.id.desc(),
    )

    return list(db.scalars(statement).all())


def decide_approval(
    db: Session,
    approval_id: int,
    decision: ApprovalDecision,
    current_user: User,
) -> Approval:
    approval = db.scalar(
        select(Approval)
        .join(
            WorkItem,
            WorkItem.id == Approval.work_item_id,
        )
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(
            Approval.id == approval_id,
            Membership.user_id == current_user.id,
        )
    )

    if approval is None:
        raise ValueError("Approval not found or access denied")

    if approval.status != "pending":
        raise ValueError("This approval has already been decided")

    if approval.requested_by_id == current_user.id:
        raise ValueError("You cannot decide your own approval request")

    if approval.reviewer_id is not None and approval.reviewer_id != current_user.id:
        raise ValueError("Only the assigned reviewer can decide this approval")

    try:
        # Conditional update protects against two reviewers deciding at once.
        result = db.execute(
            Approval.__table__.update()
            .where(
                Approval.id == approval_id,
                Approval.status == "pending",
            )
            .values(
                status=decision.status,
                decision_note=decision.decision_note,
                reviewer_id=current_user.id,
                decided_at=datetime.now(timezone.utc),
            )
        )

        if result.rowcount != 1:
            db.rollback()
            raise ValueError(
                "This approval has already been decided; refresh and retry"
            )

        db.add(
            Activity(
                work_item_id=approval.work_item_id,
                actor_id=current_user.id,
                action="approval_decided",
                details={
                    "approval_id": approval_id,
                    "status": decision.status,
                    "decision_note": decision.decision_note,
                },
            )
        )

        db.commit()

        updated_approval = db.get(Approval, approval_id)
        if updated_approval is None:
            raise RuntimeError("Approval could not be reloaded")

        return updated_approval

    except Exception:
        db.rollback()
        raise
