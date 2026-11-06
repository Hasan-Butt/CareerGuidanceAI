# src/models/train.py
"""Tune GBM and RF classifiers and save the higher-scoring estimator."""

from pathlib import Path
import sys

import pandas as pd
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from sklearn.utils.class_weight import compute_sample_weight

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from src.models.model import build_gradient_boosting, build_random_forest, save_model

SENSITIVE_COLUMNS = {"gender", "country", "religion", "race", "orientation", "is_pakistan"}
TARGET_CANDIDATES = ("label", "house", "target", "y")


def locate_processed_file(filename: str) -> Path:
    preferred = ROOT / "data" / "processed" / filename
    if preferred.exists():
        return preferred
    matches = [
        path for path in ROOT.rglob(filename)
        if ".git" not in path.parts and "site-packages" not in path.parts
    ]
    if matches:
        return matches[0]
    raise FileNotFoundError(
        f"Could not locate {filename}. Expected {preferred} or another project-local copy."
    )


def detect_label(train: pd.DataFrame) -> str:
    for candidate in TARGET_CANDIDATES:
        if candidate in train.columns:
            return candidate
    raise ValueError(
        "Could not auto-detect the label column. Expected one of: "
        + ", ".join(TARGET_CANDIDATES)
    )


def split_features(frame: pd.DataFrame, label: str):
    drop_columns = {label, *TARGET_CANDIDATES, *SENSITIVE_COLUMNS}
    feature_columns = [column for column in frame.columns if column not in drop_columns]
    if not feature_columns:
        raise ValueError("No model features remain after removing labels and sensitive columns.")
    return frame[feature_columns], frame[label], feature_columns


def main() -> None:
    train_path = locate_processed_file("train.csv")
    test_path = locate_processed_file("test.csv")
    train = pd.read_csv(train_path)
    test = pd.read_csv(test_path)
    label = detect_label(train)
    X_train, y_train, feature_columns = split_features(train, label)
    if not set(feature_columns).issubset(test.columns):
        missing = sorted(set(feature_columns) - set(test.columns))
        raise ValueError(f"Test data is missing model features: {missing}")

    sample_weights = compute_sample_weight(class_weight="balanced", y=y_train)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    gbm_search = RandomizedSearchCV(
        build_gradient_boosting(),
        {
            "n_estimators": [200, 300, 400],
            "learning_rate": [0.01, 0.05, 0.1],
            "max_depth": [3, 5, 7],
            "subsample": [0.7, 0.8, 1.0],
            "min_samples_leaf": [10, 20, 50],
        },
        n_iter=25, cv=cv, scoring="f1_macro", n_jobs=-1, verbose=2, random_state=42,
    )
    gbm_search.fit(X_train, y_train, sample_weight=sample_weights)
    print("Best GBM params:", gbm_search.best_params_)
    print("Best GBM CV macro-F1:", gbm_search.best_score_)

    rf_search = RandomizedSearchCV(
        build_random_forest(),
        {
            "n_estimators": [200, 300, 500],
            "max_depth": [15, 20, None],
            "min_samples_split": [5, 10, 20],
        },
        n_iter=15, cv=cv, scoring="f1_macro", n_jobs=-1, verbose=2, random_state=42,
    )
    rf_search.fit(X_train, y_train)
    print("Best RF params:", rf_search.best_params_)
    print("Best RF CV macro-F1:", rf_search.best_score_)

    winner = gbm_search if gbm_search.best_score_ >= rf_search.best_score_ else rf_search
    winner_name = "GBM" if winner is gbm_search else "RF"
    output = ROOT / "models" / "weights" / "final_model.pkl"
    save_model(winner.best_estimator_, str(output))
    print(f"Winning model: {winner_name}")
    print(f"Winning hyperparameters: {winner.best_params_}")
    print(f"Training label: {label}; features: {len(feature_columns)}")
    print(f"Created: {output}")


if __name__ == "__main__":
    main()