"""Train and evaluate the fixed XGBoost classifier used for the final model."""

from pathlib import Path
import time

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parents[2]
TRAIN_PATH = ROOT / "data" / "processed" / "train.csv"
TEST_PATH = ROOT / "data" / "processed" / "test.csv"
WEIGHTS_DIR = ROOT / "models" / "weights"


def main() -> None:
    train = pd.read_csv(TRAIN_PATH)
    test = pd.read_csv(TEST_PATH)

    print("Train columns:")
    print(list(train.columns))
    print(f"Train column count: {len(train.columns)}")
    print("Test columns:")
    print(list(test.columns))
    print(f"Test column count: {len(test.columns)}")

    label = "label" if "label" in train.columns else (
        "house" if "house" in train.columns else train.columns[-1]
    )
    # ``house`` is a duplicate string target in these generated splits when
    # ``label`` is selected, so it cannot be passed as a numeric feature.
    excluded = {label, "house", "gender", "religion", "race", "orientation", "country"}
    feature_columns = [column for column in train.columns if column not in excluded]
    X_train, y_train = train[feature_columns], train[label]
    X_test, y_test = test[feature_columns], test[label]
    print(f"Features used: {len(feature_columns)}")

    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc = le.transform(y_test)
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(le, WEIGHTS_DIR / "label_encoder.pkl")

    gbm = XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=10,
        eval_metric="mlogloss",
        n_jobs=-1,
        random_state=42,
        verbosity=1,
    )

    X_tr, X_val, y_tr, y_val = train_test_split(
        X_train, y_train_enc, test_size=0.15, stratify=y_train_enc, random_state=42
    )
    t0 = time.time()
    gbm.fit(
        X_tr,
        y_tr,
        eval_set=[(X_tr, y_tr), (X_val, y_val)],
        verbose=50,
    )
    print(f"Trained in {time.time() - t0:.1f}s")

    results = gbm.evals_result()
    output_dir = ROOT / "report" / "figures"
    output_dir.mkdir(parents=True, exist_ok=True)
    figure_path = output_dir / "loss_curve.png"
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.plot(results["validation_0"]["mlogloss"], label="Train loss")
    ax.plot(results["validation_1"]["mlogloss"], label="Validation loss")
    ax.set_xlabel("Boosting round")
    ax.set_ylabel("Log-loss")
    ax.set_title("XGBoost Training & Validation Loss")
    ax.legend()
    fig.tight_layout()
    fig.savefig(figure_path, dpi=150)
    plt.close(fig)
    print(f"Saved loss_curve.png to {figure_path}")

    pred = gbm.predict(X_test)
    prob = gbm.predict_proba(X_test)
    top1 = accuracy_score(y_test_enc, pred)
    top2 = np.mean([y_test_enc[i] in np.argsort(prob[i])[-2:] for i in range(len(y_test_enc))])
    top3 = np.mean([y_test_enc[i] in np.argsort(prob[i])[-3:] for i in range(len(y_test_enc))])
    macro_f1 = f1_score(y_test_enc, pred, average="macro")

    print(f"Top-1:    {top1:.3f}")
    print(f"Top-2:    {top2:.3f}")
    print(f"Top-3:    {top3:.3f}")
    print(f"Macro-F1: {macro_f1:.3f}")
    print(classification_report(y_test_enc, pred))

    output = WEIGHTS_DIR / "final_model.pkl"
    joblib.dump(gbm, output)
    print(f"Saved final_model.pkl to {output}")


if __name__ == "__main__":
    main()
