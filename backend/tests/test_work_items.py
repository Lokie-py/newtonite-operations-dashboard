from app.models.user import User
from app.models.team import Team
from app.models.membership import Membership
from app.models.work_item import WorkItem
from app.schemas.work_item import WorkItemUpdate
from app.services.work_item_service import update_work_item
import pytest
from app.models.activity import Activity
from app.models.comment import Comment
from app.schemas.comment import CommentCreate
from app.services.comment_service import add_comment, list_comments


def test_update_work_item_increments_version(db_session):
    user = User(
        email="workitem-test@example.com",
        full_name="Work Item Tester",
        password_hash="test-hash",
        is_active=True,
    )
    team = Team(
        name="Work Item Test Team",
        description="Team for automated tests",
    )

    db_session.add_all([user, team])
    db_session.flush()

    db_session.add(
        Membership(
            user_id=user.id,
            team_id=team.id,
            role="admin",
        )
    )

    item = WorkItem(
        title="Test concurrency",
        description="Initial description",
        status="open",
        priority="medium",
        team_id=team.id,
        created_by_id=user.id,
        assigned_to_id=None,
        version=1,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    updated_item = update_work_item(
        db=db_session,
        item_id=item.id,
        item_data=WorkItemUpdate(
            status="in_progress",
            expected_version=1,
        ),
        current_user=user,
    )

    assert updated_item.status == "in_progress"
    assert updated_item.version == 2


def test_stale_work_item_update_is_rejected(db_session):
    user = User(
        email="stale-test@example.com",
        full_name="Stale Update Tester",
        password_hash="test-hash",
        is_active=True,
    )
    team = Team(
        name="Stale Update Test Team",
        description="Team for stale update testing",
    )

    db_session.add_all([user, team])
    db_session.flush()

    db_session.add(
        Membership(
            user_id=user.id,
            team_id=team.id,
            role="admin",
        )
    )

    item = WorkItem(
        title="Stale update test",
        description="Initial description",
        status="open",
        priority="medium",
        team_id=team.id,
        created_by_id=user.id,
        version=1,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    # First update succeeds and advances the version to 2.
    update_work_item(
        db=db_session,
        item_id=item.id,
        item_data=WorkItemUpdate(
            status="in_progress",
            expected_version=1,
        ),
        current_user=user,
    )

    # A second update using stale version 1 must be rejected.
    with pytest.raises(
        ValueError,
        match="modified by another request",
    ):
        update_work_item(
            db=db_session,
            item_id=item.id,
            item_data=WorkItemUpdate(
                status="completed",
                expected_version=1,
            ),
            current_user=user,
        )


def test_non_member_cannot_update_work_item(db_session):
    owner = User(
        email="owner-auth-test@example.com",
        full_name="Team Owner",
        password_hash="test-hash",
        is_active=True,
    )
    outsider = User(
        email="outsider-auth-test@example.com",
        full_name="Outside User",
        password_hash="test-hash",
        is_active=True,
    )
    team = Team(
        name="Authorization Test Team",
        description="Team for access control tests",
    )

    db_session.add_all([owner, outsider, team])
    db_session.flush()

    db_session.add(
        Membership(
            user_id=owner.id,
            team_id=team.id,
            role="admin",
        )
    )

    item = WorkItem(
        title="Protected work item",
        description="Only team members can update this",
        status="open",
        priority="medium",
        team_id=team.id,
        created_by_id=owner.id,
        version=1,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    with pytest.raises(
        ValueError,
        match="not found or access denied",
    ):
        update_work_item(
            db=db_session,
            item_id=item.id,
            item_data=WorkItemUpdate(
                status="completed",
                expected_version=1,
            ),
            current_user=outsider,
        )


def test_successful_update_records_activity(db_session):
    user = User(
        email="activity-test@example.com",
        full_name="Activity Tester",
        password_hash="test-hash",
        is_active=True,
    )
    team = Team(
        name="Activity Test Team",
        description="Team for activity logging tests",
    )

    db_session.add_all([user, team])
    db_session.flush()

    db_session.add(
        Membership(
            user_id=user.id,
            team_id=team.id,
            role="admin",
        )
    )

    item = WorkItem(
        title="Activity logging test",
        description="Check update history",
        status="open",
        priority="medium",
        team_id=team.id,
        created_by_id=user.id,
        version=1,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    updated_item = update_work_item(
        db=db_session,
        item_id=item.id,
        item_data=WorkItemUpdate(
            status="completed",
            expected_version=1,
        ),
        current_user=user,
    )

    activity = (
        db_session.query(Activity)
        .filter_by(
            work_item_id=updated_item.id,
            action="work_item_updated",
        )
        .one()
    )

    assert activity.actor_id == user.id
    assert activity.details["changed_fields"] == ["status"]
    assert activity.details["previous_version"] == 1
    assert activity.details["new_version"] == 2


def test_team_member_can_add_and_list_comments(db_session):
    owner = User(
        email="comment-owner@example.com",
        full_name="Comment Owner",
        password_hash="test-hash",
        is_active=True,
    )
    team = Team(
        name="Comment Test Team",
        description="Team for comment tests",
    )

    db_session.add_all([owner, team])
    db_session.flush()

    db_session.add(
        Membership(
            user_id=owner.id,
            team_id=team.id,
            role="admin",
        )
    )

    item = WorkItem(
        title="Comment test item",
        status="open",
        priority="medium",
        team_id=team.id,
        created_by_id=owner.id,
        version=1,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    comment = add_comment(
        db=db_session,
        work_item_id=item.id,
        comment_data=CommentCreate(content="  This is a test comment.  "),
        current_user=owner,
    )

    assert comment.content == "This is a test comment."
    assert comment.author_id == owner.id

    comments = list_comments(
        db=db_session,
        work_item_id=item.id,
        current_user=owner,
    )

    assert len(comments) == 1
    assert comments[0].id == comment.id


def test_non_member_cannot_add_comment(db_session):
    owner = User(
        email="comment-owner-2@example.com",
        full_name="Comment Owner",
        password_hash="test-hash",
        is_active=True,
    )
    outsider = User(
        email="comment-outsider@example.com",
        full_name="Comment Outsider",
        password_hash="test-hash",
        is_active=True,
    )
    team = Team(
        name="Comment Authorization Team",
        description="Team for comment access tests",
    )

    db_session.add_all([owner, outsider, team])
    db_session.flush()

    db_session.add(
        Membership(
            user_id=owner.id,
            team_id=team.id,
            role="admin",
        )
    )

    item = WorkItem(
        title="Protected comment item",
        status="open",
        priority="medium",
        team_id=team.id,
        created_by_id=owner.id,
        version=1,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    with pytest.raises(
        ValueError,
        match="not found or access denied",
    ):
        add_comment(
            db=db_session,
            work_item_id=item.id,
            comment_data=CommentCreate(content="This should be rejected."),
            current_user=outsider,
        )
