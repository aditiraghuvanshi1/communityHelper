"""Auth plumbing: bcrypt password hashing, JWT session cookies, FastAPI dependencies.

Role model (RBAC, single scope): every account is `citizen` or `admin`. Admin-only
routers declare `dependencies=[Depends(require_admin)]`. The principal is re-derived
from the database on every request — token claims never carry the role, and role is
never read from request bodies.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from passlib.context import CryptContext

from lib.db import db

SESSION_COOKIE = "cc_session"
SESSION_TTL_HOURS = 24 * 7
_ALGO = "HS256"
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _secret() -> str:
    secret = os.environ.get("SESSION_SECRET", "")
    if not secret:
        raise RuntimeError("SESSION_SECRET is not set in backend/.env")
    return secret


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _pwd.verify(password, password_hash)


def create_session_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS),
    }
    return jwt.encode(payload, _secret(), algorithm=_ALGO)


def set_session_cookie(response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_TTL_HOURS * 3600,
        path="/",
    )


def clear_session_cookie(response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/")


async def current_user(request: Request):
    """The signed-in user document, or None for anonymous visitors."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    try:
        payload = jwt.decode(token, _secret(), algorithms=[_ALGO])
    except JWTError:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})


async def require_user(user: dict | None = Depends(current_user)) -> dict:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to continue")
    return user


async def require_admin(user: dict = Depends(require_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user
