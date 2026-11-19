# PakCareer AI — Fullstack Career & Degree Guidance Platform

PakCareer AI is a production-grade fullstack web application migrating the original monolithic Streamlit prototype into a modern decoupled architecture:

- **Frontend**: Next.js 16.4.6 (App Router), React 19, Tailwind CSS v4, Zustand with persistence, Recharts, and shadcn-style UI primitives.
- **Backend**: FastAPI (Python 3.11–3.14), XGBoost classifier inference, SQLAlchemy ORM (PostgreSQL in production, zero-config SQLite for local dev), and FPDF2 report generation.
- **Model**: Trained XGBoost classifier (88 engineered features: RIASEC domains, Big Five, vocabulary recognition, demographics) achieving 86.5% Top-3 accuracy on Pakistani higher education tracks.

---

## 🏛️ Degree Houses

PakCareer AI classifies students into 7 Pakistani degree families:
1. **Computer Science & IT** (`💻`)
2. **Engineering** (`⚙️`)
3. **Medicine & Health** (`🏥`)
4. **Business & Commerce** (`💼`)
5. **Arts, Humanities & Social Sciences** (`🎨`)
6. **Pure Sciences** (`🔬`)
7. **Law** (`⚖️`)

---

## 🚀 Quickstart (Local Development)

### 1. Start the FastAPI Backend
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on SQLite pakcareer.db automatically)
uvicorn main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Start the Next.js Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Student Assessment Wizard: [http://localhost:3000/assessment/landing](http://localhost:3000/assessment/landing)
- Counsellor PAAS Portal: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Cohort Analytics: [http://localhost:3000/dashboard/analytics](http://localhost:3000/dashboard/analytics)

### 3. Counsellor dashboard access
Student results are private. The dashboard asks for the institution's **access key**
and only shows students who used that institution's invite code.

- On first start the backend creates keys for the demo institutions (FAST-LAHORE,
  COUNSEL-DEMO, LGS-DEMO), prints them in the log and saves them to
  `pakcareer/demo_keys.local.txt` (gitignored). To pin a key for demos, set e.g.
  `ORG_KEY_FAST_LAHORE=my-demo-key` before the first start.
- To add a school, set `ADMIN_KEY` and call
  `POST /api/orgs` with header `X-Admin-Key` and body
  `{"invite_code": "PUNJAB-COLLEGE", "name": "Punjab College"}`. The response
  contains the new school's access key (shown once).
- Students' invite codes are checked on the "About you" step; unknown codes are rejected.

### 4. Tests
```bash
cd backend
python -m pytest -q        # needs models/weights/final_model.pkl
```

> **Model weights** are not in Git. Put `final_model.pkl` and `label_encoder.pkl` in
> `models/weights/` at the repo root (or set `MODEL_DIR`). On Linux,
> `pip install xgboost-cpu` avoids a ~300 MB GPU download.

---

## 🐳 Docker Deployment

To launch the entire stack (PostgreSQL 16 + FastAPI + Next.js), first create
`pakcareer/.env` with at least `POSTGRES_PASSWORD=...` (see `.env.example`), then:
```bash
docker compose up --build
```

---

## 📁 Repository Structure

```
pakcareer/
├── backend/
│   ├── main.py                  # FastAPI application entry point
│   ├── questions.py             # Assessment items & scale constants
│   ├── db/
│   │   ├── database.py          # SQLAlchemy engine & SQLite/Postgres switch
│   │   └── models.py            # Org and Session models (with JSONB support)
│   ├── routers/
│   │   ├── predict.py           # POST /api/predict (XGBoost inference)
│   │   ├── sessions.py          # GET /api/sessions, PATCH notes, PDF report
│   │   └── orgs.py              # GET /api/orgs, cohort invite codes
│   ├── services/
│   │   ├── predictor.py         # Feature engineering & XGBoost model loading
│   │   ├── report_pdf.py        # Parents PDF summary builder (FPDF2)
│   │   └── pakistan_stats.py    # Rozee.pk & ILO 2025 market stats
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (marketing)/page.tsx # Public SEO landing page
│   │   ├── assessment/          # 6-step student wizard
│   │   ├── dashboard/           # Counsellor PAAS portal & analytics
│   │   └── api/                 # Next.js API route proxies
│   ├── components/
│   │   ├── ui/                  # Button, Card, Progress, Tabs, Badge, Input
│   │   ├── assessment/          # RIASEC, TIPI, Vocab, Results steps
│   │   └── dashboard/           # Counsellor nav & cohort views
│   └── lib/
│       ├── api.ts               # Typed fetch wrappers
│       ├── store.ts             # Zustand assessment store (sessionStorage)
│       ├── questions.ts         # Frontend question bank & constants
│       └── types.ts             # Shared TypeScript types
│
├── docker-compose.yml           # Multi-container orchestration
└── README.md
```

