"""
Checks whether each supplementary Kaggle career dataset contains learnable signal.

    python data_scripts/evaluate_supplementary.py

For every dataset, a gradient-boosting classifier predicts the dataset's own target from
its own features (3-fold cross-validation). A usable dataset must clearly beat both random
guessing (1 / n_classes) and always predicting the most common class.
Reads data/raw/excluded/supplementary_career/, writes docs/supplementary_evaluation.csv.
"""

import os

import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import cross_val_score

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(BASE, "data", "raw", "excluded", "supplementary_career")
ID_COLS = {"id", "Student ID", "Name", "CandidateID", "Recommendation_Score"}
DATASETS = {
    "roo_data.csv": "Suggested Job Role",
    "dataSet.csv": "Suggested Job Role",
    "Career-prediction-data.csv": "Suggested Job Role",
    "career_path_in_all_field.csv": "Career",
    "career_dataset_large.xlsx": "Recommended Career",
    "output.csv": "suggested_job_roll",
    "Course_Job_Recommendation_Dataset.csv": "Jobs.Job Title",
    "career_compute_dataset.csv": "ROLE",
    "cs_students.csv": "Future Career",
    "AI-based Career Recommendation System.csv": "Recommended_Career",
}


def main():
    rows = []
    for name, target in DATASETS.items():
        path = os.path.join(SRC, name)
        df = pd.read_excel(path) if name.endswith(".xlsx") else pd.read_csv(path, low_memory=False)
        labelled = df.dropna(subset=[target])
        row = {"dataset": name, "rows": len(df), "labelled_rows": len(labelled)}
        if len(labelled) < 100:
            rows.append({**row, "verdict": "too few labels"})
            continue
        if len(labelled) > 8000:
            labelled = labelled.sample(8000, random_state=0)
        y = labelled[target].astype("category").cat.codes
        X = labelled.drop(columns=[target, *(ID_COLS & set(labelled.columns))])
        X = X.apply(lambda s: s if pd.api.types.is_numeric_dtype(s) else s.astype("category").cat.codes)
        acc = cross_val_score(HistGradientBoostingClassifier(max_iter=150, random_state=0), X, y, cv=3).mean()
        row.update(classes=y.nunique(), random_guess=round(1 / y.nunique(), 3),
                   majority=round(y.value_counts(normalize=True).iloc[0], 3), cv_accuracy=round(acc, 3))
        rows.append(row)
        print(f"{name:45s} classes={row['classes']:3d} random={row['random_guess']:.3f} "
              f"majority={row['majority']:.3f} model={acc:.3f}")
    out = pd.DataFrame(rows)
    out.to_csv(os.path.join(BASE, "docs", "supplementary_evaluation.csv"), index=False)


if __name__ == "__main__":
    main()
