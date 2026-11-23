"""Prediction router — POST /api/predict."""
from __future__ import annotations

import os
import sys
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session as DBSession

# Make backend root importable
_BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_BACKEND))

from questions import (
    EDU_MAP,
    ENGNAT_OPTIONS,
    FAKE_WORD_KEYS,
    REAL_WORD_KEYS,
    RIASEC_QUESTIONS,
    TIPI_QUESTIONS,
    URBAN_OPTIONS,
    VOCAB_WORDS,
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

# Load model once at startup. MODEL_DIR overrides the location (Docker mounts
# the weights at /models/weights); otherwise use <repo>/models/weights.
# (Path("/app").parents[1] does not exist, which crashed the Docker image.)
_MODEL_DIR = Path(os.environ.get("MODEL_DIR") or Path(__file__).resolve().parents[3] / "models" / "weights")
_model, _le = load_model(
    model_path=str(_MODEL_DIR / "final_model.pkl"),
    encoder_path=str(_MODEL_DIR / "label_encoder.pkl"),
)

_RIASEC_KEYS = set(RIASEC_QUESTIONS)
_TIPI_KEYS = set(TIPI_QUESTIONS)
_VOCAB_KEYS = set(VOCAB_WORDS)


# ── Pydantic schemas ────────────────────────────────────────────────────────

class AssessmentPayload(BaseModel):
    """Full assessment submission from the wizard.

    Every answer is checked here: out-of-range or missing answers used to be
    silently replaced by defaults, so the model scored a different student.
    """

    riasec: dict[str, int] = Field(
        ...,
        description="All 48 RIASEC items (R1–C8), each rated 1–5.",
        examples=[{"R1": 4, "R2": 2}],
    )
    tipi: dict[str, int] = Field(
        ...,
        description="All 10 TIPI personality items (TIPI1–TIPI10), each rated 1–7.",
    )
    vocab_checked: dict[str, bool] = Field(
        ...,
        description="VCL vocabulary items (VCL1–VCL16), True if box checked.",
    )
    age: int = Field(..., ge=13, le=80)
    education: str = Field(..., max_length=64, description="Must match an EDU_MAP key.")
    familysize: int = Field(..., ge=0, le=20)
    urban_label: str = Field(..., max_length=64, description="Must match an URBAN_OPTIONS key.")
    engnat_label: str = Field(..., max_length=64, description="Must match an ENGNAT_OPTIONS key.")
    invite_code: str = Field(..., min_length=2, max_length=32, description="Mandatory school / counsellor invite code.")

    @field_validator("riasec")
    @classmethod
    def _check_riasec(cls, v: dict[str, int]) -> dict[str, int]:
        if set(v) != _RIASEC_KEYS:
            raise ValueError("riasec must contain exactly the 48 items R1–C8")
        if any(not 1 <= x <= 5 for x in v.values()):
            raise ValueError("riasec answers must be between 1 and 5")
        return v

    @field_validator("tipi")
    @classmethod
    def _check_tipi(cls, v: dict[str, int]) -> dict[str, int]:
        if set(v) != _TIPI_KEYS:
            raise ValueError("tipi must contain exactly the 10 items TIPI1–TIPI10")
        if any(not 1 <= x <= 7 for x in v.values()):
            raise ValueError("tipi answers must be between 1 and 7")
        return v

    @field_validator("vocab_checked")
    @classmethod
    def _check_vocab(cls, v: dict[str, bool]) -> dict[str, bool]:
        if not set(v) <= _VOCAB_KEYS:
            raise ValueError("vocab_checked may only contain VCL1–VCL16")
        return v

    @field_validator("education")
    @classmethod
    def _check_education(cls, v: str) -> str:
        if v not in EDU_MAP:
            raise ValueError(f"unknown education option: {v!r}")
        return v

    @field_validator("urban_label")
    @classmethod
    def _check_urban(cls, v: str) -> str:
        if v not in URBAN_OPTIONS:
            raise ValueError(f"unknown area option: {v!r}")
        return v

    @field_validator("engnat_label")
    @classmethod
    def _check_engnat(cls, v: str) -> str:
        if v not in ENGNAT_OPTIONS:
            raise ValueError(f"unknown English-native option: {v!r}")
        return v


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

    # 2. Resolve coded values (already validated by AssessmentPayload)
    urban_code = URBAN_OPTIONS[payload.urban_label]
    engnat_code = ENGNAT_OPTIONS[payload.engnat_label]
    edu_code = EDU_MAP[payload.education]

    # Mandatory invite code verification: anonymous / un-coded access is strictly blocked.
    if not payload.invite_code or not payload.invite_code.strip():
        raise HTTPException(
            status_code=403,
            detail="A valid school or counsellor invite code is required to take this assessment."
        )
    org_code = payload.invite_code.strip().upper()
    org_match = db.query(Org).filter_by(invite_code=org_code).first()
    if org_match is None:
        raise HTTPException(
            status_code=403,
            detail=f"Invalid invite code '{org_code}'. You must enter a registered school or counsellor invite code."
        )

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
    session_id = _save_session(payload, all_results, profile, urban_code, engnat_code, org_code, db)

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
    org_code: str | None,
    db: DBSession,
) -> str:
    """Persist assessment result to DB and return session ID."""
    top3 = [r if isinstance(r, dict) else r.model_dump() for r in all_results[:3]]
    all_res = [r if isinstance(r, dict) else r.model_dump() for r in all_results]
    prof = profile if isinstance(profile, dict) else profile.model_dump()

    row = SessionModel(
        org_code=org_code,
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
    db.add(row)
    db.commit()
    db.refresh(row)
    return row.id
