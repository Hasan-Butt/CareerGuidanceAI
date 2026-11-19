"""API tests: run from pakcareer/backend with  python -m pytest -q

Needs the model weights in <repo>/models/weights (or MODEL_DIR); skipped otherwise.
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
MODEL_DIR = Path(os.environ.get("MODEL_DIR") or BACKEND.parents[1] / "models" / "weights")
if not (MODEL_DIR / "final_model.pkl").exists():
    pytest.skip("model weights not found", allow_module_level=True)

# Fresh throwaway database and a known demo key for every test run
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["ORG_KEY_FAST_LAHORE"] = "test-key-fast"
os.environ["ORG_KEY_LGS_DEMO"] = "test-key-lgs"
os.environ["ADMIN_KEY"] = "test-admin"
sys.path.insert(0, str(BACKEND))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402

main._DEMO_KEYS_FILE = Path(_tmp) / "keys.txt"
FAST = {"X-Org-Key": "test-key-fast"}
LGS = {"X-Org-Key": "test-key-lgs"}


@pytest.fixture(scope="module")
def client():
    with TestClient(main.app) as c:
        yield c


def payload(**over):
    body = {
        "riasec": {f"{c}{i}": (5 if c in "RI" else 1) for c in "RIASEC" for i in range(1, 9)},
        "tipi": {f"TIPI{i}": 4 for i in range(1, 11)},
        "vocab_checked": {f"VCL{i}": i not in (6, 9, 12) for i in range(1, 17)},
        "age": 18,
        "education": "Completed secondary school",
        "familysize": 4,
        "urban_label": "Urban",
        "engnat_label": "No",
    }
    body.update(over)
    return body


def test_predict_returns_ranked_houses(client):
    r = client.post("/api/predict", json=payload())
    assert r.status_code == 200
    data = r.json()
    assert len(data["all_results"]) == 7
    probs = [h["probability"] for h in data["all_results"]]
    assert probs == sorted(probs, reverse=True)
    assert abs(sum(probs) - 100) < 1
    assert data["top3"][0]["house"] == "Engineering"   # strong R + I profile


def test_frontend_labels_reach_the_model(client):
    """The wizard's labels used to fall through to defaults (urban=unknown etc.)."""
    r = client.post("/api/predict", json=payload(urban_label="Rural", engnat_label="Yes",
                                                 education="Graduate degree"))
    from db.models import Session as SessionModel
    db = main.SessionLocal()
    try:
        row = db.get(SessionModel, r.json()["session_id"])
        assert (row.urban, row.engnat, row.education) == ("rural", "native", "Graduate degree")
    finally:
        db.close()


@pytest.mark.parametrize("bad", [
    {"riasec": {**payload()["riasec"], "R1": 9}},          # out of range
    {"riasec": {"R1": 3}},                                  # missing items
    {"tipi": {**payload()["tipi"], "TIPI1": 0}},
    {"vocab_checked": {"VCL99": True}},
    {"education": "PhD from the moon"},
    {"urban_label": "Mars"},
    {"age": 5},
])
def test_invalid_answers_rejected(client, bad):
    assert client.post("/api/predict", json=payload(**bad)).status_code == 422


def test_unknown_invite_code_rejected_and_not_created(client):
    r = client.post("/api/predict", json=payload(invite_code="MADE-UP-CODE"))
    assert r.status_code == 400
    assert client.get("/api/orgs/MADE-UP-CODE").status_code == 404


def test_dashboard_requires_key(client):
    assert client.get("/api/sessions").status_code == 401
    assert client.get("/api/sessions/analytics").status_code == 401
    assert client.get("/api/sessions", headers={"X-Org-Key": "wrong"}).status_code == 401
    assert client.get("/api/orgs").status_code in (404, 405)   # no public org list


def test_counsellor_sees_only_own_students(client):
    mine = client.post("/api/predict", json=payload(invite_code="fast-lahore")).json()["session_id"]
    other = client.post("/api/predict", json=payload(invite_code="LGS-DEMO")).json()["session_id"]
    ids = {s["session_id"] for s in client.get("/api/sessions", headers=FAST).json()["sessions"]}
    assert mine in ids and other not in ids
    # cannot edit another school's notes
    assert client.patch(f"/api/sessions/{other}/notes", json={"notes": "x"}, headers=FAST).status_code == 404
    assert client.patch(f"/api/sessions/{mine}/notes", json={"notes": "ok"}, headers=FAST).status_code == 200
    assert client.patch(f"/api/sessions/{mine}/notes", json={"notes": "x" * 6000}, headers=FAST).status_code == 422


def test_share_link_hides_raw_answers(client):
    sid = client.post("/api/predict", json=payload(invite_code="FAST-LAHORE")).json()["session_id"]
    public = client.get(f"/api/sessions/{sid}").json()
    assert "student_meta" not in public and "notes" not in public and public["top3"]
    assert "student_meta" in client.get(f"/api/sessions/{sid}", headers=FAST).json()
    assert "student_meta" not in client.get(f"/api/sessions/{sid}", headers=LGS).json()
    assert client.get(f"/api/sessions/{sid}/pdf").headers["content-type"] == "application/pdf"


def test_admin_creates_org(client):
    body = {"invite_code": "PUNJAB-COLLEGE", "name": "Punjab College"}
    assert client.post("/api/orgs", json=body).status_code == 403
    r = client.post("/api/orgs", json=body, headers={"X-Admin-Key": "test-admin"})
    assert r.status_code == 201
    key = r.json()["access_key"]
    assert client.get("/api/orgs/me", headers={"X-Org-Key": key}).json()["invite_code"] == "PUNJAB-COLLEGE"


def test_cors_only_allows_frontend(client):
    evil = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in evil.headers
    ok = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
