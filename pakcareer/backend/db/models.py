"""SQLAlchemy ORM models.

PostgreSQL: uses JSONB for rich columns.
SQLite (local dev): falls back to JSON (stored as text, same Python API).
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base

# Use JSONB on PostgreSQL, JSON on SQLite
if os.environ.get("DATABASE_URL", "").startswith("postgresql"):
    from sqlalchemy.dialects.postgresql import JSONB as _JSON
else:
    from sqlalchemy import JSON as _JSON  # type: ignore[assignment]


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Orgs ─────────────────────────────────────────────────────────────────────

class Org(Base):
    __tablename__ = "orgs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invite_code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    org_type: Mapped[str] = mapped_column(String(32), nullable=False, default="school")
    # e.g. "school" | "university" | "counsellor"
    # SHA-256 of the counsellor's secret dashboard key (see security.py)
    key_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)

    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="org", lazy="dynamic")

    def to_dict(self) -> dict:
        return {"id": self.id, "invite_code": self.invite_code, "name": self.name, "org_type": self.org_type}

    def public_dict(self) -> dict:
        """What a student may see when checking an invite code."""
        return {"invite_code": self.invite_code, "name": self.name}


# ── Sessions ──────────────────────────────────────────────────────────────────

class Session(Base):
    __tablename__ = "sessions"

    # Identity
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )

    # Org link (nullable — anonymous public sessions)
    org_code: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("orgs.invite_code"), nullable=True, index=True
    )
    org: Mapped[Org | None] = relationship("Org", back_populates="sessions")

    # Demographics
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    education: Mapped[str] = mapped_column(String(64), nullable=False)
    familysize: Mapped[int] = mapped_column(Integer, nullable=False)
    urban: Mapped[str] = mapped_column(String(16), nullable=False)   # rural|suburban|urban|unknown
    engnat: Mapped[str] = mapped_column(String(16), nullable=False)  # native|non_native|unknown

    # Prediction outputs
    holland_code: Mapped[str] = mapped_column(String(16), nullable=False)   # e.g. "I-C-R"
    top1_house: Mapped[str] = mapped_column(String(64), nullable=False)
    top1_prob: Mapped[float] = mapped_column(Float, nullable=False)

    # Rich JSON blobs (JSONB on Postgres, JSON/text on SQLite)
    top3: Mapped[dict] = mapped_column(_JSON, nullable=False)
    all_results: Mapped[dict] = mapped_column(_JSON, nullable=False)
    profile: Mapped[dict] = mapped_column(_JSON, nullable=False)
    student_meta: Mapped[dict] = mapped_column(_JSON, nullable=False, default=dict)
    # student_meta: { raw_riasec, raw_tipi, vocab_checked }

    # Counsellor notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "session_id": self.id,
            "created_at": self.created_at.isoformat(),
            "org_code": self.org_code,
            "age": self.age,
            "education": self.education,
            "familysize": self.familysize,
            "urban": self.urban,
            "engnat": self.engnat,
            "holland_code": self.holland_code,
            "top1_house": self.top1_house,
            "top1_prob": self.top1_prob,
            "top3": self.top3,
            "all_results": self.all_results,
            "profile": self.profile,
            "student_meta": self.student_meta,
            "notes": self.notes,
        }

    def public_dict(self) -> dict:
        """Result view for the student's own share link: no raw answers, no notes."""
        return {
            "session_id": self.id,
            "created_at": self.created_at.isoformat(),
            "age": self.age,
            "education": self.education,
            "holland_code": self.holland_code,
            "top1_house": self.top1_house,
            "top1_prob": self.top1_prob,
            "top3": self.top3,
            "all_results": self.all_results,
            "profile": self.profile,
        }

