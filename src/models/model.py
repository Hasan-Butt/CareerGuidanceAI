# src/models/model.py
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
import joblib
import os

def build_gradient_boosting(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    min_samples_leaf=20
):
    """
    Best architecture from baseline: GBM with 88 features.
    class_weight not natively supported in GBM — handle via sample_weight in train.py.
    """
    return GradientBoostingClassifier(
        n_estimators=n_estimators,
        learning_rate=learning_rate,
        max_depth=max_depth,
        subsample=subsample,
        min_samples_leaf=min_samples_leaf,
        random_state=42,
        verbose=0
    )

def build_random_forest(
    n_estimators=300,
    max_depth=20,
    min_samples_split=10
):
    """
    Second architecture for comparison.
    Natively supports class_weight='balanced'.
    """
    return RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        class_weight='balanced',
        n_jobs=-1,
        random_state=42
    )

def save_model(model, path="models/weights/final_model.pkl"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(model, path)
    print(f"Model saved to {path}")

def load_model(path="models/weights/final_model.pkl"):
    return joblib.load(path)