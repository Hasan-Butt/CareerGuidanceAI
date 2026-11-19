"""Orgs router — GET /api/orgs/..."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from db.database import get_db
from db.models import Org

router = APIRouter(tags=["orgs"])


@router.get("/orgs")
def list_orgs(db: DBSession = Depends(get_db)):
    orgs = db.scalars(select(Org)).all()
    return [o.to_dict() for o in orgs]


@router.get("/orgs/{invite_code}")
def get_org(invite_code: str, db: DBSession = Depends(get_db)):
    org = db.scalar(select(Org).where(Org.invite_code == invite_code))
    if not org:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    return org.to_dict()
