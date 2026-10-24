"""
Cleans the Open Psychometrics RIASEC dataset into a modelling table.

    python data_scripts/clean_riasec.py

Input : data/raw/riasec/data.csv              (145,828 rows, tab-separated)
Output: data/processed/riasec_clean.csv       (one row per valid, labelled respondent)
        data/processed/riasec_cleaning_log.json (rows removed at every step)

Steps
  1. Missing values  - 0 is the "no answer" code in every column, recode it to NaN
  2. Validity        - drop vocabulary over-claimers, speeders and straight-liners
  3. Outliers        - impossible ages / family sizes become NaN, then out-of-range ages are dropped
  4. Item imputation - fill up to 4 skipped interest items with that person's median on the same scale
  5. Duplicates      - drop repeated submissions (same answers + demographics)
  6. Target label    - map free-text major onto the 7 houses, drop non-answers
"""

import json
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from house_mapping import map_to_house  # noqa: E402

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(BASE, "data", "raw", "riasec", "data.csv")
OUT = os.path.join(BASE, "data", "processed")

SCALES = "RIASEC"
ITEMS = [f"{s}{i}" for s in SCALES for i in range(1, 9)]
TIPI = [f"TIPI{i}" for i in range(1, 11)]
VCL = [f"VCL{i}" for i in range(1, 17)]
FAKE_WORDS = ["VCL6", "VCL9", "VCL12"]      # not real words (see codebook)
DEMO = ["education", "urban", "gender", "engnat", "hand", "religion",
        "orientation", "race", "voted", "married"]

MIN_TEST_SECONDS = 60      # 48 items in under a minute = not reading the questions
MAX_MISSING_ITEMS = 4      # impute at most 4 of 48 interest items
AGE_RANGE = (13, 80)
MAX_FAMILY_SIZE = 20

log = []


def step(name, df, before):
    log.append({"step": name, "rows_before": before, "rows_after": len(df),
                "removed": before - len(df)})
    print(f"  {name:<55} {before:>7} -> {len(df):>7}  (-{before - len(df)})")
    return df


def main():
    os.makedirs(OUT, exist_ok=True)
    df = pd.read_csv(RAW, sep="\t", low_memory=False)
    print(f"loaded {len(df):,} rows x {df.shape[1]} columns")

    # 1. "0" = unanswered everywhere: Likert items are 1-5 / 1-7, demographics start at 1
    df[ITEMS + TIPI + DEMO] = df[ITEMS + TIPI + DEMO].replace(0, np.nan)
    df["major"] = df["major"].astype("string").str.strip().replace("", pd.NA)
    df["country"] = df["country"].replace({"NONE": pd.NA, "(nu": pd.NA})
    missing_before = df[ITEMS + TIPI + DEMO + ["major"]].isna().sum()

    # 2. validity checks
    n = len(df)
    df = step("drop: claimed to know >=2 of the 3 fake words",
              df[df[FAKE_WORDS].sum(axis=1) < 2], n)
    df["fake_word_flag"] = (df[FAKE_WORDS].sum(axis=1) == 1).astype(int)
    n = len(df)
    df = step(f"drop: finished 48 items in < {MIN_TEST_SECONDS}s (speeders)",
              df[df["testelapse"] >= MIN_TEST_SECONDS], n)
    n = len(df)
    df = step("drop: identical answer to all 48 items (straight-lining)",
              df[df[ITEMS].std(axis=1, skipna=True) > 0], n)

    # 3. outliers: typed garbage like age=2147483647 or familysize=999999999
    bad_age = ~df["age"].between(*AGE_RANGE)
    df.loc[df["familysize"] > MAX_FAMILY_SIZE, "familysize"] = np.nan
    n = len(df)
    df = step(f"drop: age outside {AGE_RANGE[0]}-{AGE_RANGE[1]}", df[~bad_age], n)
    # testelapse has a long right tail (people leaving the tab open): cap at the 99th pct
    cap = df["testelapse"].quantile(0.99)
    df["testelapse_capped"] = df["testelapse"].clip(upper=cap)

    # 4. impute a few skipped interest items, drop people who skipped many
    n_missing = df[ITEMS].isna().sum(axis=1)
    n = len(df)
    df = step(f"drop: skipped more than {MAX_MISSING_ITEMS} interest items",
              df[n_missing <= MAX_MISSING_ITEMS].copy(), n)
    imputed = int(df[ITEMS].isna().sum().sum())
    for s in SCALES:
        cols = [f"{s}{i}" for i in range(1, 9)]
        row_median = df[cols].median(axis=1)
        for c in cols:
            df[c] = df[c].fillna(row_median)
    # TIPI pairs are scored together, so a missing TIPI item is filled with the column median
    df[TIPI] = df[TIPI].fillna(df[TIPI].median())
    # categorical demographics: keep NaN as its own "unknown" level for encoding later
    df["familysize"] = df["familysize"].fillna(df["familysize"].median())

    # 5. duplicates (same person submitting twice)
    key = ITEMS + TIPI + ["age", "gender", "country", "major"]
    n = len(df)
    df = step("drop: duplicate submissions", df.drop_duplicates(subset=key), n)

    # 6. target label
    df["house"] = df["major"].map(map_to_house)
    unlabelled = int(df["house"].isna().sum())
    n = len(df)
    df = step("drop: no usable major (blank, 'undecided', unmatched)",
              df[df["house"].notna()], n)

    keep = ITEMS + TIPI + VCL + ["fake_word_flag", "testelapse_capped", "age", "familysize",
                                  "country"] + DEMO + ["major", "house"]
    df = df[keep].reset_index(drop=True)
    df.to_csv(os.path.join(OUT, "riasec_clean.csv"), index=False)

    summary = {
        "rows_raw": int(log[0]["rows_before"]),
        "rows_clean": len(df),
        "steps": log,
        "interest_items_imputed": imputed,
        "rows_without_usable_major": unlabelled,
        "testelapse_cap_seconds": float(cap),
        "missing_values_raw": {k: int(v) for k, v in missing_before.items() if v > 0},
        "class_counts": df["house"].value_counts().to_dict(),
        "pakistan_rows": int((df["country"] == "PK").sum()),
    }
    with open(os.path.join(OUT, "riasec_cleaning_log.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nclean rows: {len(df):,}   Pakistan rows: {summary['pakistan_rows']}")
    print(df["house"].value_counts().to_string())


if __name__ == "__main__":
    main()
