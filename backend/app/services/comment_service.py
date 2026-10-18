from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.membership import Membership
from app.models.user import User
from app.models.work_item import WorkItem
from app.schemas.comment import CommentCreate


def add_comment(
    db: Session,
    work_item_id: int,
    comment_data: CommentCreate,
    current_user: User,
) -> Comment:
    # Verify that the user belongs to the work item's team.
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

    content = comment_data.content.strip()

    if not content:
        raise ValueError("Comment cannot be empty")

    comment = Comment(
        work_item_id=work_item_id,
        author_id=current_user.id,
        content=content,
    )

    try:
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment
    except Exception:
        db.rollback()
        raise


def list_comments(
    db: Session,
    work_item_id: int,
    current_user: User,
) -> list[Comment]:
    # Check team access before returning any comments.
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
        select(Comment)
        .where(Comment.work_item_id == work_item_id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
    )

    return list(db.scalars(statement).all())
