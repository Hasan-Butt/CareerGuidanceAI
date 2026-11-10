"""Evaluate model performance across sufficiently large sensitive subgroups."""

from pathlib import Path
import sys

import joblib
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.metrics import classification_report, f1_score

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from src.models.train import SENSITIVE_COLUMNS, detect_label, locate_processed_file, split_features


def main() -> None:
    test = pd.read_csv(locate_processed_file("test.csv"))
    label = detect_label(test)
    model_features, y_test, _ = split_features(test, label)
    sensitive_columns = sorted(SENSITIVE_COLUMNS.intersection(test.columns))
    output_dir = ROOT / "report" / "figures"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not sensitive_columns:
        print(
            "No sensitive columns found. Sensitive attributes were excluded from model "
            "inputs per the data/ethics policy."
        )
        return

    model = joblib.load(ROOT / "models" / "weights" / "final_model.pkl")
    predictions = model.predict(model_features)
    grouped = test[sensitive_columns].copy()
    grouped["true"] = y_test.to_numpy()
    grouped["pred"] = predictions
    results = []
    for column in sensitive_columns:
        for group, subgroup in grouped.groupby(column, dropna=False):
            if len(subgroup) < 50:
                continue
            score = f1_score(subgroup["true"], subgroup["pred"], average="macro", zero_division=0)
            results.append({
                "attribute": column,
                "group": group,
                "n": len(subgroup),
                "macro_f1": round(float(score), 3),
            })
            print(f"\n[{column} = {group}] n={len(subgroup)}")
            print(classification_report(subgroup["true"], subgroup["pred"], zero_division=0))

    summary = pd.DataFrame(results, columns=["attribute", "group", "n", "macro_f1"])
    print("\n=== Bias Summary ===")
    print(summary.to_string(index=False))
    summary_path = output_dir / "bias_check.csv"
    summary.to_csv(summary_path, index=False)
    print(f"Created: {summary_path}")

    gender = summary[summary["attribute"] == "gender"]
    if not gender.empty:
        figure_path = output_dir / "bias_gender.png"
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.bar(gender["group"].astype(str), gender["macro_f1"])
        ax.set_ylabel("Macro-F1")
        ax.set_title("Model Macro-F1 by Gender")
        fig.tight_layout()
        fig.savefig(figure_path, dpi=150)
        plt.close(fig)
        print(f"Created: {figure_path}")


if __name__ == "__main__":
    main()
