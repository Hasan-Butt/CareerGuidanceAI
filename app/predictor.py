# app/predictor.py
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

# Exact alphabetical class order matching docs/feature_meta.json and train.py (0..6)
HOUSES = [
    "Arts, Humanities & Social Sciences",
    "Business & Commerce",
    "Computer Science & IT",
    "Engineering",
    "Law",
    "Medicine & Health",
    "Pure Sciences",
]

HOUSE_EMOJI = {
    "Arts, Humanities & Social Sciences": "🎨",
    "Business & Commerce":                "💼",
    "Computer Science & IT":              "💻",
    "Engineering":                        "⚙️",
    "Law":                                "⚖️",
    "Medicine & Health":                  "🏥",
    "Pure Sciences":                      "🔬",
}

RIASEC_DOMAINS = {
    "realistic": "R",
    "investigative": "I",
    "artistic": "A",
    "social": "S",
    "enterprising": "E",
    "conventional": "C",
}

RIASEC_LABELS = {
    "R": ("Realistic", "Hands-on, technical, building & working with tools/systems"),
    "I": ("Investigative", "Analytical, curious, research & solving complex problems"),
    "A": ("Artistic", "Creative, expressive, design, writing & originality"),
    "S": ("Social", "Helping, teaching, mentoring & community impact"),
    "E": ("Enterprising", "Leading, persuading, business & launching initiatives"),
    "C": ("Conventional", "Organised, detail-oriented, data & structured systems"),
}

RIASEC_ITEMS = {
    code: [f"{code}{i}" for i in range(1, 9)]
    for code in ("R", "I", "A", "S", "E", "C")
}

TIPI_ITEMS = [f"TIPI{i}" for i in range(1, 11)]

# Fitted StandardScaler parameters from data/processed/preprocessor.joblib
# (used automatically if data/processed/preprocessor.joblib is not present, e.g. on cloud deploys)
SCALER_STATS = {
    "realistic":           (2.101246, 0.873048),
    "investigative":       (3.034096, 1.026609),
    "artistic":            (2.939440, 0.999392),
    "social":              (3.393074, 0.877936),
    "enterprising":        (2.588264, 0.878689),
    "conventional":        (2.439088, 0.977135),
    "extraversion":        (4.133046, 1.637761),
    "agreeableness":       (4.928374, 1.246776),
    "conscientiousness":   (5.313850, 1.373027),
    "emotional_stability": (4.512738, 1.496876),
    "openness":            (5.470179, 1.170943),
    "vocab_score":         (8.518430, 2.776933),
    "differentiation":     (2.284048, 0.753523),
    "familysize":          (2.818442, 1.566679),
    "age":                 (3.323135, 0.363530),  # after log1p(age)
    "education":           (2.789936, 0.849902),
}

FEATURE_COLUMNS = [
    "realistic",
    "investigative",
    "artistic",
    "social",
    "enterprising",
    "conventional",
    "extraversion",
    "agreeableness",
    "conscientiousness",
    "emotional_stability",
    "openness",
    "vocab_score",
    "differentiation",
    "familysize",
    "age",
    "education",
    "urban_rural",
    "urban_suburban",
    "urban_unknown",
    "urban_urban",
    "engnat_native",
    "engnat_non_native",
    "engnat_unknown",
    "holland_code_A",
    "holland_code_C",
    "holland_code_E",
    "holland_code_I",
    "holland_code_R",
    "holland_code_S",
    "fake_word_flag",
    *[f"{code}{i}" for code in ("R", "I", "A", "S", "E", "C") for i in range(1, 9)],
    *[f"TIPI{i}" for i in range(1, 11)],
]


def _resolve_path(path: str) -> Path:
    p = Path(path)
    return p if p.is_absolute() or p.exists() else ROOT / p


def _load_xgb_safe(model_path: Path):
    """Load model with joblib, falling back if cross-OS XGBoost rng_state fails."""
    try:
        return joblib.load(model_path)
    except Exception as exc:
        if "input stream corrupted" not in str(exc):
            raise
        import xgboost as xgb
        import xgboost.core as xgc

        captured = {}
        original_setstate = xgc.Booster.__setstate__

        def _capture_state(self, state):
            captured["handle"] = bytes(state["handle"])
            self.handle = None

        xgc.Booster.__setstate__ = _capture_state
        try:
            model = joblib.load(model_path)
        finally:
            xgc.Booster.__setstate__ = original_setstate

        buf = captured.get("handle", b"")
        model_idx = buf.find(b"Model{")
        if model_idx == -1:
            raise
        booster = xgb.Booster()
        booster.load_model(bytearray(buf[model_idx + 5 : -1]))
        model._Booster = booster
        return model


def load_model(
    model_path: str = "models/weights/final_model.pkl",
    encoder_path: str = "models/weights/label_encoder.pkl",
):
    model = _load_xgb_safe(_resolve_path(model_path))
    le = joblib.load(_resolve_path(encoder_path))
    return model, le


def compute_profile_summary(riasec_responses: dict, tipi_responses: dict) -> dict:
    """Compute unscaled RIASEC scores (1-5), 3-letter Holland code, and Big Five traits (1-7)."""
    riasec_scores = {}
    for feat, code in RIASEC_DOMAINS.items():
        items = [riasec_responses.get(f"{code}{i}", 3) for i in range(1, 9)]
        riasec_scores[code] = round(float(np.mean(items)), 2)

    ranked_codes = sorted(riasec_scores, key=lambda c: riasec_scores[c], reverse=True)
    holland_code = "-".join(ranked_codes[:3])

    def tipi_pair(pos_key: str, rev_key: str) -> float:
        return round((tipi_responses.get(pos_key, 4) + (8 - tipi_responses.get(rev_key, 4))) / 2.0, 2)

    big_five = {
        "Extraversion": tipi_pair("TIPI1", "TIPI6"),
        "Agreeableness": tipi_pair("TIPI7", "TIPI2"),
        "Conscientiousness": tipi_pair("TIPI3", "TIPI8"),
        "Emotional Stability": tipi_pair("TIPI9", "TIPI4"),
        "Openness": tipi_pair("TIPI5", "TIPI10"),
    }

    return {
        "riasec": riasec_scores,
        "ranked_codes": ranked_codes,
        "holland_code": holland_code,
        "differentiation": round(max(riasec_scores.values()) - min(riasec_scores.values()), 2),
        "big_five": big_five,
    }


def build_feature_row(
    riasec_responses: dict,
    tipi_responses: dict,
    age: int,
    education: int,
    familysize: int,
    vocab_known: int,
) -> pd.DataFrame:
    """Build one 88-column feature row matching the training pipeline schema.

    riasec_responses: {'R1': 3, 'R2': 4, ..., 'C8': 2} (1-5 scale)
    tipi_responses:   {'TIPI1': 4, ..., 'TIPI10': 3}   (1-7 scale)
    """
    raw = {}

    # 1. RIASEC domain scores (mean of 8 items each)
    for feat, code in RIASEC_DOMAINS.items():
        items = [riasec_responses.get(f"{code}{i}", 3) for i in range(1, 9)]
        raw[feat] = float(np.mean(items))

    # 2. Big Five from TIPI (reverse score second item of each pair: 8 - x)
    def tipi_pair(pos_key: str, rev_key: str) -> float:
        return (tipi_responses.get(pos_key, 4) + (8 - tipi_responses.get(rev_key, 4))) / 2.0

    raw["extraversion"] = tipi_pair("TIPI1", "TIPI6")
    raw["agreeableness"] = tipi_pair("TIPI7", "TIPI2")
    raw["conscientiousness"] = tipi_pair("TIPI3", "TIPI8")
    raw["emotional_stability"] = tipi_pair("TIPI9", "TIPI4")
    raw["openness"] = tipi_pair("TIPI5", "TIPI10")

    # 3. Vocab score & profile differentiation
    raw["vocab_score"] = float(vocab_known)
    riasec_scores = [raw[feat] for feat in RIASEC_DOMAINS]
    raw["differentiation"] = max(riasec_scores) - min(riasec_scores)

    # 4. Demographics (age is log1p-transformed before scaling, matching build_features.py)
    raw["familysize"] = float(familysize)
    raw["age"] = float(np.log1p(age))
    raw["education"] = float(education)

    # 5. Apply training StandardScaler parameters to engineered numeric columns
    row = {}
    for col, (mean_val, scale_val) in SCALER_STATS.items():
        row[col] = (raw[col] - mean_val) / scale_val

    # 6. Urban / English nativeness one-hot defaults for Pakistani web users
    row["urban_rural"] = 0.0
    row["urban_suburban"] = 0.0
    row["urban_unknown"] = 1.0
    row["urban_urban"] = 0.0
    row["engnat_native"] = 0.0
    row["engnat_non_native"] = 1.0
    row["engnat_unknown"] = 0.0

    # 7. Holland code one-hot (alphabetical order A, C, E, I, R, S matching OneHotEncoder)
    top_domain = max(RIASEC_DOMAINS, key=lambda feat: raw[feat])
    top_code = RIASEC_DOMAINS[top_domain]
    for code in ("A", "C", "E", "I", "R", "S"):
        row[f"holland_code_{code}"] = 1.0 if code == top_code else 0.0

    # 8. Fake word flag
    row["fake_word_flag"] = 0.0

    # 9. Raw RIASEC items (unscaled, matching train.csv)
    for code in ("R", "I", "A", "S", "E", "C"):
        for i in range(1, 9):
            row[f"{code}{i}"] = float(riasec_responses.get(f"{code}{i}", 3))

    # 10. Raw TIPI items (unscaled, matching train.csv)
    for i in range(1, 11):
        row[f"TIPI{i}"] = float(tipi_responses.get(f"TIPI{i}", 4))

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def predict(model, le, feature_row: pd.DataFrame, top_k: int | None = 3) -> list[dict]:
    """Return degree house matches sorted by descending probability.

    Pass top_k=None to return all 7 houses.
    """
    prob = model.predict_proba(feature_row)[0]
    ranked_idx = np.argsort(prob)[::-1]
    if top_k is not None:
        ranked_idx = ranked_idx[:top_k]

    results = []
    for idx in ranked_idx:
        class_id = int(le.inverse_transform([idx])[0])
        house_name = HOUSES[class_id]
        results.append({
            "house": house_name,
            "emoji": HOUSE_EMOJI[house_name],
            "probability": round(float(prob[idx]) * 100, 1),
        })
    return results
