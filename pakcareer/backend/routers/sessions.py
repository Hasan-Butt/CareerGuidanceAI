"""Sessions router — GET/PATCH /api/sessions/...

The list, analytics and notes endpoints are counsellor-only: they need the
organisation's access key (X-Org-Key) and only ever see that organisation's
students. A single session can also be opened by its unguessable ID (the
student's own share link), but then only the result is returned, not the
raw answers or the counsellor's notes.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DBSession

from db.database import get_db
from db.models import Org
from db.models import Session as SessionModel
from security import current_org, optional_org
from services.report_pdf import build_parents_report_pdf

router = APIRouter(tags=["sessions"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class NotesUpdate(BaseModel):
    notes: str = Field(..., max_length=5000)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _owned_session(session_id: str, org: Org, db: DBSession) -> SessionModel:
    row = db.get(SessionModel, session_id)
    # Same 404 whether the session is missing or belongs to another org,
    # so a counsellor cannot probe other schools' session IDs.
    if not row or row.org_code != org.invite_code:
        raise HTTPException(status_code=404, detail="Session not found")
    return row


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/sessions")
def list_sessions(
    limit: int = Query(40, ge=1, le=200),
    offset: int = Query(0, ge=0),
    org: Org = Depends(current_org),
    db: DBSession = Depends(get_db),
):
    q = (
        select(SessionModel)
        .where(SessionModel.org_code == org.invite_code)
        .order_by(SessionModel.created_at.desc())
    )
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    rows = db.scalars(q.limit(limit).offset(offset)).all()
    return {
        "total": total,
        "sessions": [r.to_dict() for r in rows],
    }


@router.get("/sessions/analytics")
def get_analytics(org: Org = Depends(current_org), db: DBSession = Depends(get_db)):
    rows = db.scalars(select(SessionModel).where(SessionModel.org_code == org.invite_code)).all()

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
def get_session(
    session_id: str,
    org: Org | None = Depends(optional_org),
    db: DBSession = Depends(get_db),
):
    row = db.get(SessionModel, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    if org is not None and row.org_code == org.invite_code:
        return row.to_dict()        # the student's counsellor: full record
    return row.public_dict()        # share link: results only


@router.patch("/sessions/{session_id}/notes")
def update_notes(
    session_id: str,
    body: NotesUpdate,
    org: Org = Depends(current_org),
    db: DBSession = Depends(get_db),
):
    row = _owned_session(session_id, org, db)
    row.notes = body.notes
    db.commit()
    return {"session_id": session_id, "notes": row.notes}


@router.get("/sessions/{session_id}/pdf")
def download_pdf(session_id: str, db: DBSession = Depends(get_db)):
    # Opened by plain link (no headers), like the share link. The PDF holds
    # only the results summary, not raw answers or notes.
    row = db.get(SessionModel, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    # (The old call passed all_results/age/education, which this function does
    # not accept, so every PDF download returned a 500 error.)
    pdf_bytes: bytes = build_parents_report_pdf(
        top3=row.top3,
        all_houses=row.all_results,
        profile=row.profile,
        student_meta={
            "age": row.age,
            "education": row.education,
            "org_name": row.org.name if row.org else None,
        },
        session_id=row.id,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="pakcareer_{row.id[:8]}.pdf"'
        },
    )
