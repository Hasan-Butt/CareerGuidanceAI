"""
Feature engineering, scaling and encoding for the house classifier.

    python data_scripts/build_features.py

Input : data/processed/riasec_clean.csv
Output: data/processed/features_all.csv          engineered features, unscaled (used for EDA)
        data/processed/train.csv, test.csv        scaled + encoded, stratified 80/20 split
        data/processed/preprocessor.joblib        fitted ColumnTransformer (reuse at inference)
        data/processed/feature_meta.json          feature names, label classes, class weights

Engineered features
  - 6 RIASEC scale scores   mean of the 8 items per scale (1-5)
  - Big Five (TIPI)         5 traits, each = mean of one item and one reverse-scored item (1-7)
  - vocab_score             number of the 13 real words the person knows
  - differentiation         highest minus lowest RIASEC score (how clear-cut the profile is)
  - holland_code            letter of the highest RIASEC score (categorical)
  - age, familysize, education, urban, engnat, fake_word_flag

Sensitive attributes (gender, religion, race, orientation, country) are NOT model inputs.
gender and is_pakistan are kept beside the split only for the bias check in Phase 4.
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, OrdinalEncoder, StandardScaler
from sklearn.utils.class_weight import compute_class_weight

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROC = os.path.join(BASE, "data", "processed")
SCALES = {"R": "realistic", "I": "investigative", "A": "artistic",
          "S": "social", "E": "enterprising", "C": "conventional"}
# TIPI scoring key (Gosling et al., 2003): second item of each pair is reverse-scored (8 - x)
BIG5 = {"extraversion": (1, 6), "agreeableness": (7, 2), "conscientiousness": (3, 8),
        "emotional_stability": (9, 4), "openness": (5, 10)}
REAL_WORDS = [f"VCL{i}" for i in range(1, 17) if i not in (6, 9, 12)]

NUMERIC = list(SCALES.values()) + list(BIG5) + ["vocab_score", "differentiation", "familysize"]
SKEWED = ["age"]                               # log-transformed before scaling
ORDINAL = ["education"]                        # 1 < 2 < 3 < 4, unknown -> 0
NOMINAL = ["urban", "engnat", "holland_code"]  # one-hot, unknown kept as its own level
BINARY = ["fake_word_flag"]
TARGET = "house"


def engineer(df):
    out = pd.DataFrame(index=df.index)
    for letter, name in SCALES.items():
        out[name] = df[[f"{letter}{i}" for i in range(1, 9)]].mean(axis=1)
    for trait, (pos, rev) in BIG5.items():
        out[trait] = (df[f"TIPI{pos}"] + (8 - df[f"TIPI{rev}"])) / 2
    out["vocab_score"] = df[REAL_WORDS].sum(axis=1)
    scores = out[list(SCALES.values())]
    out["differentiation"] = scores.max(axis=1) - scores.min(axis=1)
    out["holland_code"] = scores.idxmax(axis=1).str[0].str.upper()
    out["age"] = df["age"]
    out["familysize"] = df["familysize"]
    out["education"] = df["education"].fillna(0)
    out["urban"] = df["urban"].map({1: "rural", 2: "suburban", 3: "urban"}).fillna("unknown")
    out["engnat"] = df["engnat"].map({1: "native", 2: "non_native"}).fillna("unknown")
    out["fake_word_flag"] = df["fake_word_flag"]
    out["gender"] = df["gender"].map({1: "male", 2: "female", 3: "other"}).fillna("unknown")
    out["is_pakistan"] = (df["country"] == "PK").astype(int)
    out[TARGET] = df[TARGET]
    return out


def build_preprocessor():
    return ColumnTransformer([
        ("num", StandardScaler(), NUMERIC),
        ("skew", Pipeline([("log", FunctionTransformer(np.log1p, feature_names_out="one-to-one")),
                           ("scale", StandardScaler())]), SKEWED),
        ("ord", Pipeline([("ord", OrdinalEncoder(categories=[[0, 1, 2, 3, 4]])),
                          ("scale", StandardScaler())]), ORDINAL),
        ("nom", OneHotEncoder(handle_unknown="ignore", sparse_output=False), NOMINAL),
        ("bin", "passthrough", BINARY),
    ], verbose_feature_names_out=False)


def main():
    df = pd.read_csv(os.path.join(PROC, "riasec_clean.csv"), low_memory=False)
    feats = engineer(df)
    feats.to_csv(os.path.join(PROC, "features_all.csv"), index=False)

    train, test = train_test_split(feats, test_size=0.2, stratify=feats[TARGET], random_state=42)

    # fit scalers/encoders on the training split only, so no test information leaks in
    pre = build_preprocessor()
    X_train = pre.fit_transform(train)
    X_test = pre.transform(test)
    names = list(pre.get_feature_names_out())

    classes = sorted(feats[TARGET].unique())
    label = {c: i for i, c in enumerate(classes)}
    weights = compute_class_weight("balanced", classes=np.array(classes), y=train[TARGET])

    for part, X, src in (("train", X_train, train), ("test", X_test, test)):
        out = pd.DataFrame(X, columns=names)
        out["label"] = src[TARGET].map(label).values
        out["house"] = src[TARGET].values
        out["gender"] = src["gender"].values            # bias check only, not a feature
        out["is_pakistan"] = src["is_pakistan"].values  # bias check only, not a feature
        out.to_csv(os.path.join(PROC, f"{part}.csv"), index=False)

    joblib.dump(pre, os.path.join(PROC, "preprocessor.joblib"))
    meta = {
        "n_train": len(train), "n_test": len(test),
        "features": names,
        "classes": classes,
        "class_weights": {c: round(float(w), 3) for c, w in zip(classes, weights)},
        "not_used_as_features": ["gender", "religion", "race", "orientation", "country"],
    }
    with open(os.path.join(PROC, "feature_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"train {X_train.shape}, test {X_test.shape}")
    print("features:", ", ".join(names))
    print("class weights:", meta["class_weights"])


if __name__ == "__main__":
    main()
