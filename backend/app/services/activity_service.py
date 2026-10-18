from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.membership import Membership
from app.models.user import User
from app.models.work_item import WorkItem


def list_work_item_activities(
    db: Session,
    work_item_id: int,
    current_user: User,
) -> list[Activity]:
    has_access = db.scalar(
        select(WorkItem.id)
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(
            WorkItem.id == work_item_id,
            Membership.user_id == current_user.id,
        )
    )

    if has_access is None:
        raise ValueError("Work item not found or access denied")

    statement = (
        select(Activity)
        .where(Activity.work_item_id == work_item_id)
        .order_by(
            Activity.created_at.asc(),
            Activity.id.asc(),
        )
    )

    return list(db.scalars(statement).all())


def list_all_activities(
    db: Session,
    current_user: User,
) -> list[Activity]:
    statement = (
        select(Activity)
        .join(
            WorkItem,
            WorkItem.id == Activity.work_item_id,
        )
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(
            Membership.user_id == current_user.id,
        )
        .order_by(
            Activity.created_at.desc(),
            Activity.id.desc(),
        )
    )

    return list(db.scalars(statement).unique().all())
