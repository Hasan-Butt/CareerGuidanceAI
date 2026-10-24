"""
Cleans the Pakistan labour-market sources used for the parent-facing statistical report.

    python data_scripts/clean_pakistan.py

Outputs (data/processed/pakistan/)
  ilo_tidy.csv          all 9 ILO indicators in one long table, labels split from codes
  sector_earnings.csv   latest average monthly earnings per ISIC sector, mapped to houses
  worldbank_wide.csv    year x indicator table
  rozee_clean.csv       de-duplicated job postings with house, experience and degree level
  pakistan_cleaning_log.json
"""

import glob
import json
import os
import re
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from house_mapping import map_to_house  # noqa: E402

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(BASE, "data", "raw", "pakistan")
OUT = os.path.join(BASE, "data", "processed", "pakistan")
log = {}

# ISIC rev.4 sections that act as a proxy for each house's job market
SECTOR_TO_HOUSE = {
    "Q": "Medicine & Health",
    "J": "Computer Science & IT",
    "K": "Business & Commerce",
    "G": "Business & Commerce",
    "C": "Engineering",
    "F": "Engineering",
    "D": "Engineering",
    "M": "Law / Professional & Scientific",
    "P": "Arts, Humanities & Social Sciences",
    "R": "Arts, Humanities & Social Sciences",
}


def split_label(s):
    """'ECO_ISIC4_J: J. Information and communication' -> ('ECO_ISIC4_J', 'J. Information...')"""
    if not isinstance(s, str) or ":" not in s:
        return s, s
    code, label = s.split(":", 1)
    return code.strip(), label.strip()


def clean_ilo():
    frames = []
    for path in sorted(glob.glob(os.path.join(RAW, "ilo", "DF_*.csv"))):
        df = pd.read_csv(path)
        dim = next(c for c in df.columns if c.split(":")[0] in ("OCU", "ECO", "EDU"))
        cur = next((c for c in df.columns if c.startswith("CUR:")), None)
        part = pd.DataFrame({
            "indicator": os.path.basename(path)[:-4],
            "measure": df["MEASURE: Measure"].map(lambda s: split_label(s)[1]),
            "sex": df["SEX: Sex"].map(lambda s: split_label(s)[0].replace("SEX_", "")),
            "dimension": dim.split(":")[0],
            "category_code": df[dim].map(lambda s: split_label(s)[0]),
            "category": df[dim].map(lambda s: split_label(s)[1]),
            "currency": df[cur].map(lambda s: split_label(s)[0]) if cur else "",
            "period": df["TIME_PERIOD: Time period"].astype(str),
            "value": pd.to_numeric(df["OBS_VALUE"], errors="coerce"),
        })
        frames.append(part)
    ilo = pd.concat(frames, ignore_index=True)
    n = len(ilo)
    ilo = ilo.dropna(subset=["value"]).drop_duplicates()
    ilo["frequency"] = np.where(ilo["period"].str.contains("Q"), "quarterly", "annual")
    ilo["year"] = ilo["period"].str[:4].astype(int)
    log["ilo"] = {"rows_raw": n, "rows_clean": len(ilo), "dropped_missing_or_duplicate": n - len(ilo)}
    ilo.to_csv(os.path.join(OUT, "ilo_tidy.csv"), index=False)

    # latest annual earnings per ISIC4 sector, local currency, both sexes
    e = ilo[(ilo["indicator"] == "DF_EAR_EMTA_SEX_ECO_CUR_NB") & (ilo["frequency"] == "annual")
            & (ilo["sex"] == "T") & (ilo["currency"] == "CUR_TYPE_LCU")
            & ilo["category_code"].str.match(r"ECO_ISIC4_[A-U]$")].copy()
    latest = e["year"].max()
    e = e[e["year"] == latest]
    e["section"] = e["category_code"].str[-1]
    e["house_proxy"] = e["section"].map(SECTOR_TO_HOUSE)
    e = e[["year", "section", "category", "house_proxy", "value"]].rename(
        columns={"value": "avg_monthly_earnings_pkr"}).sort_values("avg_monthly_earnings_pkr",
                                                                   ascending=False)
    e.to_csv(os.path.join(OUT, "sector_earnings.csv"), index=False)
    log["sector_earnings_year"] = int(latest)


def clean_worldbank():
    wb = pd.read_csv(os.path.join(RAW, "worldbank", "pakistan_indicators.csv"))
    n = len(wb)
    wb = wb.dropna(subset=["value"])
    wide = wb.pivot_table(index="year", columns="indicator_name", values="value").sort_index()
    wide.to_csv(os.path.join(OUT, "worldbank_wide.csv"))
    log["worldbank"] = {"rows_raw": n, "rows_non_null": len(wb), "years": [int(wide.index.min()),
                                                                          int(wide.index.max())]}


DEGREE_PATTERNS = [  # highest level wins, so check from the top
    ("PhD", r"\bph\.?d\b|doctorate"),
    ("Professional (MBBS/BDS/Pharm-D/LLB)", r"\bmbbs\b|\bbds\b|pharm[- ]?d|\bllb\b|\bfcps\b"),
    ("Master's", r"master|\bms\b|\bmsc\b|\bmba\b|\bmphil\b|\bm\.?com\b|\bma\b|postgraduate"),
    ("Bachelor's", r"bachelor|\bbs\b|\bbsc\b|\bbba\b|\bbe\b|\bb\.?com\b|\bba\b|graduat|degree"),
    ("Intermediate", r"intermediate|\bfsc\b|\bfa\b|\bics\b|\bi\.?com\b|a[- ]level"),
    ("Matric or below", r"matric|o[- ]level|primary|middle|high school|\bssc\b"),
]
_DEG = [(lvl, re.compile(p, re.I)) for lvl, p in DEGREE_PATTERNS]


def degree_level(structured, description):
    for text in (structured, description):
        if isinstance(text, str) and text.strip() and text.strip() != "0":
            for lvl, rx in _DEG:
                if rx.search(text):
                    return lvl
    return np.nan


def experience_years(text):
    if not isinstance(text, str):
        return np.nan
    t = text.lower()
    if "fresh" in t or "less than" in t:
        return 0.0
    m = re.search(r"(\d+(\.\d+)?)", t)
    return float(m.group(1)) if m else np.nan


def clean_rozee():
    df = pd.read_csv(os.path.join(RAW, "rozee", "rozee_jobs.csv"), low_memory=False)
    steps = {"rows_raw": len(df)}
    df = df.dropna(subset=["title"])
    df["title"] = df["title"].str.strip()
    df["company"] = df["company"].fillna("Confidential").str.strip()
    df["city"] = df["city"].fillna("Unknown").str.strip().replace({"All Cities": "Multiple cities"})
    before = len(df)
    df = df.drop_duplicates(subset=["title", "company", "city"])
    steps["dropped_duplicate_title_company_city"] = before - len(df)

    df["experience_years"] = df["experience_text"].map(experience_years)
    outlier = df["experience_years"] > 25
    steps["experience_outliers_set_nan"] = int(outlier.sum())
    df.loc[outlier, "experience_years"] = np.nan

    df["degree_level"] = [degree_level(a or b, d) for a, b, d in
                          zip(df["degreeTitle_text"].where(df["degreeTitle_text"].notna(), None),
                              df["rejFil_min_degreeTitle_text"].where(
                                  df["rejFil_min_degreeTitle_text"].notna(), None),
                              df["description_raw"])]
    df["house"] = df["title"].map(map_to_house)
    df["posted"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True).dt.date

    keep = ["jid", "title", "company", "city", "house", "experience_years", "degree_level",
            "industry_exact", "posted", "jobSource"]
    df = df[keep]
    steps.update({
        "rows_clean": len(df),
        "house_mapped": int(df["house"].notna().sum()),
        "degree_level_found": int(df["degree_level"].notna().sum()),
        "jobs_per_house": df["house"].value_counts().to_dict(),
        "top_cities": df["city"].value_counts().head(8).to_dict(),
    })
    log["rozee"] = steps
    df.to_csv(os.path.join(OUT, "rozee_clean.csv"), index=False)


def main():
    os.makedirs(OUT, exist_ok=True)
    clean_ilo()
    clean_worldbank()
    clean_rozee()
    with open(os.path.join(OUT, "pakistan_cleaning_log.json"), "w") as f:
        json.dump(log, f, indent=2, default=str)
    print(json.dumps(log, indent=2, default=str))


if __name__ == "__main__":
    main()
