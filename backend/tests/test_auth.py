from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_access_token, decode_access_token


def test_password_hash_and_verify():
    password = "TestPassword123!"

    hashed_password = hash_password(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("WrongPassword123!", hashed_password)


def test_create_and_decode_access_token():
    token = create_access_token(user_id=2)

    payload = decode_access_token(token)

    assert payload["sub"] == "2"
    assert "exp" in payload
