"""Evaluate the saved classifier and create its confusion matrix."""

from pathlib import Path
import sys

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    classification_report,
    f1_score,
    roc_auc_score,
)
from sklearn.preprocessing import label_binarize

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from src.models.train import detect_label, locate_processed_file, split_features


def main() -> None:
    test = pd.read_csv(locate_processed_file("test.csv"))
    label = detect_label(test)
    X_test, y_test, _ = split_features(test, label)
    model_path = ROOT / "models" / "weights" / "final_model.pkl"
    model = joblib.load(model_path)
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)
    classes = np.asarray(model.classes_)
    class_indices = {value: index for index, value in enumerate(classes)}
    y_indices = np.array([class_indices[value] for value in y_test])
    rankings = np.argsort(y_prob, axis=1)

    print("Classification report:\n" + classification_report(y_test, y_pred, zero_division=0))
    top1 = float(np.mean(y_pred == y_test))
    top2 = float(np.mean([y_indices[i] in rankings[i, -2:] for i in range(len(y_indices))]))
    top3 = float(np.mean([y_indices[i] in rankings[i, -3:] for i in range(len(y_indices))]))
    y_binary = label_binarize(y_test, classes=classes)
    auc = float(roc_auc_score(y_binary, y_prob, multi_class="ovr", average="macro"))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    print(f"Top-1 accuracy: {top1:.4f}")
    print(f"Top-2 accuracy: {top2:.4f}")
    print(f"Top-3 accuracy: {top3:.4f}")
    print(f"AUC-ROC (macro OvR): {auc:.4f}")
    print("\nSummary metrics:")
    print(pd.DataFrame([{
        "top1": top1,
        "top2": top2,
        "top3": top3,
        "macro_f1": macro_f1,
        "auc_roc_macro_ovr": auc,
    }]).to_string(index=False))

    output_dir = ROOT / "report" / "figures"
    output_dir.mkdir(parents=True, exist_ok=True)
    figure_path = output_dir / "confusion_matrix.png"
    fig, ax = plt.subplots(figsize=(10, 8))
    ConfusionMatrixDisplay.from_predictions(
        y_test,
        y_pred,
        labels=classes,
        display_labels=classes,
        ax=ax,
        xticks_rotation=45,
        colorbar=False,
    )
    fig.tight_layout()
    fig.savefig(figure_path, dpi=150)
    plt.close(fig)
    print(f"Created: {figure_path}")
    print(
        f"Baseline Top-1: 56.6% -> New Top-1: {top1:.1%}\n"
        f"Baseline Macro-F1: 0.35 -> New Macro-F1: {macro_f1:.2f}"
    )


if __name__ == "__main__":
    main()
