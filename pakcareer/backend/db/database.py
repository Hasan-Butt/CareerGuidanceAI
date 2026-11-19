"""Database engine and session factory.

Local dev  → SQLite  (DATABASE_URL not set, or set to sqlite:///...)
Production → PostgreSQL (set DATABASE_URL=postgresql+psycopg2://user:pass@host/db)
"""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# ── URL resolution ────────────────────────────────────────────────────────────
_DEFAULT_SQLITE = (
    "sqlite:///"
    + str(Path(__file__).resolve().parents[2] / "pakcareer.db")
)
DATABASE_URL: str = os.environ.get("DATABASE_URL", _DEFAULT_SQLITE)

# SQLite-specific: enable WAL mode + foreign keys
_IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _IS_SQLITE else {},
    echo=False,
)

if _IS_SQLITE:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables (dev convenience; production uses Alembic migrations)."""
    from db import models  # noqa: F401 — import triggers table registration
    Base.metadata.create_all(bind=engine)

    # Databases created before counsellor keys existed lack orgs.key_hash.
    cols = {c["name"] for c in inspect(engine).get_columns("orgs")}
    if "key_hash" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE orgs ADD COLUMN key_hash VARCHAR(64)"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_orgs_key_hash ON orgs (key_hash)"))

