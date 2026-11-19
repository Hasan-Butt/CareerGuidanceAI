"""PakCareer AI — FastAPI backend entry point."""
from __future__ import annotations

import logging
import os
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
from security import hash_key, new_access_key

log = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="PakCareer AI API",
    version="2.0.0",
    description="XGBoost-powered degree guidance for Pakistani students.",
)

# Only the frontend may call the API from a browser. The old setting
# (any origin + credentials) let every website read the API as the visitor.
_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-Org-Key"],
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


# Demo dashboard keys are written here (gitignored) the first time they are made.
_DEMO_KEYS_FILE = _BACKEND.parent / "demo_keys.local.txt"


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = SessionLocal()
    new_keys: list[tuple[str, str]] = []
    try:
        for d in _DEMO_ORGS:
            org = db.query(Org).filter_by(invite_code=d["invite_code"]).first()
            if not org:
                org = Org(**d)
                db.add(org)
            if not org.key_hash:
                # ORG_KEY_FAST_LAHORE=... etc. pins a key; otherwise make a random one.
                env_name = "ORG_KEY_" + d["invite_code"].replace("-", "_")
                key = os.environ.get(env_name) or new_access_key()
                org.key_hash = hash_key(key)
                new_keys.append((d["invite_code"], key))
        db.commit()
    finally:
        db.close()

    if new_keys:
        lines = [f"{code}: {key}" for code, key in new_keys]
        with open(_DEMO_KEYS_FILE, "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        log.warning("New counsellor dashboard keys (also saved to %s):\n  %s",
                    _DEMO_KEYS_FILE, "\n  ".join(lines))


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}
