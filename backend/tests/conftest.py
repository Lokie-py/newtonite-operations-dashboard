import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models
from app.db.base import Base


@pytest.fixture(scope="session")
def test_engine():
    database_url = os.environ.get("TEST_DATABASE_URL")

    if not database_url:
        pytest.fail("TEST_DATABASE_URL is not set.")

    if not database_url.endswith("/newtonite_test_db"):
        pytest.fail("Tests must use the dedicated newtonite_test_db database.")

    engine = create_engine(database_url, pool_pre_ping=True)

    # Create missing tables, but do not drop existing tables at shutdown.
    Base.metadata.create_all(bind=engine)

    yield engine

    engine.dispose()


@pytest.fixture
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()

    TestingSessionLocal = sessionmaker(
        bind=connection,
        autoflush=False,
        autocommit=False,
        join_transaction_mode="create_savepoint",
    )
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
