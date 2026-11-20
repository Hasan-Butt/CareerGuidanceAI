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
| 2 | Model implementation & evaluation | ✅ XGBoost (top-3 **86.5%** on 16,252 students) |
| 3 | Hosted web app + final report | ✅ Fullstack App in [`pakcareer/`](pakcareer/) (Next.js 16 + FastAPI + PostgreSQL PAAS) |

## Run the web app

### Option 1: Docker Compose (All-in-one with PostgreSQL)
```bash
cd pakcareer
docker compose up --build
```
- Student App: [http://localhost:3000](http://localhost:3000)
- Counsellor PAAS Portal: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- FastAPI Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Local Development
**Backend (FastAPI):**
```bash
cd pakcareer/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend (Next.js 16):**
```bash
cd pakcareer/frontend
npm install
npm run dev
```

**Student flow:** 6-step wizard (About → 48 Holland RIASEC items → TIPI Big Five → 16-word vocabulary checklist → Multidimensional match results).  
**Counsellor / school demo:** Institutional dashboard (`/dashboard`) with cohort interest distributions, individual session drill-down, confidential notes, and downloadable parent report PDFs; demo invite codes `FAST-LAHORE`, `COUNSEL-DEMO`, `LGS-DEMO`.

## Repository layout

```
pakcareer-ai/
├── pakcareer/                 # Production Fullstack Application
│   ├── backend/               # FastAPI backend serving XGBoost inference
│   │   ├── main.py            # API entry point & CORS
│   │   ├── questions.py       # RIASEC / TIPI / vocab content
│   │   ├── db/                # SQLAlchemy models & migrations (Postgres / SQLite)
│   │   ├── routers/           # predict, sessions, orgs endpoints
│   │   └── services/          # predictor, report_pdf, pakistan_stats
│   ├── frontend/              # Next.js 16 (App Router) + Tailwind v4 + Recharts
│   │   ├── app/               # Landing page, /assessment wizard, /dashboard PAAS
│   │   ├── components/        # UI primitives, assessment wizard & dashboard
│   │   └── lib/               # Typed API client, Zustand store, types
│   ├── docker-compose.yml     # Multi-container orchestration (Postgres + API + Web)
│   └── README.md
├── src/models/                # ML training + evaluation pipeline
├── data_scripts/              # Data collection & feature engineering scripts
├── docs/                      # Collection & cleaning evidence logs
├── report/                    # LaTeX source, evaluation metrics, figures, final PDF
├── survey/                    # Pakistani student survey specification
├── models/weights/            # NOT in git — trained XGBoost model & LabelEncoder
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
  <https://drive.google.com/drive/folders/1wk0N7zRLVq2g-ZGwCaSXhBhAJ8mxHcxa> and put its
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

## Model Weights (Deliverable 2)

The trained model weights exceed GitHub's recommended file size.
Download from Google Drive (`CareerAI_Data/models/`):
- **XGBoost model (`xgb_model.pkl`)**: [Download `xgb_model.pkl`](https://drive.google.com/file/d/1erH2Sic3QRW17VjYfdx7g94rLgVWB2Ie/view)
- **Label encoder (`label_encoder.pkl`)**: [Download `label_encoder.pkl`](https://drive.google.com/file/d/1mxofGbPWvOwpudmXs3_3xgg2S09qcBmc/view)
- **Models folder (`CareerAI_Data/models/`)**: [Google Drive folder](https://drive.google.com/drive/folders/1xzh87k7OH8VEtWSky9fCPPpv-ZsJLH2X)

Place files at:
- `models/weights/final_model.pkl` (renamed from `xgb_model.pkl`)
- `models/weights/label_encoder.pkl`

## Requirements

Install dependencies:

```text
pip install -r requirements.txt
```
