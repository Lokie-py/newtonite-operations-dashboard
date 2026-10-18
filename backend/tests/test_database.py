
from sqlalchemy import text


def test_database_session_uses_test_database(db_session):
    database_name = db_session.execute(
        text("SELECT current_database()")
    ).scalar_one()

    assert database_name == "newtonite_test_db"


def test_database_session_can_execute_queries(db_session):
    result = db_session.execute(text("SELECT 1")).scalar_one()

    assert result == 1


def test_database_session_rolls_back_changes(db_session):
    db_session.execute(
        text("CREATE TEMP TABLE rollback_check (value INTEGER)")
    )
    db_session.execute(
        text("INSERT INTO rollback_check (value) VALUES (123)")
    )

    result = db_session.execute(
        text("SELECT value FROM rollback_check")
    ).scalar_one()

    assert result == 123
