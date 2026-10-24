"""
Exploratory data analysis: writes every chart used in the Deliverable 1 report.

    python data_scripts/eda.py

Reads raw + processed data, writes PNGs to report/figures/ and a few summary
numbers to report/figures/eda_stats.json.
"""

import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(BASE, "data", "raw")
PROC = os.path.join(BASE, "data", "processed")
FIG = os.path.join(BASE, "report", "figures")

# colours: validated categorical palette (fixed order) + neutral inks
BLUE, ORANGE, AQUA, YELLOW, MAGENTA, GREEN, VIOLET = (
    "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6")
INK, INK2, MUTED, GRID, AXIS, SURFACE = "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#c3c2b7", "#fcfcfb"
NEUTRAL_BAR = "#c3c2b7"
DIVERGING = LinearSegmentedColormap.from_list("div", [BLUE, "#f0efec", ORANGE])
HOUSE_ORDER = ["Arts, Humanities & Social Sciences", "Business & Commerce", "Medicine & Health",
               "Pure Sciences", "Engineering", "Computer Science & IT", "Law"]
SHORT = {"Arts, Humanities & Social Sciences": "Arts & Social Sci.",
         "Business & Commerce": "Business", "Medicine & Health": "Medicine & Health",
         "Pure Sciences": "Pure Sciences", "Engineering": "Engineering",
         "Computer Science & IT": "CS & IT", "Law": "Law"}

plt.rcParams.update({
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
    "font.size": 10, "axes.titlesize": 11, "axes.titleweight": "bold", "axes.titlelocation": "left",
    "axes.edgecolor": AXIS, "axes.labelcolor": INK2, "text.color": INK,
    "xtick.color": MUTED, "ytick.color": INK2, "axes.grid": True, "grid.color": GRID,
    "grid.linewidth": 0.6, "axes.axisbelow": True, "axes.spines.top": False,
    "axes.spines.right": False, "legend.frameon": False, "figure.dpi": 110,
})
stats = {}


def save(fig, name):
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, name), dpi=200)
    plt.close(fig)
    print("  wrote", name)


def hbar(ax, labels, values, color=BLUE, fmt="{:,.0f}", colors=None):
    y = np.arange(len(labels))[::-1]
    ax.barh(y, values, color=colors or color, height=0.7, edgecolor=SURFACE, linewidth=1.5)
    ax.set_yticks(y, labels)
    ax.grid(axis="y", visible=False)
    vmax = max(values)
    for yi, v in zip(y, values):
        ax.text(v + vmax * 0.01, yi, fmt.format(v), va="center", fontsize=8.5, color=INK2)
    ax.set_xlim(0, vmax * 1.15)


def load():
    raw = pd.read_csv(os.path.join(RAW, "riasec", "data.csv"), sep="\t", low_memory=False)
    feats = pd.read_csv(os.path.join(PROC, "features_all.csv"), low_memory=False)
    with open(os.path.join(PROC, "riasec_cleaning_log.json")) as f:
        clog = json.load(f)
    return raw, feats, clog


def fig_raw_majors(raw):
    m = raw["major"].dropna().astype(str).str.strip().str.lower()
    vc = m[m != ""].value_counts().head(20)
    stats["unique_raw_majors"] = int(m[m != ""].nunique())
    fig, ax = plt.subplots(figsize=(7, 5.2))
    hbar(ax, list(vc.index), list(vc.values))
    ax.set_title(f"Top 20 raw 'major' answers ({stats['unique_raw_majors']:,} distinct spellings)")
    ax.set_xlabel("respondents")
    save(fig, "raw_majors_top20.png")


def fig_class_distribution(feats):
    vc = feats["house"].value_counts().reindex(HOUSE_ORDER)
    total = vc.sum()
    fig, ax = plt.subplots(figsize=(7, 3.6))
    hbar(ax, [SHORT[h] for h in vc.index], list(vc.values))
    for i, (h, v) in enumerate(vc.items()):
        ax.texts[i].set_text(f"{v:,}  ({v / total:.1%})")
    ax.set_title(f"Target classes after mapping majors (n = {total:,})")
    ax.set_xlabel("respondents")
    stats["imbalance_ratio_max_min"] = round(vc.max() / vc.min(), 1)
    save(fig, "class_distribution.png")


def fig_missing(clog):
    miss = pd.Series(clog["missing_values_raw"]).sort_values(ascending=False).head(15)
    fig, ax = plt.subplots(figsize=(7, 4.2))
    hbar(ax, list(miss.index), list(miss.values))
    ax.set_title("Missing values per column (raw data)")
    ax.set_xlabel("missing cells")
    save(fig, "missing_values.png")


def fig_cleaning_funnel(clog):
    labels = ["Raw"] + [s["step"].replace("drop: ", "") for s in clog["steps"]]
    values = [clog["rows_raw"]] + [s["rows_after"] for s in clog["steps"]]
    short = ["Raw download", "Fake-word over-claimers", "Speeders (<60 s)", "Straight-liners",
             "Impossible ages", ">4 skipped items", "Duplicates", "No usable major"]
    fig, ax = plt.subplots(figsize=(7, 3.8))
    hbar(ax, short[:len(values)], values)
    ax.set_title("Rows remaining after each cleaning step")
    ax.set_xlabel("rows")
    save(fig, "cleaning_funnel.png")


def fig_outliers(raw):
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(8.5, 3.4))
    age = raw["age"]
    shown = age[age <= 100]
    a1.hist(shown, bins=60, color=BLUE, edgecolor=SURFACE, linewidth=0.5)
    a1.axvspan(80, 100, color=ORANGE, alpha=0.15, lw=0)
    a1.set_title("Age (raw)")
    a1.set_xlabel(f"years  ({(age > 100).sum()} values > 100 not shown, max = {age.max():,})")
    a1.text(82, a1.get_ylim()[1] * 0.85, "removed\n>80", color=INK2, fontsize=8.5)
    t = raw["testelapse"].clip(lower=1)
    a2.hist(np.log10(t), bins=60, color=BLUE, edgecolor=SURFACE, linewidth=0.5)
    a2.axvline(np.log10(60), color=ORANGE, lw=2)
    a2.text(np.log10(60) - 0.08, a2.get_ylim()[1] * 0.85, "60 s cut-off", color=INK2, fontsize=8.5,
            ha="right")
    ticks = [10, 60, 300, 1800, 3600 * 6, 86400 * 7]
    a2.set_xticks(np.log10(ticks), ["10s", "1m", "5m", "30m", "6h", "7d"])
    a2.set_title("Time on the 48 questions (log)")
    a2.set_xlabel("seconds")
    save(fig, "outliers.png")


NUMERIC = ["realistic", "investigative", "artistic", "social", "enterprising", "conventional",
           "extraversion", "agreeableness", "conscientiousness", "emotional_stability", "openness",
           "vocab_score", "differentiation", "age", "familysize", "education"]


def fig_correlation(feats):
    c = feats[NUMERIC].corr()
    fig, ax = plt.subplots(figsize=(7.4, 6.2))
    im = ax.imshow(c, cmap=DIVERGING, vmin=-1, vmax=1)
    ax.set_xticks(range(len(NUMERIC)), NUMERIC, rotation=60, ha="right", fontsize=8)
    ax.set_yticks(range(len(NUMERIC)), NUMERIC, fontsize=8)
    ax.grid(False)
    for i in range(len(NUMERIC)):
        for j in range(len(NUMERIC)):
            v = c.iloc[i, j]
            if i != j and abs(v) >= 0.3:
                ax.text(j, i, f"{v:.2f}", ha="center", va="center", fontsize=6.5, color=INK)
    fig.colorbar(im, ax=ax, fraction=0.04, pad=0.02, label="Pearson r")
    ax.set_title("Feature correlations (|r| >= 0.3 labelled)")
    pairs = c.where(np.triu(np.ones(c.shape, bool), 1)).stack().sort_values(key=abs, ascending=False)
    stats["top_correlations"] = {f"{a} ~ {b}": round(v, 2) for (a, b), v in pairs.head(6).items()}
    save(fig, "feature_correlation.png")


def fig_house_profiles(feats):
    cols = NUMERIC[:11]
    z = (feats[cols] - feats[cols].mean()) / feats[cols].std()
    prof = z.groupby(feats["house"]).mean().reindex(HOUSE_ORDER)
    fig, ax = plt.subplots(figsize=(8.2, 3.9))
    im = ax.imshow(prof, cmap=DIVERGING, vmin=-0.8, vmax=0.8, aspect="auto")
    ax.set_xticks(range(len(cols)), cols, rotation=35, ha="right", fontsize=8.5)
    ax.set_yticks(range(len(prof)), [SHORT[h] for h in prof.index])
    ax.grid(False)
    for i in range(prof.shape[0]):
        for j in range(prof.shape[1]):
            ax.text(j, i, f"{prof.iloc[i, j]:+.2f}", ha="center", va="center", fontsize=7, color=INK)
    fig.colorbar(im, ax=ax, fraction=0.03, pad=0.02, label="mean z-score")
    ax.set_title("Mean interest & personality profile per house (z-scores)")
    stats["strongest_scale_per_house"] = {h: prof.loc[h, NUMERIC[:6]].idxmax() for h in prof.index}
    save(fig, "house_profiles.png")


def fig_scale_distributions(feats):
    names = NUMERIC[:6]
    fig, axes = plt.subplots(2, 3, figsize=(8.5, 4.6), sharey=True)
    for ax, n in zip(axes.ravel(), names):
        ax.hist(feats[n], bins=np.arange(1, 5.25, 0.25), color=BLUE, edgecolor=SURFACE, linewidth=0.8)
        ax.set_title(n.capitalize(), fontsize=10)
        ax.axvline(feats[n].mean(), color=ORANGE, lw=1.5)
    axes[1, 0].set_xlabel("scale score (1-5)")
    fig.suptitle("Distribution of the six RIASEC scale scores (orange = mean)", x=0.01, ha="left",
                 fontweight="bold", fontsize=11)
    save(fig, "riasec_distributions.png")


def fig_gender_by_house(feats):
    ct = pd.crosstab(feats["house"], feats["gender"], normalize="index").reindex(HOUSE_ORDER)
    ct = ct[[c for c in ["female", "male", "other", "unknown"] if c in ct]]
    colors = {"female": BLUE, "male": ORANGE, "other": AQUA, "unknown": NEUTRAL_BAR}
    fig, ax = plt.subplots(figsize=(7.5, 3.6))
    y = np.arange(len(ct))[::-1]
    left = np.zeros(len(ct))
    for g in ct.columns:
        ax.barh(y, ct[g], left=left, color=colors[g], height=0.7, edgecolor=SURFACE, linewidth=2,
                label=g)
        for yi, l, v in zip(y, left, ct[g]):
            if v > 0.08:
                ax.text(l + v / 2, yi, f"{v:.0%}", ha="center", va="center", fontsize=8,
                        color="#ffffff")
        left += ct[g].values
    ax.set_yticks(y, [SHORT[h] for h in ct.index])
    ax.set_xlim(0, 1)
    ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0))
    ax.grid(axis="y", visible=False)
    ax.legend(ncol=4, loc="lower left", bbox_to_anchor=(0, 1.0), fontsize=8.5)
    ax.set_title("Gender share per house (bias check preview)", pad=22)
    stats["female_share_overall"] = round(float((feats["gender"] == "female").mean()), 3)
    save(fig, "gender_by_house.png")


def fig_countries(feats_raw):
    vc = feats_raw["country"].value_counts().head(12)
    pk = int((feats_raw["country"] == "PK").sum())
    labels, values = list(vc.index), list(vc.values)
    if "PK" not in labels:
        labels.append("PK (Pakistan)")
        values.append(pk)
    colors = [ORANGE if lbl.startswith("PK") else BLUE for lbl in labels]
    fig, ax = plt.subplots(figsize=(7, 4))
    hbar(ax, labels, values, colors=colors)
    ax.set_title("Respondents by country (Pakistan in orange)")
    ax.set_xlabel("respondents")
    stats["us_share"] = round(float((feats_raw["country"] == "US").mean()), 3)
    save(fig, "countries.png")


def fig_pk_unemployment():
    ilo = pd.read_csv(os.path.join(PROC, "pakistan", "ilo_tidy.csv"))
    u = ilo[(ilo["indicator"] == "DF_UNE_DEAP_SEX_EDU_RT") & (ilo["sex"] == "T")
            & (ilo["frequency"] == "annual")
            & ilo["category_code"].isin(["EDU_AGGREGATE_BAS", "EDU_AGGREGATE_INT",
                                         "EDU_AGGREGATE_ADV", "EDU_AGGREGATE_TOTAL"])]
    names = {"EDU_AGGREGATE_ADV": ("Advanced (degree)", ORANGE),
             "EDU_AGGREGATE_INT": ("Intermediate", BLUE),
             "EDU_AGGREGATE_BAS": ("Basic", AQUA),
             "EDU_AGGREGATE_TOTAL": ("All workers", MUTED)}
    fig, ax = plt.subplots(figsize=(7.5, 3.8))
    for code, (label, color) in names.items():
        s = u[u["category_code"] == code].sort_values("year")
        ax.plot(s["year"], s["value"], color=color, lw=2, marker="o", ms=4, label=label)
        if len(s):
            stats[f"pk_unemployment_{code}_{int(s['year'].iloc[-1])}"] = round(s["value"].iloc[-1], 1)
    ax.set_ylabel("unemployment rate (%)")
    ax.xaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
    ax.legend(loc="upper left", fontsize=8.5)
    ax.set_title("Pakistan: unemployment rate by education level (ILO)")
    save(fig, "pk_unemployment_by_education.png")


def fig_pk_sector_earnings():
    e = pd.read_csv(os.path.join(PROC, "pakistan", "sector_earnings.csv"))
    e = e.sort_values("avg_monthly_earnings_pkr", ascending=False)
    labels = [c.split(". ", 1)[1].split(";")[0][:60] for c in e["category"]]
    colors = [BLUE if isinstance(h, str) else NEUTRAL_BAR for h in e["house_proxy"]]
    fig, ax = plt.subplots(figsize=(8, 5.4))
    hbar(ax, labels, list(e["avg_monthly_earnings_pkr"]), colors=colors, fmt="Rs {:,.0f}")
    ax.set_title(f"Pakistan: avg monthly earnings by sector, {int(e['year'].iloc[0])}")
    ax.set_xlabel("PKR per month")
    ax.tick_params(axis="y", labelsize=8)
    save(fig, "pk_sector_earnings.png")


def fig_rozee():
    r = pd.read_csv(os.path.join(PROC, "pakistan", "rozee_clean.csv"))
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.5, 3.6))
    vc = r["house"].fillna("No degree field").value_counts()
    order = [h for h in HOUSE_ORDER if h in vc] + ["No degree field"]
    vc = vc.reindex(order).sort_values(ascending=False)
    hbar(a1, [SHORT.get(h, h) for h in vc.index], list(vc.values),
         colors=[NEUTRAL_BAR if h == "No degree field" else BLUE for h in vc.index])
    a1.set_title(f"Job postings per house (n = {len(r):,})")
    deg_order = ["Matric or below", "Intermediate", "Bachelor's", "Master's",
                 "Professional (MBBS/BDS/Pharm-D/LLB)", "PhD"]
    d = r["degree_level"].value_counts().reindex(deg_order).fillna(0)
    hbar(a2, ["Professional" if "Prof" in x else x for x in d.index], list(d.values))
    a2.set_title("Minimum degree asked for")
    stats["rozee_bachelor_share_of_known"] = round(float(d["Bachelor's"] / d.sum()), 3)
    save(fig, "rozee_postings.png")


def main():
    os.makedirs(FIG, exist_ok=True)
    raw, feats, clog = load()
    clean = pd.read_csv(os.path.join(PROC, "riasec_clean.csv"), usecols=["country"],
                        low_memory=False)
    fig_raw_majors(raw)
    fig_class_distribution(feats)
    fig_missing(clog)
    fig_cleaning_funnel(clog)
    fig_outliers(raw)
    fig_correlation(feats)
    fig_house_profiles(feats)
    fig_scale_distributions(feats)
    fig_gender_by_house(feats)
    fig_countries(clean)
    fig_pk_unemployment()
    fig_pk_sector_earnings()
    fig_rozee()
    with open(os.path.join(FIG, "eda_stats.json"), "w") as f:
        json.dump(stats, f, indent=2, default=str)
    print(json.dumps(stats, indent=2, default=str))


if __name__ == "__main__":
    main()
