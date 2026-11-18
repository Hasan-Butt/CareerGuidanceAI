"""Pakistan labour-market statistics per degree house.

Values are grounded in the project's Phase 2 cleaned sources:
- ILOSTAT 2025 Pakistan Labour Force Survey (average monthly sector earnings in PKR
  and unemployment rates by education level)
- Rozee.pk scrape (9,580 deduplicated postings; 7,469 mapped to the 7 houses)
"""

MARKET_CONTEXT = {
    "rozee_total_clean": 9580,
    "rozee_house_mapped": 7469,
    "rozee_bachelor_share_pct": 72.2,
    "ilo_earnings_year": 2025,
    "pk_unemployment_total_pct": 7.0,
    "pk_unemployment_advanced_pct": 11.1,
    "pk_unemployment_intermediate_pct": 9.9,
    "pk_unemployment_basic_pct": 6.3,
    "model_top3_accuracy_pct": 86.5,
}

HOUSE_STATS = {
    "Arts, Humanities & Social Sciences": {
        "avg_salary": "PKR 30,306 – 36,433 / month (ILO 2025: Education & Arts sectors)",
        "job_postings": 814,
        "sample_degrees": [
            "BS Psychology",
            "BS Media & Mass Communication",
            "BS Economics / International Relations",
            "BA/BS English Literature & Linguistics",
            "BFA Graphic & Communication Design",
        ],
        "top_roles": [
            "Content Writer & Editor",
            "Lecturer / Educationist",
            "Graphic & Media Designer",
            "Clinical / Organisational Psychologist",
            "Public Relations & Communications Officer",
        ],
        "top_cities": ["Lahore", "Karachi", "Islamabad", "Rawalpindi"],
        "parent_takeaway": (
            "Education and Arts/Media sectors rank among Pakistan's stronger salaried "
            "brackets in ILO 2025 data (PKR 30k–36k/month sector average), with 814 "
            "active Rozee.pk postings across digital media, education, psychology, and communications."
        ),
    },
    "Business & Commerce": {
        "avg_salary": "PKR 20,009 – 27,266 / month (ILO 2025: Finance & Trade sectors)",
        "job_postings": 4559,
        "sample_degrees": [
            "BBA (Business Administration)",
            "BS Accounting & Finance / ACCA / CA",
            "BS Business Analytics",
            "BS Supply Chain & Operations Management",
        ],
        "top_roles": [
            "Business Development Executive",
            "Accountant / Financial Analyst",
            "Digital Marketing Specialist",
            "HR & Operations Manager",
            "Supply Chain Coordinator",
        ],
        "top_cities": ["Lahore", "Karachi", "Islamabad", "Faisalabad"],
        "parent_takeaway": (
            "Business & Commerce accounts for the single largest hiring volume on Rozee.pk "
            "(4,559 mapped postings — over 60% of mapped listings), offering broad entry-level "
            "employment across banking, FMCG, e-commerce, and corporate management."
        ),
    },
    "Computer Science & IT": {
        "avg_salary": "PKR 32,389 / month (ILO 2025: Information & Communication sector)",
        "job_postings": 854,
        "sample_degrees": [
            "BS Computer Science (BSCS)",
            "BS Software Engineering (BSSE)",
            "BS Artificial Intelligence / Data Science",
            "BS Cybersecurity",
        ],
        "top_roles": [
            "Software Engineer / Full-Stack Developer",
            "AI / Machine Learning Engineer",
            "Data Analyst / Data Scientist",
            "QA & DevOps Engineer",
            "Cybersecurity Analyst",
        ],
        "top_cities": ["Lahore", "Karachi", "Islamabad", "Rawalpindi"],
        "parent_takeaway": (
            "Computer Science & IT is the second-largest hiring house on Rozee.pk (854 postings) "
            "with strong ILO 2025 sector earnings (PKR 32,389/month national sector average) and "
            "significant remote/export software career upside in Lahore, Karachi, and Islamabad."
        ),
    },
    "Engineering": {
        "avg_salary": "PKR 26,218 – 27,872 / month (ILO 2025: Manufacturing & Construction)",
        "job_postings": 686,
        "sample_degrees": [
            "BS Electrical / Electronics Engineering",
            "BS Mechanical / Mechatronics Engineering",
            "BS Civil Engineering",
            "BS Chemical / Industrial Engineering",
        ],
        "top_roles": [
            "Electrical / Electronics Engineer",
            "Mechanical & Production Engineer",
            "Civil & Site Engineer",
            "Industrial / Quality Engineer",
            "Telecom & Network Engineer",
        ],
        "top_cities": ["Lahore", "Karachi", "Islamabad", "Faisalabad"],
        "parent_takeaway": (
            "Engineering remains a steady employer in Pakistan's manufacturing, energy, telecom, "
            "and infrastructure sectors (686 Rozee.pk postings), especially when paired with "
            "practical hands-on or analytical strengths."
        ),
    },
    "Law": {
        "avg_salary": "PKR 40,725 / month (ILO 2025: Professional & Technical services)",
        "job_postings": 30,
        "sample_degrees": [
            "LLB (5-Year Bachelor of Laws)",
            "BA-LLB (Corporate & Commercial Law)",
            "LLM (Specialisation after LLB)",
        ],
        "top_roles": [
            "Corporate Legal Counsel",
            "Advocate / Litigation Associate",
            "Compliance & Regulatory Officer",
            "Contract & Tax Specialist",
        ],
        "top_cities": ["Lahore", "Islamabad", "Karachi"],
        "parent_takeaway": (
            "Professional, scientific & technical services have one of the highest ILO 2025 "
            "monthly earnings in Pakistan (PKR 40,725/month). Note that most legal careers recruit "
            "through chambers and law firms rather than job boards, which explains lower Rozee.pk volume (30 postings)."
        ),
    },
    "Medicine & Health": {
        "avg_salary": "PKR 37,068 / month (ILO 2025: Human Health & Social Work)",
        "job_postings": 449,
        "sample_degrees": [
            "MBBS / BDS",
            "Pharm-D (Doctor of Pharmacy)",
            "DPT (Doctor of Physical Therapy)",
            "BS Nursing / Allied Health Sciences",
        ],
        "top_roles": [
            "Medical Officer / General Physician",
            "Pharmacist (Pharm-D)",
            "Physiotherapist / Allied Health Specialist",
            "Clinical Research & Public Health Officer",
            "Registered Nurse / Healthcare Manager",
        ],
        "top_cities": ["Lahore", "Karachi", "Islamabad", "Rawalpindi"],
        "parent_takeaway": (
            "Human health & social work ranks among the top-earning sectors in Pakistan's ILO 2025 "
            "survey (PKR 37,068/month), with 449 Rozee.pk openings spanning hospitals, pharma, "
            "diagnostics, and allied health — not limited solely to MBBS."
        ),
    },
    "Pure Sciences": {
        "avg_salary": "PKR 30,306 – 40,725 / month (ILO 2025: Scientific & Education sectors)",
        "job_postings": 77,
        "sample_degrees": [
            "BS Biotechnology / Microbiology",
            "BS Mathematics / Statistics",
            "BS Physics / Chemistry",
            "BS Environmental Sciences",
        ],
        "top_roles": [
            "Research Associate / Lab Scientist",
            "Biotechnologist / Microbiologist",
            "Quality Control Chemist",
            "Statistician / Quantitative Analyst",
            "Science Lecturer",
        ],
        "top_cities": ["Lahore", "Karachi", "Islamabad", "Multan"],
        "parent_takeaway": (
            "Pure Sciences graduates feed into scientific R&D, pharma quality labs, data/statistics, "
            "and university teaching — sectors averaging PKR 30k–41k/month in ILO 2025 data — "
            "and often pair strongly with postgraduate scholarships abroad."
        ),
    },
}

_ALIASES = {
    "CS & IT": "Computer Science & IT",
}


def get_stats(house: str) -> dict | None:
    """Return Pakistan labour-market statistics for a degree house."""
    canonical = _ALIASES.get(house, house)
    return HOUSE_STATS.get(canonical)
