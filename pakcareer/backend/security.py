"""Counsellor authentication for the dashboard endpoints.

Students never log in: they take the test anonymously and may type a public
invite code to link their result to a school. Counsellors read those results,
so every dashboard endpoint needs the organisation's secret access key, sent
in the ``X-Org-Key`` header. Only a SHA-256 hash of each key is stored.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from db.database import get_db
from db.models import Org


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def new_access_key() -> str:
    return secrets.token_urlsafe(18)


def current_org(
    x_org_key: str | None = Header(default=None, max_length=128),
    db: DBSession = Depends(get_db),
) -> Org:
    """Dependency: the organisation that owns the supplied access key."""
    if not x_org_key:
        raise HTTPException(status_code=401, detail="Counsellor access key required")
    org = db.scalar(select(Org).where(Org.key_hash == hash_key(x_org_key)))
    if org is None:
        raise HTTPException(status_code=401, detail="Invalid access key")
    return org


def optional_org(
    x_org_key: str | None = Header(default=None, max_length=128),
    db: DBSession = Depends(get_db),
) -> Org | None:
    """Like current_org, but returns None instead of failing."""
    if not x_org_key:
        return None
    return db.scalar(select(Org).where(Org.key_hash == hash_key(x_org_key)))


def require_admin(x_admin_key: str | None = Header(default=None, max_length=256)) -> None:
    """Dependency: only the operator (ADMIN_KEY env var) may create organisations."""
    expected = os.environ.get("ADMIN_KEY")
    if not expected:
        raise HTTPException(status_code=403, detail="Organisation creation is disabled (ADMIN_KEY not set)")
    if not x_admin_key or not hmac.compare_digest(x_admin_key, expected):
        raise HTTPException(status_code=403, detail="Invalid admin key")
