from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password


def register_user(db: Session, user_data: UserCreate) -> User:
    existing_user = db.scalar(select(User).where(User.email == user_data.email.lower()))

    if existing_user:
        raise ValueError("Email is already registered")

    user = User(
        email=user_data.email.lower(),
        full_name=user_data.full_name,
        password_hash=hash_password(user_data.password),
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = db.scalar(select(User).where(User.email == email.lower()))

    if user is None or not user.is_active:
        return None

    from app.utils.security import verify_password

    if not verify_password(password, user.password_hash):
        return None

    return user
