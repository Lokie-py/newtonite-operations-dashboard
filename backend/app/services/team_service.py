
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.membership import Membership
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate


def create_team(
    db: Session,
    team_data: TeamCreate,
    current_user: User,
) -> Team:
    existing_team = db.scalar(
        select(Team).where(Team.name == team_data.name)
    )

    if existing_team:
        raise ValueError("A team with this name already exists")

    team = Team(
        name=team_data.name,
        description=team_data.description,
    )

    try:
        db.add(team)
        db.flush()

        membership = Membership(
            user_id=current_user.id,
            team_id=team.id,
            role="admin",
        )

        db.add(membership)
        db.commit()
        db.refresh(team)

        return team

    except Exception:
        db.rollback()
        raise


def list_user_teams(
    db: Session,
    current_user: User,
) -> list[Team]:
    statement = (
        select(Team)
        .join(Membership, Membership.team_id == Team.id)
        .where(Membership.user_id == current_user.id)
        .order_by(Team.id)
    )

    return list(db.scalars(statement).all())


def list_team_members(
    db: Session,
    team_id: int,
    current_user: User,
) -> list[User]:
    current_membership = db.scalar(
        select(Membership).where(
            Membership.team_id == team_id,
            Membership.user_id == current_user.id,
        )
    )

    if current_membership is None:
        raise ValueError("Team not found or access denied")

    statement = (
        select(User)
        .join(Membership, Membership.user_id == User.id)
        .where(
            Membership.team_id == team_id,
            User.is_active.is_(True),
        )
        .order_by(User.full_name, User.id)
    )

    return list(db.scalars(statement).all())


def add_team_member(
    db: Session,
    team_id: int,
    user_id: int,
    current_user: User,
    role: str = "member",
) -> Membership:
    # The requester must be an admin of this team.
    requester_membership = db.scalar(
        select(Membership).where(
            Membership.team_id == team_id,
            Membership.user_id == current_user.id,
        )
    )

    if requester_membership is None or requester_membership.role != "admin":
        raise ValueError("Only team admins can add members")

    team = db.get(Team, team_id)
    if team is None:
        raise ValueError("Team not found")

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise ValueError("Active user not found")

    existing_membership = db.scalar(
        select(Membership).where(
            Membership.team_id == team_id,
            Membership.user_id == user_id,
        )
    )

    if existing_membership is not None:
        raise ValueError("User is already a member of this team")

    membership = Membership(
        user_id=user_id,
        team_id=team_id,
        role=role,
    )

    try:
        db.add(membership)
        db.commit()
        db.refresh(membership)
        return membership
    except Exception:
        db.rollback()
        raise
