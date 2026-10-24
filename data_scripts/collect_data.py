"""
Raw data collection for the Pakistan Career Guidance AI project.

Downloads every raw source into data/raw/ and writes a log of what was fetched
to data/raw/collection_log.json (evidence of data gathering for Deliverable 1).

Uses only the Python standard library so it runs anywhere:
    python collect_data.py                 # everything
    python collect_data.py --only rozee    # one source
    python collect_data.py --rozee-pages 50

Sources
  1. riasec     Open Psychometrics RIASEC (Holland Code) test responses, 145k people
  2. onet       O*NET 31.0 occupation database (interests, skills, education per occupation)
  3. ilo        ILOSTAT Pakistan Labour Force Survey indicators (earnings, unemployment)
  4. worldbank  World Bank Pakistan education / labour indicators
  5. rozee      Live Pakistani job postings scraped from Rozee.pk search pages
"""

import argparse
import csv
import io
import json
import os
import time
import urllib.request
import zipfile
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "raw"))
UA = "Mozilla/5.0 (university AI course project; data collection script)"
LOG = []


def fetch(url, headers=None, timeout=120, retries=3):
    h = {"User-Agent": UA}
    h.update(headers or {})
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:
            if attempt == retries - 1:
                raise
            print(f"    retry {attempt + 1} for {url}: {e}")
            time.sleep(3 * (attempt + 1))


def outdir(*parts):
    p = os.path.join(ROOT, *parts)
    os.makedirs(p, exist_ok=True)
    return p


def log(source, url, path, rows=None, note=""):
    entry = {
        "source": source,
        "url": url,
        "file": os.path.relpath(path, ROOT),
        "rows": rows,
        "bytes": os.path.getsize(path) if os.path.exists(path) else None,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": note,
    }
    LOG.append(entry)
    print(f"  saved {entry['file']}  rows={rows}  {note}")


# 1. RIASEC ------------------------------------------------------------------
def collect_riasec():
    print("[riasec] Open Psychometrics RIASEC dataset")
    url = "http://openpsychometrics.org/_rawdata/RIASEC_data12Dec2018.zip"
    data = fetch(url)
    d = outdir("riasec")
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for name in z.namelist():
            base = os.path.basename(name)
            if base in ("data.csv", "codebook.txt"):
                path = os.path.join(d, base)
                with open(path, "wb") as f:
                    f.write(z.read(name))
                rows = None
                if base == "data.csv":
                    with open(path, encoding="utf-8", errors="ignore") as f:
                        rows = sum(1 for _ in f) - 1
                log("riasec", url, path, rows, "tab-separated" if rows else "")


# 2. O*NET -------------------------------------------------------------------
# file names as of O*NET 31.0 (interests/skills/education were renamed in this release)
ONET_FILES = [
    "occupation_data.csv",           # code, title, description
    "career_interest_types.csv",     # RIASEC profile of every occupation
    "career_interest_type_keywords.csv",
    "interests_illustrative_activities.csv",
    "interests_illustrative_occupations.csv",
    "specific_interest_areas.csv",
    "specific_interest_areas_to_career_interest_types.csv",
    "job_zones.csv",                 # preparation level (1-5)
    "job_zone_reference.csv",
    "education.csv",                 # required level of education
    "education_categories.csv",
    "training_and_experience.csv",
    "transferable_skills.csv",
    "essential_skills.csv",
    "abilities.csv",
    "knowledge.csv",
    "work_styles.csv",
    "job_titles.csv",
    "related_occupations.csv",
    "content_model_reference.csv",
    "scales_reference.csv",
]


def collect_onet():
    print("[onet] O*NET 31.0 database (CSV)")
    url = "https://www.onetcenter.org/dl_files/database/db_31_0_csv.zip"
    data = fetch(url, timeout=300)
    d = outdir("onet")
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = {os.path.basename(n).lower(): n for n in z.namelist()}
        for want in ONET_FILES:
            if want not in names:
                print(f"  (not in archive: {want})")
                continue
            path = os.path.join(d, want)
            with open(path, "wb") as f:
                f.write(z.read(names[want]))
            with open(path, encoding="utf-8", errors="ignore") as f:
                rows = sum(1 for _ in f) - 1
            log("onet", url, path, rows)
        with open(os.path.join(d, "_archive_contents.txt"), "w") as f:
            f.write("\n".join(sorted(z.namelist())))


# 3. ILOSTAT (Pakistan Labour Force Survey) ----------------------------------
ILO_FLOWS = {
    "DF_EAR_EMTA_SEX_OCU_CUR_NB": "avg monthly earnings by occupation (PKR + PPP$)",
    "DF_EAR_EMTA_SEX_ECO_CUR_NB": "avg monthly earnings by economic activity",
    "DF_EAR_EMTA_SEX_EDU_CUR_NB": "avg monthly earnings by education level",
    "DF_UNE_DEAP_SEX_EDU_RT": "unemployment rate by education level",
    "DF_UNE_TUNE_SEX_EDU_NB": "unemployed persons by education level (thousands)",
    "DF_EMP_TEMP_SEX_OCU_NB": "employment by occupation (thousands)",
    "DF_EMP_TEMP_SEX_ECO_NB": "employment by economic activity (thousands)",
    "DF_EMP_TEMP_SEX_EDU_NB": "employment by education level (thousands)",
    "DF_EMP_TEMP_SEX_OCU_EDU_NB": "employment by occupation x education (thousands)",
}


def collect_ilo():
    print("[ilo] ILOSTAT SDMX - Pakistan")
    d = outdir("pakistan", "ilo")
    accept = {"Accept": "application/vnd.sdmx.data+csv;version=2.0.0;labels=both"}
    for flow, desc in ILO_FLOWS.items():
        # the number of key dimensions differs per dataflow, so try each length
        for dots in range(3, 7):
            url = (f"https://sdmx.ilo.org/rest/data/ILO,{flow},1.0/"
                   f"PAK{'.' * dots}?startPeriod=2000")
            try:
                text = fetch(url, headers=accept, retries=1).decode("utf-8")
            except Exception:
                continue
            if text.startswith("STRUCTURE"):
                path = os.path.join(d, f"{flow}.csv")
                with open(path, "w", encoding="utf-8") as f:
                    f.write(text)
                log("ilo", url, path, text.count("\n") - 1, desc)
                break
        else:
            print(f"  FAILED {flow}")
        time.sleep(1)


# 4. World Bank --------------------------------------------------------------
WB_INDICATORS = {
    "SL.UEM.ADVN.ZS": "Unemployment with advanced education (%)",
    "SL.UEM.INTM.ZS": "Unemployment with intermediate education (%)",
    "SL.UEM.BASC.ZS": "Unemployment with basic education (%)",
    "SL.UEM.1524.ZS": "Youth unemployment 15-24 (%)",
    "SL.UEM.TOTL.ZS": "Unemployment total (%)",
    "SE.TER.ENRR": "Tertiary school enrollment (% gross)",
    "SE.TER.ENRR.FE": "Tertiary school enrollment, female (% gross)",
    "SE.SEC.ENRR": "Secondary school enrollment (% gross)",
    "SE.XPD.TOTL.GD.ZS": "Government expenditure on education (% of GDP)",
    "SL.AGR.EMPL.ZS": "Employment in agriculture (%)",
    "SL.IND.EMPL.ZS": "Employment in industry (%)",
    "SL.SRV.EMPL.ZS": "Employment in services (%)",
    "SL.TLF.CACT.FE.ZS": "Female labour force participation (%)",
    "NY.GDP.PCAP.CD": "GDP per capita (current US$)",
    "FP.CPI.TOTL.ZG": "Inflation, consumer prices (%)",
    "PA.NUS.FCRF": "Official exchange rate (PKR per US$)",
}


def collect_worldbank():
    print("[worldbank] World Bank API - Pakistan")
    d = outdir("pakistan", "worldbank")
    path = os.path.join(d, "pakistan_indicators.csv")
    rows = 0
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["indicator_id", "indicator_name", "year", "value"])
        for ind, name in WB_INDICATORS.items():
            url = (f"https://api.worldbank.org/v2/country/PAK/indicator/{ind}"
                   f"?format=json&per_page=200&date=1990:2026")
            meta, data = json.loads(fetch(url))
            for r in data or []:
                w.writerow([ind, name, r["date"], r["value"]])
                rows += 1
            time.sleep(0.5)
    log("worldbank", "https://api.worldbank.org/v2/country/PAK/indicator/*", path, rows,
        f"{len(WB_INDICATORS)} indicators, long format")


# 5. Rozee.pk job postings ---------------------------------------------------
ROZEE_FIELDS = [
    "jid", "title", "company", "city", "country", "type", "industry_exact",
    "experience_text", "max_experience_text", "degreeTitle_text",
    "rejFil_min_degreeTitle_text", "rejFil_max_degreeTitle_text",
    "rejFil_min_age_exact", "rejFil_max_age_exact", "genderId_exact",
    "skills", "created_at", "applyBy", "jobSource", "whereFrom", "permaLink",
    "description_raw",
]


def _rozee_page(offset):
    url = "https://www.rozee.pk/job/jsearch/q/all" + (f"/fpn/{offset}" if offset else "")
    html = fetch(url, timeout=60).decode("utf-8", "ignore")
    marker = "var apResp = "
    i = html.find(marker)
    if i < 0:
        return url, None, []
    obj, _ = json.JSONDecoder().raw_decode(html[i + len(marker):])
    resp = obj.get("response", {})
    return url, resp.get("numFound"), resp.get("jobs", {}).get("basic", [])


def collect_rozee(max_pages=None, delay=1.5):
    # robots.txt allows /job/jsearch/; we go slowly with a delay between pages
    print("[rozee] Rozee.pk job search pages")
    d = outdir("pakistan", "rozee")
    jsonl = os.path.join(d, "rozee_jobs_raw.jsonl")
    seen, offset, page, total = set(), 0, 0, None
    with open(jsonl, "w", encoding="utf-8") as fj:
        while True:
            try:
                url, num, jobs = _rozee_page(offset)
            except Exception as e:
                print(f"  stopped at offset {offset}: {e}")
                break
            total = total or num
            if not jobs:
                break
            new = 0
            for j in jobs:
                if j.get("jid") in seen:
                    continue
                seen.add(j.get("jid"))
                fj.write(json.dumps(j, ensure_ascii=False) + "\n")
                new += 1
            page += 1
            offset += 20
            if page % 25 == 0:
                print(f"  page {page}: {len(seen)} unique jobs of ~{total}")
            if new == 0 or (max_pages and page >= max_pages) or (total and offset >= total):
                break
            time.sleep(delay)
    log("rozee", "https://www.rozee.pk/job/jsearch/q/all/fpn/<offset>", jsonl, len(seen),
        f"full raw JSON per job, {page} pages, site reported {total} jobs")

    # flat CSV with the useful columns
    path = os.path.join(d, "rozee_jobs.csv")
    with open(jsonl, encoding="utf-8") as fj, open(path, "w", newline="", encoding="utf-8") as fc:
        w = csv.writer(fc)
        w.writerow(ROZEE_FIELDS)
        for line in fj:
            j = json.loads(line)
            row = []
            for k in ROZEE_FIELDS:
                v = j.get(k)
                if isinstance(v, list):
                    v = "|".join(map(str, v))
                row.append(v)
            w.writerow(row)
    log("rozee", "derived from rozee_jobs_raw.jsonl", path, len(seen), "flattened columns")


SOURCES = {
    "riasec": collect_riasec,
    "onet": collect_onet,
    "ilo": collect_ilo,
    "worldbank": collect_worldbank,
    "rozee": collect_rozee,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=SOURCES, action="append")
    ap.add_argument("--rozee-pages", type=int, default=None, help="limit pages (20 jobs each)")
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between Rozee requests")
    args = ap.parse_args()

    os.makedirs(ROOT, exist_ok=True)
    log_path = os.path.join(ROOT, "collection_log.json")
    if os.path.exists(log_path):
        with open(log_path) as f:
            LOG.extend(e for e in json.load(f) if e["source"] not in (args.only or SOURCES))

    for name in args.only or SOURCES:
        try:
            if name == "rozee":
                collect_rozee(args.rozee_pages, args.delay)
            else:
                SOURCES[name]()
        except Exception as e:
            print(f"[{name}] FAILED: {e}")
        with open(log_path, "w") as f:
            json.dump(LOG, f, indent=2)
    print(f"\nDone. Log written to {log_path}")


if __name__ == "__main__":
    main()
