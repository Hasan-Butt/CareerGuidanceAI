# PakCareer AI

**Data-driven degree guidance for Pakistani college graduates.**
AI course project, FAST NUCES Lahore, **Track A (Application Development)**.

Students finishing intermediate or A-Levels in Pakistan often have their degree chosen for
them. PakCareer AI sorts a student into one of **seven degree families ("houses")** from their
interests (RIASEC) and personality (Big Five), and backs the recommendation with
**Pakistan-specific labour-market statistics** they can show their parents.

| House | | House |
|---|---|---|
| Medicine & Health | | Business & Commerce |
| Engineering | | Law |
| Computer Science & IT | | Arts, Humanities & Social Sciences |
| Pure Sciences | | |

**Team:** Kabeer Ahmed Shahzeb (24L-3087) · Muhammad Hasan Butt (24L-3022) · Muhammad Moosa Khan Rokhri (24L-3070)

---

## Status

| Deliverable | Phases | Status |
|---|---|---|
| 1 | Problem definition, data acquisition & preprocessing | ✅ Report: [`report/main.pdf`](report/main.pdf) |
| 2 | Model implementation & evaluation | upcoming |
| 3 | Hosted web app + final report | upcoming |

## Repository layout

```
pakcareer-ai/
├── data_scripts/              # all Phase 2 code
│   ├── collect_data.py        # downloads every raw source, writes data/raw/collection_log.json
│   ├── house_mapping.py       # free text (major / job title) -> house rules
│   ├── clean_riasec.py        # missing values, validity checks, outliers, duplicates, labels
│   ├── clean_pakistan.py      # ILO, World Bank, Rozee.pk cleaning
│   ├── build_features.py      # feature engineering, scaling, encoding, train/test split
│   ├── eda.py                 # every chart in the report
│   ├── evaluate_supplementary.py  # tests the 10 Kaggle datasets for learnable signal
│   └── baseline_models.py     # preliminary baselines (top-1/2/3 accuracy, macro-F1)
├── docs/                      # collection + cleaning logs (evidence, small JSON)
├── report/                    # LaTeX source, figures, compiled PDF
├── survey/                    # Google Form spec for the Pakistani student survey
├── data/                      # NOT in git, see "Getting the data"
├── requirements.txt
└── .gitignore
```

## Data sources

| Source | How | Size | Used for |
|---|---|---|---|
| [Open Psychometrics RIASEC test](http://openpsychometrics.org/_rawdata/) | download | 145,828 respondents | **training data** (target = university major) |
| [O*NET 31.0](https://www.onetcenter.org/database.html) | download | 21 tables, ~1,016 occupations | occupation interest profiles, skills, education |
| [ILOSTAT](https://sdmx.ilo.org) (Pakistan Labour Force Survey) | SDMX API | 9 indicators | earnings and unemployment by sector / education / sex |
| [World Bank](https://api.worldbank.org) | REST API | 16 indicators | enrolment, unemployment, inflation, exchange rate |
| [Rozee.pk](https://www.rozee.pk) | web scraping (robots.txt-compliant, 1.5 s delay) | 10,999 postings | current job demand per field and city |
| Our Pakistani student survey | Google Form | ongoing | local validation data, parental-pressure questions |
| [ESCO](https://esco.ec.europa.eu) occupations | download | 3,039 occupations | occupation taxonomy with ISCO codes |
| Career knowledge base + LLM Q&A sets (Kaggle / Hugging Face) | download | ~17k rows | text for the chatbot and the parents' report |

### Supplementary datasets we evaluated and excluded

We also tested 10 Kaggle career-prediction datasets as extra training data. For each one,
a gradient-boosting model with 3-fold cross-validation tried to predict the dataset's own
target. **None can train the house classifier:**

| Dataset | Model accuracy | Random guess | Problem |
|---|---|---|---|
| `roo_data.csv` (20k rows) | 4.0% | 2.9% | labels are random (synthetic) |
| `Career-prediction-data.csv` | 8.4% | 8.3% | labels are random |
| `career_path_in_all_field.csv` | 0.9% | 1.1% | labels are random |
| `career_dataset_large.xlsx` | 8.1% | 8.3% | labels are random |
| `output.csv` | 9.9% | 10.0% | labels are random |
| `dataSet.csv` | 23.6% | 28.8% (majority) | worse than always guessing the largest class |
| `Course_Job_Recommendation_Dataset.csv` | 100% | 2.2% | target leakage |
| `career_compute_dataset.csv` | n/a | n/a | only 49 of 7,525 rows labelled |
| `cs_students.csv`, `AI-based Career Recommendation System.csv` | 78% / 25% | 3% | 180–200 rows, mostly CS careers |

They are kept in the Drive folder under `raw/excluded/` with this evidence.

## Setup

```bash
git clone <this repo>
cd pakcareer-ai
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Getting the data

Raw data (~200 MB) is **not** in this repository. Either:

- **Download** the `PakCareer_Data` folder from Google Drive:
  <https://drive.google.com/drive/folders/1GI0pb6IfsBpBOtEVK4Soi82DH2AogIm9> and put its
  contents (`raw/`, `processed/`) in `data/`, **or**
- **Re-collect** everything yourself (about 35 minutes, mostly the Rozee.pk scrape):
  ```bash
  python data_scripts/collect_data.py              # all sources
  python data_scripts/collect_data.py --only ilo   # a single source
  ```

## Reproducing Deliverable 1

Run in this order. Each script prints what it removed or created:

```bash
python data_scripts/clean_riasec.py      # -> data/processed/riasec_clean.csv  (81,256 rows)
python data_scripts/clean_pakistan.py    # -> data/processed/pakistan/*.csv
python data_scripts/build_features.py    # -> data/processed/train.csv, test.csv, preprocessor.joblib
python data_scripts/eda.py               # -> report/figures/*.png
python data_scripts/evaluate_supplementary.py   # -> docs/supplementary_evaluation.csv
python data_scripts/baseline_models.py          # -> docs/baseline_results.csv
```

The report is compiled from `report/main.tex` with any LaTeX engine
(e.g. `tectonic report/main.tex` or Overleaf).

### Key numbers

- 145,828 raw responses → **81,256** clean, labelled rows (65,004 train / 16,252 test, stratified)
- 11,816 distinct spellings of "major" mapped to 7 houses (92.5% of non-blank answers)
- 30 model features: 6 RIASEC scores, 5 Big Five traits, vocabulary, profile differentiation,
  Holland code, demographics. All scaled and encoded, fitted on the training split only.
- Class imbalance 14:1 (Arts & Social Sciences vs. Law), handled with balanced class weights
- Gender, religion, race, orientation and country are **not** model inputs (kept only for the bias check)

### Preliminary model baseline (preview of Deliverable 2)

Quick baselines on the prepared split (16,252 test students, 7 houses):

| Model | Top-1 acc. | Top-2 acc. | Top-3 acc. | Macro-F1 |
|---|---|---|---|---|
| Always guess the largest house | 46.4% | n/a | n/a | n/a |
| Logistic regression (class-balanced) | 36.8% | 55.1% | 71.4% | 0.30 |
| Gradient boosting, 30 features | 53.0% | 73.0% | 83.4% | 0.28 |
| **Gradient boosting, 30 features + 58 raw answers** | **56.6%** | **76.2%** | **86.0%** | **0.35** |

Interests predict a field only moderately, so we design for this: the app shows each
student their **top 3 houses with probabilities**, which contains the right house 86% of the
time. Next steps for top-1 accuracy: tuning, the task-based career simulations as extra
features, and our Pakistani survey data.

## Data and ethics policy

- No raw or processed data is committed. Scraped Rozee.pk postings are used only for aggregate
  statistics and are never redistributed.
- The survey collects no names, emails or roll numbers.
- Open data licences: O*NET (CC BY 4.0), World Bank (CC BY 4.0), ILOSTAT (attribution).
