"""Sessions router — GET/PATCH /api/sessions/..."""
from __future__ import annotations

import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DBSession

from db.database import get_db
from db.models import Session as SessionModel
from services.report_pdf import build_parents_report_pdf

router = APIRouter(tags=["sessions"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class NotesUpdate(BaseModel):
    notes: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/sessions")
def list_sessions(
    org_code: str | None = None,
    limit: int = 40,
    offset: int = 0,
    db: DBSession = Depends(get_db),
):
    q = select(SessionModel).order_by(SessionModel.created_at.desc())
    if org_code:
        q = q.where(SessionModel.org_code == org_code)
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    rows = db.scalars(q.limit(limit).offset(offset)).all()
    return {
        "total": total,
        "sessions": [r.to_dict() for r in rows],
    }


@router.get("/sessions/analytics")
def get_analytics(org_code: str | None = None, db: DBSession = Depends(get_db)):
    q = select(SessionModel)
    if org_code:
        q = q.where(SessionModel.org_code == org_code)
    rows = db.scalars(q).all()

    if not rows:
        return {"total": 0, "house_distribution": {}, "holland_distribution": {}, "urban_split": {}}

    house_dist: dict[str, int] = {}
    holland_dist: dict[str, int] = {}
    urban_split: dict[str, int] = {}

    for r in rows:
        house_dist[r.top1_house] = house_dist.get(r.top1_house, 0) + 1
        holland_dist[r.holland_code] = holland_dist.get(r.holland_code, 0) + 1
        urban_split[r.urban] = urban_split.get(r.urban, 0) + 1

    return {
        "total": len(rows),
        "house_distribution": house_dist,
        "holland_distribution": holland_dist,
        "urban_split": urban_split,
    }


@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: DBSession = Depends(get_db)):
    row = db.get(SessionModel, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return row.to_dict()


@router.patch("/sessions/{session_id}/notes")
def update_notes(
    session_id: str,
    body: NotesUpdate,
    db: DBSession = Depends(get_db),
):
    row = db.get(SessionModel, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    row.notes = body.notes
    db.commit()
    return {"session_id": session_id, "notes": row.notes}


@router.get("/sessions/{session_id}/pdf")
def download_pdf(session_id: str, db: DBSession = Depends(get_db)):
    row = db.get(SessionModel, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build PDF using existing report_pdf service (verbatim copy)
    pdf_bytes: bytes = build_parents_report_pdf(
        top3=row.top3,
        all_results=row.all_results,
        profile=row.profile,
        age=row.age,
        education=row.education,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="pakcareer_{session_id[:8]}.pdf"'
        },
    )
