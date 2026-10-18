from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.membership import Membership
from app.models.user import User
from app.models.work_item import WorkItem
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate


def create_work_item(
    db: Session,
    item_data: WorkItemCreate,
    current_user: User,
) -> WorkItem:
    creator_membership = db.scalar(
        select(Membership).where(
            Membership.user_id == current_user.id,
            Membership.team_id == item_data.team_id,
        )
    )

    if creator_membership is None:
        raise ValueError("You are not a member of this team")

    if item_data.assigned_to_id is not None:
        assignee = db.get(User, item_data.assigned_to_id)

        if assignee is None or not assignee.is_active:
            raise ValueError("Assigned user does not exist or is inactive")

        assignee_membership = db.scalar(
            select(Membership).where(
                Membership.user_id == assignee.id,
                Membership.team_id == item_data.team_id,
            )
        )

        if assignee_membership is None:
            raise ValueError("Assignee must belong to the selected team")

    title = item_data.title.strip()

    if not title:
        raise ValueError("Title cannot be empty")

    item = WorkItem(
        title=title,
        description=item_data.description,
        status=item_data.status,
        priority=item_data.priority,
        team_id=item_data.team_id,
        created_by_id=current_user.id,
        assigned_to_id=item_data.assigned_to_id,
        version=1,
    )

    try:
        db.add(item)
        db.flush()

        db.add(
            Activity(
                work_item_id=item.id,
                actor_id=current_user.id,
                action="work_item_created",
                details={
                    "title": item.title,
                    "status": item.status,
                    "priority": item.priority,
                },
            )
        )

        db.commit()
        db.refresh(item)
        return item

    except Exception:
        db.rollback()
        raise


def list_work_items(
    db: Session,
    current_user: User,
    team_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    offset: int = 0,
    limit: int = 20,
    sort_by: str = "updatedAt",
    sort_order: str = "desc",
) -> tuple[list[WorkItem], int]:
    filters = [
        Membership.user_id == current_user.id,
    ]

    if team_id is not None:
        filters.append(WorkItem.team_id == team_id)

    if status is not None:
        filters.append(WorkItem.status == status)

    if priority is not None:
        filters.append(WorkItem.priority == priority)

    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                WorkItem.title.ilike(term),
                WorkItem.description.ilike(term),
            )
        )

    # Count matching records before pagination.
    count_statement = (
        select(func.count(WorkItem.id))
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(*filters)
    )
    total = db.scalar(count_statement) or 0

    # Only permit sorting by explicitly approved columns.
    sort_columns = {
        "title": WorkItem.title,
        "priority": WorkItem.priority,
        "status": WorkItem.status,
        "updatedAt": WorkItem.updated_at,
        "updated_at": WorkItem.updated_at,
        "createdAt": WorkItem.created_at,
        "created_at": WorkItem.created_at,
        "id": WorkItem.id,
    }

    sort_column = sort_columns.get(sort_by, WorkItem.updated_at)

    if sort_order.lower() == "asc":
        ordering = [sort_column.asc(), WorkItem.id.asc()]
    else:
        ordering = [sort_column.desc(), WorkItem.id.desc()]

    statement = (
        select(WorkItem)
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(*filters)
        .order_by(*ordering)
        .offset(offset)
        .limit(limit)
    )

    items = list(db.scalars(statement).all())

    return items, total


def update_work_item(
    db: Session,
    item_id: int,
    item_data: WorkItemUpdate,
    current_user: User,
) -> WorkItem:
    item = db.scalar(
        select(WorkItem)
        .join(
            Membership,
            Membership.team_id == WorkItem.team_id,
        )
        .where(
            WorkItem.id == item_id,
            Membership.user_id == current_user.id,
        )
    )

    if item is None:
        raise ValueError("Work item not found or access denied")

    changes = item_data.model_dump(
        exclude_unset=True,
        exclude={"expected_version"},
        exclude_none=True,
    )

    if not changes:
        raise ValueError("Provide at least one field to update")

    if "title" in changes:
        changes["title"] = changes["title"].strip()

        if not changes["title"]:
            raise ValueError("Title cannot be empty")

    target_team_id = changes.get("team_id", item.team_id)
    target_assignee_id = changes.get(
        "assigned_to_id",
        item.assigned_to_id,
    )

    if "team_id" in changes:
        team_membership = db.scalar(
            select(Membership).where(
                Membership.user_id == current_user.id,
                Membership.team_id == target_team_id,
            )
        )

        if team_membership is None:
            raise ValueError("You are not a member of the target team")

    if target_assignee_id is not None and (
        "assigned_to_id" in changes or "team_id" in changes
    ):
        assignee = db.get(User, target_assignee_id)

        if assignee is None or not assignee.is_active:
            raise ValueError("Assigned user does not exist or is inactive")

        assignee_membership = db.scalar(
            select(Membership).where(
                Membership.user_id == target_assignee_id,
                Membership.team_id == target_team_id,
            )
        )

        if assignee_membership is None:
            raise ValueError("Assignee must belong to the target team")

    old_version = item_data.expected_version

    try:
        result = db.execute(
            update(WorkItem)
            .where(
                WorkItem.id == item_id,
                WorkItem.team_id == item.team_id,
                WorkItem.version == item_data.expected_version,
            )
            .values(
                **changes,
                version=WorkItem.version + 1,
                updated_at=func.now(),
            )
        )

        if result.rowcount != 1:
            db.rollback()
            raise ValueError(
                "Work item was modified by another request; reload and retry"
            )

        db.add(
            Activity(
                work_item_id=item_id,
                actor_id=current_user.id,
                action="work_item_updated",
                details={
                    "changed_fields": list(changes.keys()),
                    "previous_version": old_version,
                    "new_version": old_version + 1,
                },
            )
        )

        db.commit()

        updated_item = db.get(WorkItem, item_id)

        if updated_item is None:
            raise RuntimeError("Updated work item could not be reloaded")

        return updated_item

    except Exception:
        db.rollback()
        raise
