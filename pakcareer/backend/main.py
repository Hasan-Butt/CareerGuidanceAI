"""PakCareer AI — FastAPI backend entry point."""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend root AND services/ are on sys.path so verbatim-copied modules
# (report_pdf.py, predictor.py) can resolve their bare imports like
# `from pakistan_stats import ...`
_BACKEND = Path(__file__).resolve().parent
for _p in [str(_BACKEND), str(_BACKEND / "services")]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import SessionLocal, init_db
from db.models import Org
from routers import orgs, predict, sessions

app = FastAPI(
    title="PakCareer AI API",
    version="2.0.0",
    description="XGBoost-powered degree guidance for Pakistani students.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(orgs.router, prefix="/api")


# ── Demo orgs seed ────────────────────────────────────────────────────────────

_DEMO_ORGS = [
    {"invite_code": "FAST-LAHORE",   "name": "FAST NUCES Lahore",         "org_type": "university"},
    {"invite_code": "COUNSEL-DEMO",  "name": "Demo Counsellor Account",   "org_type": "counsellor"},
    {"invite_code": "LGS-DEMO",      "name": "Lahore Grammar School Demo","org_type": "school"},
]


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        for d in _DEMO_ORGS:
            exists = db.query(Org).filter_by(invite_code=d["invite_code"]).first()
            if not exists:
                db.add(Org(**d))
        db.commit()
    finally:
        db.close()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}
