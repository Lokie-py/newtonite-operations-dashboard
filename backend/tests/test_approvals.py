import pytest

from app.models.activity import Activity
from app.models.approval import Approval
from app.models.membership import Membership
from app.models.team import Team
from app.models.user import User
from app.models.work_item import WorkItem
from app.schemas.approval import ApprovalCreate, ApprovalDecision
from app.services.approval_service import create_approval, decide_approval


def setup_approval_test(db_session):
    requester = User(
        email="approval-requester@example.com",
        full_name="Approval Requester",
        password_hash="test-hash",
        is_active=True,
    )
    reviewer = User(
        email="approval-reviewer@example.com",
        full_name="Approval Reviewer",
        password_hash="test-hash",
        is_active=True,
    )
    outsider = User(
        email="approval-outsider@example.com",
        full_name="Approval Outsider",
        password_hash="test-hash",
        is_active=True,
    )
    team = Team(
        name="Approval Test Team",
        description="Team for approval tests",
    )

    db_session.add_all([requester, reviewer, outsider, team])
    db_session.flush()

    db_session.add_all(
        [
            Membership(user_id=requester.id, team_id=team.id, role="admin"),
            Membership(user_id=reviewer.id, team_id=team.id, role="member"),
        ]
    )

    item = WorkItem(
        title="Approval test item",
        status="open",
        priority="medium",
        team_id=team.id,
        created_by_id=requester.id,
        version=1,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    return requester, reviewer, outsider, item


def test_create_approval_records_activity(db_session):
    requester, reviewer, _, item = setup_approval_test(db_session)

    approval = create_approval(
        db=db_session,
        approval_data=ApprovalCreate(
            work_item_id=item.id,
            reviewer_id=reviewer.id,
        ),
        current_user=requester,
    )

    assert approval.status == "pending"
    assert approval.requested_by_id == requester.id
    assert approval.reviewer_id == reviewer.id

    activity = (
        db_session.query(Activity)
        .filter_by(
            work_item_id=item.id,
            action="approval_requested",
        )
        .one()
    )

    assert activity.actor_id == requester.id
    assert activity.details["approval_id"] == approval.id


def test_assigned_reviewer_can_approve(db_session):
    requester, reviewer, _, item = setup_approval_test(db_session)

    approval = create_approval(
        db=db_session,
        approval_data=ApprovalCreate(
            work_item_id=item.id,
            reviewer_id=reviewer.id,
        ),
        current_user=requester,
    )

    result = decide_approval(
        db=db_session,
        approval_id=approval.id,
        decision=ApprovalDecision(
            status="approved",
            decision_note="Reviewed and approved.",
        ),
        current_user=reviewer,
    )

    assert result.status == "approved"
    assert result.reviewer_id == reviewer.id
    assert result.decision_note == "Reviewed and approved."
    assert result.decided_at is not None

    activity = (
        db_session.query(Activity)
        .filter_by(
            work_item_id=item.id,
            action="approval_decided",
        )
        .one()
    )

    assert activity.actor_id == reviewer.id
    assert activity.details["status"] == "approved"


def test_requester_cannot_approve_own_request(db_session):
    requester, reviewer, _, item = setup_approval_test(db_session)

    approval = create_approval(
        db=db_session,
        approval_data=ApprovalCreate(
            work_item_id=item.id,
            reviewer_id=reviewer.id,
        ),
        current_user=requester,
    )

    with pytest.raises(ValueError, match="cannot decide your own"):
        decide_approval(
            db=db_session,
            approval_id=approval.id,
            decision=ApprovalDecision(status="approved"),
            current_user=requester,
        )


def test_non_assigned_reviewer_cannot_decide_approval(db_session):
    requester, reviewer, outsider, item = setup_approval_test(db_session)

    # The outsider must be a team member to isolate the assigned-reviewer rule.
    db_session.add(
        Membership(
            user_id=outsider.id,
            team_id=item.team_id,
            role="member",
        )
    )
    db_session.commit()

    approval = create_approval(
        db=db_session,
        approval_data=ApprovalCreate(
            work_item_id=item.id,
            reviewer_id=reviewer.id,
        ),
        current_user=requester,
    )

    with pytest.raises(
        ValueError,
        match="Only the assigned reviewer",
    ):
        decide_approval(
            db=db_session,
            approval_id=approval.id,
            decision=ApprovalDecision(status="rejected"),
            current_user=outsider,
        )

def test_approval_cannot_be_decided_twice(db_session):
    requester, reviewer, _, item = setup_approval_test(db_session)

    approval = create_approval(
        db=db_session,
        approval_data=ApprovalCreate(
            work_item_id=item.id,
            reviewer_id=reviewer.id,
        ),
        current_user=requester,
    )

    decide_approval(
        db=db_session,
        approval_id=approval.id,
        decision=ApprovalDecision(
            status="approved",
            decision_note="First decision.",
        ),
        current_user=reviewer,
    )

    with pytest.raises(
        ValueError,
        match="already been decided",
    ):
        decide_approval(
            db=db_session,
            approval_id=approval.id,
            decision=ApprovalDecision(
                status="rejected",
                decision_note="Conflicting second decision.",
            ),
            current_user=reviewer,
        )
