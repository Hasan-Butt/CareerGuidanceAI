"""
Gemini router — Stage 1 (follow-up questions) + Stage 2 (validation + enrichment).
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.gemini_layer import generate_followup_questions, validate_and_enrich

log = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/gemini", tags=["gemini"])


# ── Request / Response models ────────────────────────────────────────────────

class FollowupRequest(BaseModel):
    xgb_probabilities: list[dict[str, Any]]  # [{house, probability, emoji}]
    holland_code: str
    weak_domains: list[str] = []             # houses with close scores (auto-computed if omitted)


class ValidationRequest(BaseModel):
    xgb_ranking: list[dict[str, Any]]        # [{house, emoji, probability}]
    followup_answers: dict[str, str]          # {question_id: "A"|"B"|"C"|"D"}
    holland_code: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/followup-questions")
def followup_questions(req: FollowupRequest) -> dict:
    """
    Stage 1: Generate 3-5 targeted follow-up questions from XGBoost weak areas.
    Returns JSON with 'questions' list.
    """
    try:
        result = generate_followup_questions(
            xgb_probabilities=req.xgb_probabilities,
            holland_code=req.holland_code,
            weak_domains=req.weak_domains,
        )
        return result
    except Exception as exc:
        log.error("POST /gemini/followup-questions error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/validate-enrich")
def validate_enrich(req: ValidationRequest) -> dict:
    """
    Stage 2: Validate XGBoost ranking + enrich top-3 with live Pakistani market data.
    Returns adjusted_ranking, market_data, narratives, validation_summary, data_sources.
    """
    try:
        result = validate_and_enrich(
            xgb_ranking=req.xgb_ranking,
            followup_answers=req.followup_answers,
            holland_code=req.holland_code,
        )
        return result
    except Exception as exc:
        log.error("POST /gemini/validate-enrich error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

