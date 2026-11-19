"""Orgs router — /api/orgs/...

Invite codes are public (students type them in), but the list of all
organisations is not, and only the operator can create new ones.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from db.database import get_db
from db.models import Org
from security import current_org, hash_key, new_access_key, require_admin

router = APIRouter(tags=["orgs"])


class OrgCreate(BaseModel):
    invite_code: str = Field(..., min_length=3, max_length=32, pattern=r"^[A-Za-z0-9-]+$")
    name: str = Field(..., min_length=2, max_length=128)
    org_type: str = Field("school", pattern=r"^(school|university|counsellor)$")


@router.get("/orgs/me")
def who_am_i(org: Org = Depends(current_org)):
    """Dashboard login check: which organisation does this access key belong to?"""
    return org.to_dict()


@router.post("/orgs", status_code=201, dependencies=[Depends(require_admin)])
def create_org(body: OrgCreate, db: DBSession = Depends(get_db)):
    """Operator-only: register a school and return its dashboard key (shown once)."""
    code = body.invite_code.upper()
    if db.scalar(select(Org).where(Org.invite_code == code)):
        raise HTTPException(status_code=409, detail="Invite code already exists")
    key = new_access_key()
    org = Org(invite_code=code, name=body.name, org_type=body.org_type, key_hash=hash_key(key))
    db.add(org)
    db.commit()
    return {**org.to_dict(), "access_key": key}


@router.get("/orgs/{invite_code}")
def get_org(invite_code: str, db: DBSession = Depends(get_db)):
    """Public: lets the assessment check an invite code before the student starts."""
    org = db.scalar(select(Org).where(Org.invite_code == invite_code.strip().upper()))
    if not org:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    return org.public_dict()
