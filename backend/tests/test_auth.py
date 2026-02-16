import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token


def test_password_hashing():
    password = "TestPass123!"
    hashed = hash_password(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_tokens():
    token = create_access_token("1", {"role": "admin"})
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "1"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_invalid_token():
    payload = decode_token("invalid.token.here")
    assert payload is None
