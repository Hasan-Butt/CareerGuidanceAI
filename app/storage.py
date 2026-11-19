"""SQLite persistence for demo PAAS: orgs, assessment sessions, counsellor notes."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "app" / "sessions.db"

DEMO_ORGS = [
    ("FAST-LAHORE", "FAST NUCES Lahore", "university"),
    ("COUNSEL-DEMO", "Demo Counselling Centre", "counsellor"),
    ("LGS-DEMO", "LGS Demo Campus", "school"),
]


def _connect(db_path: Path | None = None) -> sqlite3.Connection:
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path | None = None) -> None:
    conn = _connect(db_path)
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS orgs (
                invite_code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                org_type TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                org_code TEXT,
                age INTEGER,
                education TEXT,
                familysize INTEGER,
                urban TEXT,
                engnat TEXT,
                holland_code TEXT,
                top1_house TEXT,
                top1_prob REAL,
                top3_json TEXT NOT NULL,
                all_results_json TEXT NOT NULL,
                profile_json TEXT NOT NULL,
                student_meta_json TEXT NOT NULL,
                notes TEXT DEFAULT '',
                FOREIGN KEY (org_code) REFERENCES orgs(invite_code)
            );
            """
        )
        for code, name, org_type in DEMO_ORGS:
            conn.execute(
                "INSERT OR IGNORE INTO orgs (invite_code, name, org_type) VALUES (?, ?, ?)",
                (code, name, org_type),
            )
        conn.commit()
    finally:
        conn.close()


def resolve_org(invite_code: str, db_path: Path | None = None) -> dict | None:
    if not invite_code:
        return None
    code = invite_code.strip().upper()
    conn = _connect(db_path)
    try:
        row = conn.execute(
            "SELECT invite_code, name, org_type FROM orgs WHERE invite_code = ?",
            (code,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def list_orgs(db_path: Path | None = None) -> list[dict]:
    conn = _connect(db_path)
    try:
        rows = conn.execute(
            "SELECT invite_code, name, org_type FROM orgs ORDER BY name"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def save_session(
    *,
    all_results: list[dict],
    top3: list[dict],
    profile: dict,
    student_meta: dict,
    org_code: str | None = None,
    db_path: Path | None = None,
) -> str:
    init_db(db_path)
    session_id = uuid.uuid4().hex[:10].upper()
    created_at = datetime.now(timezone.utc).isoformat()
    org = org_code.strip().upper() if org_code else None
    if org and not resolve_org(org, db_path):
        org = None

    conn = _connect(db_path)
    try:
        conn.execute(
            """
            INSERT INTO sessions (
                session_id, created_at, org_code, age, education, familysize,
                urban, engnat, holland_code, top1_house, top1_prob,
                top3_json, all_results_json, profile_json, student_meta_json, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')
            """,
            (
                session_id,
                created_at,
                org,
                student_meta.get("age"),
                student_meta.get("education"),
                student_meta.get("familysize"),
                student_meta.get("urban"),
                student_meta.get("engnat"),
                profile.get("holland_code"),
                top3[0]["house"] if top3 else None,
                top3[0]["probability"] if top3 else None,
                json.dumps(top3),
                json.dumps(all_results),
                json.dumps(profile),
                json.dumps(student_meta),
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return session_id


def get_session(session_id: str, db_path: Path | None = None) -> dict | None:
    conn = _connect(db_path)
    try:
        row = conn.execute(
            "SELECT * FROM sessions WHERE session_id = ?",
            (session_id.strip().upper(),),
        ).fetchone()
        if not row:
            return None
        data = dict(row)
        data["top3"] = json.loads(data.pop("top3_json"))
        data["all_results"] = json.loads(data.pop("all_results_json"))
        data["profile"] = json.loads(data.pop("profile_json"))
        data["student_meta"] = json.loads(data.pop("student_meta_json"))
        return data
    finally:
        conn.close()


def list_sessions(
    org_code: str | None = None,
    limit: int = 50,
    db_path: Path | None = None,
) -> list[dict]:
    conn = _connect(db_path)
    try:
        if org_code:
            rows = conn.execute(
                """
                SELECT session_id, created_at, org_code, age, education,
                       holland_code, top1_house, top1_prob, notes
                FROM sessions
                WHERE org_code = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (org_code.strip().upper(), limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT session_id, created_at, org_code, age, education,
                       holland_code, top1_house, top1_prob, notes
                FROM sessions
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def update_notes(session_id: str, notes: str, db_path: Path | None = None) -> bool:
    conn = _connect(db_path)
    try:
        cur = conn.execute(
            "UPDATE sessions SET notes = ? WHERE session_id = ?",
            (notes, session_id.strip().upper()),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()
