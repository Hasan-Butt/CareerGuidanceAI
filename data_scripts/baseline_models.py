"""
Preliminary baselines on the prepared split (preview of Phase 3).

    python data_scripts/baseline_models.py

Reads data/processed/train.csv, test.csv and riasec_clean.csv (for the raw item answers),
writes docs/baseline_results.csv. Reports top-1/2/3 accuracy and macro-F1, because the app
shows each student their top 3 houses.
"""

import os

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, top_k_accuracy_score
from sklearn.model_selection import train_test_split

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROC = os.path.join(BASE, "data", "processed")
NOT_FEATURES = ["label", "house", "gender", "is_pakistan"]
ITEMS = [f"{s}{i}" for s in "RIASEC" for i in range(1, 9)] + [f"TIPI{i}" for i in range(1, 11)]


def main():
    train = pd.read_csv(os.path.join(PROC, "train.csv"))
    test = pd.read_csv(os.path.join(PROC, "test.csv"))
    y_tr, y_te = train["label"], test["label"]
    X_tr, X_te = train.drop(columns=NOT_FEATURES).values, test.drop(columns=NOT_FEATURES).values

    # raw item answers for the same rows: same seed and stratification as build_features.py
    clean = pd.read_csv(os.path.join(PROC, "riasec_clean.csv"), low_memory=False)
    raw_tr, raw_te = train_test_split(clean, test_size=0.2, stratify=clean["house"], random_state=42)
    assert (raw_tr["house"].values == train["house"].values).all()
    Xi_tr = np.hstack([X_tr, raw_tr[ITEMS].values])
    Xi_te = np.hstack([X_te, raw_te[ITEMS].values])

    models = [
        ("Logistic regression (balanced)", LogisticRegression(max_iter=2000, class_weight="balanced"), X_tr, X_te),
        ("Gradient boosting, 30 features", HistGradientBoostingClassifier(max_iter=300, learning_rate=0.08, random_state=0), X_tr, X_te),
        ("Gradient boosting, 30 features + 58 items", HistGradientBoostingClassifier(max_iter=400, learning_rate=0.06, random_state=0), Xi_tr, Xi_te),
    ]
    majority = np.bincount(y_tr).argmax()
    rows = [{"model": "Always guess the largest house", "top1": round(float(np.mean(y_te == majority)), 3)}]
    for name, model, A, B in models:
        p = model.fit(A, y_tr).predict_proba(B)
        pred = p.argmax(axis=1)
        rows.append({"model": name,
                     "top1": round(accuracy_score(y_te, pred), 3),
                     "top2": round(top_k_accuracy_score(y_te, p, k=2), 3),
                     "top3": round(top_k_accuracy_score(y_te, p, k=3), 3),
                     "macro_f1": round(f1_score(y_te, pred, average="macro"), 3)})
        print(rows[-1])
    pd.DataFrame(rows).to_csv(os.path.join(BASE, "docs", "baseline_results.csv"), index=False)


if __name__ == "__main__":
    main()
