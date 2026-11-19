"""Prediction router — POST /api/predict."""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

# Make backend root importable
_BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_BACKEND))

from questions import (
    EDU_MAP,
    ENGNAT_OPTIONS,
    FAKE_WORD_KEYS,
    REAL_WORD_KEYS,
    URBAN_OPTIONS,
)
from db.database import get_db
from db.models import Org, Session as SessionModel
from services.predictor import (
    build_feature_row,
    compute_profile_summary,
    load_model,
    predict,
)

router = APIRouter(tags=["prediction"])

# Load model once at startup
_model, _le = load_model(
    model_path=str(_BACKEND.parents[1] / "models" / "weights" / "final_model.pkl"),
    encoder_path=str(_BACKEND.parents[1] / "models" / "weights" / "label_encoder.pkl"),
)


# ── Pydantic schemas ────────────────────────────────────────────────────────

class AssessmentPayload(BaseModel):
    """Full assessment submission from the wizard."""

    riasec: dict[str, int] = Field(
        ...,
        description="48 RIASEC items (R1–C8), each rated 1–5.",
        examples=[{"R1": 4, "R2": 2}],
    )
    tipi: dict[str, int] = Field(
        ...,
        description="10 TIPI personality items (TIPI1–TIPI10), each rated 1–7.",
    )
    vocab_checked: dict[str, bool] = Field(
        ...,
        description="16 VCL vocabulary items (VCL1–VCL16), True if box checked.",
    )
    age: int = Field(..., ge=13, le=80)
    education: str = Field(..., description="Must match EDUCATION_OPTIONS key.")
    familysize: int = Field(..., ge=0, le=20)
    urban_label: str = Field(..., description="Must match URBAN_OPTIONS key.")
    engnat_label: str = Field(..., description="Must match ENGNAT_OPTIONS key.")
    invite_code: str | None = Field(None, description="Org invite code for counsellor dashboard.")


class HouseResult(BaseModel):
    house: str
    emoji: str
    probability: float


class AssessmentProfile(BaseModel):
    riasec: dict[str, float]
    ranked_codes: list[str]
    holland_code: str
    differentiation: float
    big_five: dict[str, float]


class PredictResponse(BaseModel):
    top3: list[HouseResult]
    all_results: list[HouseResult]
    profile: AssessmentProfile
    session_id: str


# ── Endpoint ────────────────────────────────────────────────────────────────

@router.post("/predict", response_model=PredictResponse)
def run_prediction(payload: AssessmentPayload, db: DBSession = Depends(get_db)) -> PredictResponse:
    """Run the XGBoost classifier and return degree-family probabilities."""

    # 1. Vocab scoring
    vocab_known = sum(1 for k in REAL_WORD_KEYS if payload.vocab_checked.get(k, False))
    fake_claimed = sum(1 for k in FAKE_WORD_KEYS if payload.vocab_checked.get(k, False))
    fake_word_flag = 1 if fake_claimed == 1 else 0

    # 2. Resolve coded values
    urban_code = URBAN_OPTIONS.get(payload.urban_label, "unknown")
    engnat_code = ENGNAT_OPTIONS.get(payload.engnat_label, "non_native")
    edu_code = EDU_MAP.get(payload.education, 2)

    # 3. Feature engineering
    feature_row = build_feature_row(
        riasec_responses=payload.riasec,
        tipi_responses=payload.tipi,
        age=payload.age,
        education=edu_code,
        familysize=payload.familysize,
        vocab_known=vocab_known,
        urban=urban_code,
        engnat=engnat_code,
        fake_word_flag=fake_word_flag,
    )

    # 4. Predict
    all_results = predict(_model, _le, feature_row, top_k=None)
    profile = compute_profile_summary(payload.riasec, payload.tipi)

    # 5. Persist session to DB
    session_id = _save_session(payload, all_results, profile, urban_code, engnat_code, db)

    return PredictResponse(
        top3=all_results[:3],
        all_results=all_results,
        profile=profile,
        session_id=session_id,
    )


def _save_session(
    payload: AssessmentPayload,
    all_results: list,
    profile: dict,
    urban_code: str,
    engnat_code: str,
    db: DBSession,
) -> str:
    """Persist assessment result to DB and return session ID."""
    top3 = [r if isinstance(r, dict) else r.model_dump() for r in all_results[:3]]
    all_res = [r if isinstance(r, dict) else r.model_dump() for r in all_results]
    prof = profile if isinstance(profile, dict) else profile.model_dump()

    # Safely handle invite code / org linkage
    valid_org_code = None
    if payload.invite_code and payload.invite_code.strip():
        code = payload.invite_code.strip().upper()
        try:
            org = db.query(Org).filter_by(invite_code=code).first()
            if not org:
                # Auto-register new institution code so custom cohorts work immediately
                org = Org(invite_code=code, name=code, org_type="school")
                db.add(org)
                db.commit()
            valid_org_code = code
        except Exception:
            db.rollback()
            valid_org_code = None

    row = SessionModel(
        org_code=valid_org_code,
        age=payload.age,
        education=payload.education,
        familysize=payload.familysize,
        urban=urban_code,
        engnat=engnat_code,
        holland_code=prof.get("holland_code", ""),
        top1_house=top3[0]["house"] if top3 else "",
        top1_prob=top3[0]["probability"] if top3 else 0.0,
        top3=top3,
        all_results=all_res,
        profile=prof,
        student_meta={
            "riasec": payload.riasec,
            "tipi": payload.tipi,
            "vocab_checked": payload.vocab_checked,
        },
    )

    try:
        db.add(row)
        db.commit()
        db.refresh(row)
    except Exception:
        db.rollback()
        # Fallback without org_code to ensure student results are never blocked
        row.org_code = None
        db.add(row)
        db.commit()
        db.refresh(row)

    return row.id

