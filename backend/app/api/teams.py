from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamMemberResponse,
    TeamResponse,
)

from app.services.team_service import (
    add_team_member,
    create_team,
    list_team_members,
    list_user_teams,
)

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post(
    "/",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_team_endpoint(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_team(db, team_data, current_user)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A team with this name already exists",
        ) from exc


@router.get("/", response_model=list[TeamResponse])
def get_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_user_teams(db, current_user)


@router.get(
    "/{team_id}/members",
    response_model=list[TeamMemberResponse],
)
def get_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return list_team_members(db, team_id, current_user)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/{team_id}/members/{user_id}",
    status_code=status.HTTP_201_CREATED,
)
def add_team_member_endpoint(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        membership = add_team_member(
            db=db,
            team_id=team_id,
            user_id=user_id,
            current_user=current_user,
        )

        return {
            "id": membership.id,
            "team_id": membership.team_id,
            "user_id": membership.user_id,
            "role": membership.role,
            "joined_at": membership.joined_at,
        }

    except ValueError as exc:
        message = str(exc)

        if message == "Only team admins can add members":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message,
            ) from exc

        if message == "Team not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            ) from exc

        if message == "Active user not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            ) from exc

        if message == "User is already a member of this team":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from exc
