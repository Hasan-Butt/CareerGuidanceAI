# app/app.py
"""PakCareer AI — premium multi-step Streamlit assessment + demo PAAS."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import altair as alt
import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))
sys.path.append(str(Path(__file__).resolve().parent))

from pakistan_stats import MARKET_CONTEXT, get_stats
from predictor import (
    RIASEC_LABELS,
    build_feature_row,
    compute_profile_summary,
    load_model,
    model_files_exist,
    predict,
)
from questions import (
    EDU_MAP,
    EDUCATION_OPTIONS,
    ENGNAT_OPTIONS,
    FAKE_WORD_KEYS,
    REAL_WORD_KEYS,
    RIASEC_DOMAIN_META,
    RIASEC_DOMAIN_ORDER,
    RIASEC_QUESTIONS,
    RIASEC_SCALE_HELP,
    TIPI_QUESTIONS,
    TIPI_SCALE_HELP,
    URBAN_OPTIONS,
    VOCAB_WORDS,
    WIZARD_STEPS,
)
from report_pdf import build_parents_report_pdf
from storage import (
    get_session,
    init_db,
    list_orgs,
    list_sessions,
    resolve_org,
    save_session,
    update_notes,
)

# ── Page config ──────────────────────────────────────────────
st.set_page_config(
    page_title="PakCareer AI",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

STYLE_PATH = Path(__file__).with_name("styles.css")
if STYLE_PATH.exists():
    st.markdown(f"<style>{STYLE_PATH.read_text(encoding='utf-8')}</style>", unsafe_allow_html=True)


def build_parents_report_markdown(
    top3: list[dict],
    all_houses: list[dict],
    profile: dict,
    student_meta: dict,
    session_id: str | None = None,
) -> str:
    lines = [
        "# PakCareer AI — Student & Parents' Degree Guidance Report",
        "",
        "## Student Snapshot",
        f"- **Age:** {student_meta['age']} | **Education:** {student_meta['education']}",
        f"- **Holland Interest Code:** `{profile['holland_code']}`",
        f"- **Profile Differentiation:** {profile['differentiation']} / 4.0",
    ]
    if session_id:
        lines.append(f"- **Session ID:** `{session_id}`")
    if student_meta.get("org_name"):
        lines.append(f"- **Organisation:** {student_meta['org_name']}")
    lines.extend([
        "",
        "## Top 3 Recommended Degree Families",
        f"In evaluation on 16,252 students, the model's top-3 list contains the student's "
        f"actual degree family **{MARKET_CONTEXT['model_top3_accuracy_pct']}%** of the time.",
        "",
    ])
    for rank, item in enumerate(top3, start=1):
        stats = get_stats(item["house"]) or {}
        lines.extend([
            f"### #{rank} {item['house']} ({item['probability']}% fit)",
            f"- **Sample Pakistani Degrees:** {', '.join(stats.get('sample_degrees', []))}",
            f"- **Avg Monthly Sector Earnings:** {stats.get('avg_salary', 'N/A')}",
            f"- **Rozee.pk Mapped Job Postings:** {stats.get('job_postings', 0):,}",
            f"- **Top Roles:** {', '.join(stats.get('top_roles', []))}",
            f"- **Top Hiring Cities:** {', '.join(stats.get('top_cities', []))}",
            f"- **Why it matters:** {stats.get('parent_takeaway', '')}",
            "",
        ])

    lines.extend([
        "## All 7 Degree Families (Full Fit Breakdown)",
        "| Rank | Degree Family | Fit (%) |",
        "|---|---|---|",
    ])
    for rank, item in enumerate(all_houses, start=1):
        lines.append(f"| {rank} | {item['house']} | {item['probability']}% |")

    lines.extend([
        "",
        "## Pakistan Labour Market Context (ILOSTAT 2025 & Rozee.pk)",
        f"- **Rozee.pk Postings Analysed:** {MARKET_CONTEXT['rozee_total_clean']:,} clean listings "
        f"({MARKET_CONTEXT['rozee_bachelor_share_pct']}% requesting a Bachelor's degree where specified)",
        f"- **Pakistan Unemployment Rate (ILO 2025):** {MARKET_CONTEXT['pk_unemployment_total_pct']}% overall "
        f"({MARKET_CONTEXT['pk_unemployment_advanced_pct']}% advanced degree, "
        f"{MARKET_CONTEXT['pk_unemployment_intermediate_pct']}% intermediate)",
        "",
        "_Note: This report is a data-driven conversation starter for students, parents, "
        "and academic counsellors — not a guarantee of career outcomes._",
    ])
    return "\n".join(lines)


def _init_state():
    defaults = {
        "wizard_step": 0,
        "riasec_domain_idx": 0,
        "riasec_answers": {},
        "tipi_answers": {},
        "vocab_checked": {},
        "about": {
            "age": 18,
            "education": EDUCATION_OPTIONS[1],
            "familysize": 2,
            "urban_label": list(URBAN_OPTIONS.keys())[2],
            "engnat_label": list(ENGNAT_OPTIONS.keys())[1],
            "invite_code": "",
        },
        "workspace_mode": "Student assessment",
        "prediction_bundle": None,
        "session_id": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def _step_progress() -> None:
    step = st.session_state.wizard_step
    labels = [label for _, label in WIZARD_STEPS]
    st.progress((step + 1) / len(WIZARD_STEPS))
    st.caption(" → ".join(
        f"**{lab}**" if i == step else lab for i, lab in enumerate(labels)
    ))


def _nav(back: bool = True, next_label: str = "Continue", next_disabled: bool = False):
    cols = st.columns([1, 1, 2])
    with cols[0]:
        if back and st.session_state.wizard_step > 0:
            if st.button("← Back", width="stretch"):
                st.session_state.wizard_step -= 1
                st.rerun()
    with cols[1]:
        if st.button(next_label, type="primary", width="stretch", disabled=next_disabled):
            return True
    return False


@st.cache_resource
def get_model():
    return load_model(
        model_path="models/weights/final_model.pkl",
        encoder_path="models/weights/label_encoder.pkl",
    )


def render_landing():
    st.markdown(
        """
        <div class="pc-hero">
          <div class="pc-step-label">Degree guidance for Pakistan</div>
          <p class="pc-brand">PakCareer AI</p>
          <p class="pc-tagline">
            A data-backed interest &amp; personality assessment that maps you to seven degree
            families — with ILOSTAT earnings and Rozee.pk demand your parents can trust.
          </p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    c1, c2, c3 = st.columns(3)
    c1.metric("Top-3 accuracy", f"{MARKET_CONTEXT['model_top3_accuracy_pct']}%")
    c2.metric("Rozee.pk postings", f"{MARKET_CONTEXT['rozee_total_clean']:,}")
    c3.metric("Degree families", "7")
    st.markdown(
        """
        <div class="pc-card">
          <strong>What you'll do (about 8–10 minutes)</strong>
          <ol>
            <li>Share a few details about yourself</li>
            <li>Rate 48 interest activities (RIASEC)</li>
            <li>Complete a short personality check (TIPI)</li>
            <li>Tick vocabulary words you know</li>
            <li>Get your top-3 degree matches + parents' market report</li>
          </ol>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if _nav(back=False, next_label="Start assessment"):
        st.session_state.wizard_step = 1
        st.rerun()


def render_about():
    st.markdown('<div class="pc-step-label">Step 2 of 6</div>', unsafe_allow_html=True)
    st.subheader("About you")
    about = st.session_state.about

    about["age"] = st.slider("Age", 15, 25, int(about.get("age", 18)))
    about["education"] = st.selectbox(
        "Current education level",
        EDUCATION_OPTIONS,
        index=EDUCATION_OPTIONS.index(about.get("education", EDUCATION_OPTIONS[1])),
    )
    about["familysize"] = st.slider("Number of siblings", 0, 10, int(about.get("familysize", 2)))
    about["urban_label"] = st.radio(
        "Where did you mostly grow up?",
        list(URBAN_OPTIONS.keys()),
        index=list(URBAN_OPTIONS.keys()).index(
            about.get("urban_label", list(URBAN_OPTIONS.keys())[2])
        ),
        horizontal=True,
    )
    about["engnat_label"] = st.radio(
        "Is English your native language?",
        list(ENGNAT_OPTIONS.keys()),
        index=list(ENGNAT_OPTIONS.keys()).index(
            about.get("engnat_label", list(ENGNAT_OPTIONS.keys())[1])
        ),
    )
    about["invite_code"] = st.text_input(
        "School / counselling centre invite code (optional)",
        value=about.get("invite_code", ""),
        placeholder="e.g. FAST-LAHORE",
        help="Demo codes: FAST-LAHORE, COUNSEL-DEMO, LGS-DEMO",
    ).strip().upper()

    org = resolve_org(about["invite_code"]) if about["invite_code"] else None
    if about["invite_code"] and org:
        st.success(f"Linked to **{org['name']}** ({org['org_type']})")
    elif about["invite_code"]:
        st.warning("Invite code not recognised — you can continue without an organisation.")

    st.session_state.about = about
    if _nav(next_label="Continue to interests"):
        st.session_state.wizard_step = 2
        st.session_state.riasec_domain_idx = 0
        st.rerun()


def _domain_complete(code: str) -> bool:
    answers = st.session_state.riasec_answers
    return all(f"{code}{i}" in answers for i in range(1, 9))


def render_riasec():
    st.markdown('<div class="pc-step-label">Step 3 of 6</div>', unsafe_allow_html=True)
    st.subheader("Interests — how much would you enjoy each activity?")
    st.caption(RIASEC_SCALE_HELP)

    idx = st.session_state.riasec_domain_idx
    code = RIASEC_DOMAIN_ORDER[idx]
    title, blurb = RIASEC_DOMAIN_META[code]
    st.markdown(f"**Domain {idx + 1}/6: {title} ({code})** — {blurb}")

    answers = st.session_state.riasec_answers
    for i in range(1, 9):
        key = f"{code}{i}"
        current = answers.get(key)
        choice = st.radio(
            RIASEC_QUESTIONS[key],
            options=[1, 2, 3, 4, 5],
            horizontal=True,
            index=None if current is None else current - 1,
            key=f"riasec_radio_{key}",
        )
        if choice is not None:
            answers[key] = int(choice)

    done_domains = sum(1 for c in RIASEC_DOMAIN_ORDER if _domain_complete(c))
    st.caption(f"Domains completed: {done_domains}/6 · Items answered: {len(answers)}/48")

    cols = st.columns([1, 1, 1, 2])
    with cols[0]:
        if st.button("← Back", width="stretch"):
            if idx == 0:
                st.session_state.wizard_step = 1
            else:
                st.session_state.riasec_domain_idx = idx - 1
            st.rerun()
    with cols[1]:
        if idx < len(RIASEC_DOMAIN_ORDER) - 1:
            if st.button("Next domain →", type="primary", width="stretch", disabled=not _domain_complete(code)):
                st.session_state.riasec_domain_idx = idx + 1
                st.rerun()
        else:
            all_done = all(_domain_complete(c) for c in RIASEC_DOMAIN_ORDER)
            if st.button("Continue →", type="primary", width="stretch", disabled=not all_done):
                st.session_state.wizard_step = 3
                st.rerun()
            if not all_done:
                st.caption("Answer every item in this domain to continue.")


def render_tipi():
    st.markdown('<div class="pc-step-label">Step 4 of 6</div>', unsafe_allow_html=True)
    st.subheader("Personality — I see myself as…")
    st.caption(TIPI_SCALE_HELP)

    answers = st.session_state.tipi_answers
    for key, question in TIPI_QUESTIONS.items():
        current = answers.get(key)
        choice = st.radio(
            question,
            options=[1, 2, 3, 4, 5, 6, 7],
            horizontal=True,
            index=None if current is None else current - 1,
            key=f"tipi_radio_{key}",
        )
        if choice is not None:
            answers[key] = int(choice)

    complete = len(answers) == 10
    st.caption(f"Answered {len(answers)}/10")
    cols = st.columns([1, 1, 2])
    with cols[0]:
        if st.button("← Back", width="stretch"):
            st.session_state.wizard_step = 2
            st.session_state.riasec_domain_idx = len(RIASEC_DOMAIN_ORDER) - 1
            st.rerun()
    with cols[1]:
        if st.button("Continue →", type="primary", width="stretch", disabled=not complete):
            st.session_state.wizard_step = 4
            st.rerun()


def render_vocab():
    st.markdown('<div class="pc-step-label">Step 5 of 6</div>', unsafe_allow_html=True)
    st.subheader("Vocabulary check")
    st.caption(
        "Tick every word whose definition you are sure you know. "
        "Some items are not real words — this helps validate careful answering."
    )

    checked = st.session_state.vocab_checked
    cols = st.columns(2)
    for i, (key, (word, _fake)) in enumerate(VOCAB_WORDS.items()):
        with cols[i % 2]:
            checked[key] = st.checkbox(
                word,
                value=bool(checked.get(key, False)),
                key=f"vocab_{key}",
            )

    real_known = sum(1 for k in REAL_WORD_KEYS if checked.get(k))
    fake_claimed = sum(1 for k in FAKE_WORD_KEYS if checked.get(k))
    st.caption(f"Real words selected: {real_known}/13 · Attention items selected: {fake_claimed}/3")

    cols = st.columns([1, 1, 2])
    with cols[0]:
        if st.button("← Back", width="stretch"):
            st.session_state.wizard_step = 3
            st.rerun()
    with cols[1]:
        if st.button("Find my best-fit degree", type="primary", width="stretch"):
            _run_prediction()
            st.session_state.wizard_step = 5
            st.rerun()


def _run_prediction():
    if not model_files_exist():
        st.error(
            "Model weights not found. Place `final_model.pkl` and `label_encoder.pkl` in "
            "`models/weights/` (see README Google Drive link)."
        )
        return

    about = st.session_state.about
    org = resolve_org(about.get("invite_code", "")) if about.get("invite_code") else None
    checked = st.session_state.vocab_checked
    vocab_known = sum(1 for k in REAL_WORD_KEYS if checked.get(k))
    fake_claimed = sum(1 for k in FAKE_WORD_KEYS if checked.get(k))
    # Training: flag = 1 when exactly one fake word claimed
    fake_word_flag = 1 if fake_claimed == 1 else 0

    model, le = get_model()
    feature_row = build_feature_row(
        st.session_state.riasec_answers,
        st.session_state.tipi_answers,
        int(about["age"]),
        EDU_MAP[about["education"]],
        int(about["familysize"]),
        vocab_known,
        urban=URBAN_OPTIONS[about["urban_label"]],
        engnat=ENGNAT_OPTIONS[about["engnat_label"]],
        fake_word_flag=fake_word_flag,
    )
    all_results = predict(model, le, feature_row, top_k=None)
    profile = compute_profile_summary(
        st.session_state.riasec_answers,
        st.session_state.tipi_answers,
    )
    student_meta = {
        "age": about["age"],
        "education": about["education"],
        "familysize": about["familysize"],
        "urban": URBAN_OPTIONS[about["urban_label"]],
        "engnat": ENGNAT_OPTIONS[about["engnat_label"]],
        "vocab": vocab_known,
        "fake_word_flag": fake_word_flag,
        "org_code": org["invite_code"] if org else None,
        "org_name": org["name"] if org else None,
    }
    session_id = save_session(
        all_results=all_results,
        top3=all_results[:3],
        profile=profile,
        student_meta=student_meta,
        org_code=student_meta["org_code"],
    )
    st.session_state.prediction_bundle = {
        "all_results": all_results,
        "top3": all_results[:3],
        "profile": profile,
        "student_meta": student_meta,
    }
    st.session_state.session_id = session_id


def render_results():
    bundle = st.session_state.prediction_bundle
    if not bundle:
        st.warning("No results yet. Complete the assessment first.")
        if st.button("Start over"):
            st.session_state.wizard_step = 0
            st.rerun()
        return

    all_results = bundle["all_results"]
    top3 = bundle["top3"]
    profile = bundle["profile"]
    student_meta = bundle["student_meta"]
    session_id = st.session_state.session_id

    st.markdown('<div class="pc-step-label">Your results</div>', unsafe_allow_html=True)
    st.success(
        f"Holland code **{profile['holland_code']}** · "
        f"#1 match **{top3[0]['emoji']} {top3[0]['house']} ({top3[0]['probability']}%)**"
        + (f" · Session `{session_id}`" if session_id else "")
    )

    if profile["differentiation"] < 1.0:
        st.warning(
            f"Your interest profile is relatively flat (differentiation "
            f"{profile['differentiation']}/4.0). Treat the ranking as exploratory — "
            "try discussing two or three houses with a counsellor rather than locking #1."
        )
    else:
        st.info(
            f"Profile differentiation **{profile['differentiation']}/4.0** — "
            "your preferences are fairly distinct across fields."
        )

    action_cols = st.columns([1, 1, 2])
    with action_cols[0]:
        if st.button("↻ Retake assessment", width="stretch"):
            wipe = [
                k for k in st.session_state.keys()
                if k.startswith(("riasec_radio_", "tipi_radio_", "vocab_"))
                or k in (
                    "riasec_answers",
                    "tipi_answers",
                    "vocab_checked",
                    "prediction_bundle",
                    "session_id",
                )
            ]
            for key in wipe:
                del st.session_state[key]
            st.session_state.wizard_step = 0
            st.session_state.riasec_domain_idx = 0
            st.rerun()
    with action_cols[1]:
        if session_id:
            st.code(session_id, language=None)
            st.caption("Share this Session ID with your counsellor")

    tab_matches, tab_profile, tab_parents = st.tabs([
        "Top Matches & All 7 Houses",
        "RIASEC & Personality Profile",
        "Parents' Market Report",
    ])

    with tab_matches:
        st.subheader("Your Top 3 Degree Family Matches")
        for rank, res in enumerate(top3, start=1):
            house = res["house"]
            stats = get_stats(house)
            with st.container(border=True):
                col1, col2 = st.columns([1, 2])
                with col1:
                    st.metric(
                        label=f"#{rank} Match",
                        value=f"{res['emoji']} {house}",
                        delta=f"{res['probability']}% fit",
                    )
                    if stats and stats.get("sample_degrees"):
                        st.caption("**Example Degrees:** " + " · ".join(stats["sample_degrees"][:3]))
                with col2:
                    if stats:
                        st.markdown(f"**Avg Salary:** {stats['avg_salary']}")
                        st.markdown(f"**Job Postings (Rozee.pk):** {stats['job_postings']:,}")
                        st.markdown(f"**Top Roles:** {', '.join(stats['top_roles'])}")
                        st.markdown(f"**Top Cities:** {', '.join(stats['top_cities'])}")
                        if stats.get("job_postings", 0) < 100:
                            st.caption(
                                "Low job-board volume for this house — many roles recruit "
                                "offline (chambers, hospitals, labs). Use market stats as context, not a veto."
                            )

        st.subheader("Full 7-House Probability Breakdown")
        prob_df = pd.DataFrame([
            {
                "House": f"{r['emoji']} {r['house']}",
                "Fit (%)": r["probability"],
                "Tier": "Top 3 Match" if idx < 3 else "Other Houses",
            }
            for idx, r in enumerate(all_results)
        ])
        bars = (
            alt.Chart(prob_df)
            .mark_bar(cornerRadiusEnd=4)
            .encode(
                x=alt.X(
                    "Fit (%):Q",
                    scale=alt.Scale(domain=[0, max(100, float(prob_df["Fit (%)"].max()) + 10)]),
                ),
                y=alt.Y("House:N", sort="-x", title=None),
                color=alt.Color(
                    "Tier:N",
                    scale=alt.Scale(
                        domain=["Top 3 Match", "Other Houses"],
                        range=["#0f766e", "#9aa5b1"],
                    ),
                    legend=alt.Legend(title=None, orient="top"),
                ),
                tooltip=["House", "Fit (%)", "Tier"],
            )
        )
        labels = bars.mark_text(align="left", dx=5, fontSize=12).encode(
            text=alt.Text("Fit (%):Q", format=".1f"),
            color=alt.value("#0f2f38"),
        )
        st.altair_chart((bars + labels).properties(height=300), width="stretch")

    with tab_profile:
        st.subheader(f"Your Holland Interest Code: `{profile['holland_code']}`")
        code_cols = st.columns(3)
        for idx, code in enumerate(profile["ranked_codes"][:3]):
            title, desc = RIASEC_LABELS[code]
            with code_cols[idx]:
                st.metric(
                    label=f"#{idx + 1} Interest ({code})",
                    value=title,
                    delta=f"{profile['riasec'][code]} / 5.0",
                )
                st.caption(desc)

        st.divider()
        chart_col1, chart_col2 = st.columns(2)
        with chart_col1:
            st.markdown("#### RIASEC Interest Scores (1 – 5)")
            riasec_df = pd.DataFrame([
                {"Domain": f"{RIASEC_LABELS[c][0]} ({c})", "Score": profile["riasec"][c]}
                for c in ("R", "I", "A", "S", "E", "C")
            ])
            riasec_chart = (
                alt.Chart(riasec_df)
                .mark_bar(cornerRadiusEnd=4, color="#0f766e")
                .encode(
                    x=alt.X("Score:Q", scale=alt.Scale(domain=[0, 5])),
                    y=alt.Y("Domain:N", sort="-x", title=None),
                    tooltip=["Domain", "Score"],
                )
                .properties(height=260)
            )
            st.altair_chart(riasec_chart, width="stretch")

        with chart_col2:
            st.markdown("#### Big Five Personality Traits (1 – 7)")
            big5_df = pd.DataFrame([
                {"Trait": trait, "Score": score}
                for trait, score in profile["big_five"].items()
            ])
            big5_chart = (
                alt.Chart(big5_df)
                .mark_bar(cornerRadiusEnd=4, color="#c45c26")
                .encode(
                    x=alt.X("Score:Q", scale=alt.Scale(domain=[0, 7])),
                    y=alt.Y("Trait:N", sort="-x", title=None),
                    tooltip=["Trait", "Score"],
                )
                .properties(height=260)
            )
            st.altair_chart(big5_chart, width="stretch")

    with tab_parents:
        st.subheader("Pakistan Job-Market Summary for Parents")
        st.markdown(
            "In Pakistan, choosing a degree often balances **student aptitude** against "
            "**job security**. Below combines psychometric fit with ILOSTAT 2025 and Rozee.pk."
        )
        k1, k2, k3 = st.columns(3)
        k1.metric(
            "Rozee.pk Postings Analysed",
            f"{MARKET_CONTEXT['rozee_total_clean']:,}",
            f"{MARKET_CONTEXT['rozee_bachelor_share_pct']}% Bachelor's share",
        )
        k2.metric(
            "Pakistan Graduate Unemployment (ILO 2025)",
            f"{MARKET_CONTEXT['pk_unemployment_advanced_pct']}%",
            f"Overall: {MARKET_CONTEXT['pk_unemployment_total_pct']}%",
        )
        k3.metric(
            "Model Top-3 Accuracy",
            f"{MARKET_CONTEXT['model_top3_accuracy_pct']}%",
            "Verified on 16,252 students",
        )

        st.markdown("#### Side-by-Side Comparison of Top 3 Matches")
        comparison_rows = []
        for rank, res in enumerate(top3, start=1):
            stats = get_stats(res["house"]) or {}
            comparison_rows.append({
                "Rank": f"#{rank}",
                "Degree Family": f"{res['emoji']} {res['house']}",
                "Fit (%)": f"{res['probability']}%",
                "Sample Pakistani Degrees": ", ".join(stats.get("sample_degrees", [])[:3]),
                "ILO 2025 Sector Earnings": stats.get("avg_salary", "N/A"),
                "Rozee.pk Postings": f"{stats.get('job_postings', 0):,}",
                "Top Hiring Cities": ", ".join(stats.get("top_cities", [])),
            })
        st.dataframe(pd.DataFrame(comparison_rows), hide_index=True, width="stretch")

        st.markdown("#### Key Takeaways for Family Discussion")
        for rank, res in enumerate(top3, start=1):
            stats = get_stats(res["house"])
            if stats and stats.get("parent_takeaway"):
                st.markdown(f"**#{rank} {res['emoji']} {res['house']}:** {stats['parent_takeaway']}")

        report_md = build_parents_report_markdown(
            top3, all_results, profile, student_meta, session_id
        )
        pdf_bytes = build_parents_report_pdf(
            top3, all_results, profile, student_meta, session_id
        )
        d1, d2 = st.columns(2)
        with d1:
            st.download_button(
                label="Download Parents' Report (PDF)",
                data=pdf_bytes,
                file_name=f"pakcareer_parents_report_{session_id or 'draft'}.pdf",
                mime="application/pdf",
                width="stretch",
                type="primary",
            )
        with d2:
            st.download_button(
                label="Download Markdown (.md)",
                data=report_md,
                file_name=f"pakcareer_parents_report_{session_id or 'draft'}.md",
                mime="text/markdown",
                width="stretch",
            )


def render_counsellor():
    st.markdown('<div class="pc-step-label">Institution workspace</div>', unsafe_allow_html=True)
    st.subheader("Counsellor workspace")
    st.caption("Demo PAAS view — look up student sessions by org invite code or Session ID.")

    orgs = list_orgs()
    org_labels = {f"{o['invite_code']} — {o['name']}": o["invite_code"] for o in orgs}
    org_choice = st.selectbox("Organisation", ["All organisations"] + list(org_labels.keys()))
    org_filter = None if org_choice == "All organisations" else org_labels[org_choice]

    lookup = st.text_input("Open Session ID", placeholder="e.g. A1B2C3D4E5").strip().upper()
    if lookup:
        sess = get_session(lookup)
        if not sess:
            st.error("Session not found.")
        else:
            st.success(
                f"Session `{sess['session_id']}` · Holland `{sess['holland_code']}` · "
                f"#1 {sess['top1_house']} ({sess['top1_prob']}%)"
            )
            meta = sess["student_meta"]
            st.json({
                "age": meta.get("age"),
                "education": meta.get("education"),
                "urban": meta.get("urban"),
                "org": meta.get("org_name"),
                "created_at": sess["created_at"],
            })
            st.markdown("#### Top 3")
            for i, item in enumerate(sess["top3"], start=1):
                st.write(f"{i}. {item['emoji']} {item['house']} — {item['probability']}%")

            notes = st.text_area("Counsellor notes", value=sess.get("notes") or "", height=120)
            if st.button("Save notes", type="primary"):
                update_notes(sess["session_id"], notes)
                st.success("Notes saved.")

            pdf_bytes = build_parents_report_pdf(
                sess["top3"],
                sess["all_results"],
                sess["profile"],
                sess["student_meta"],
                sess["session_id"],
            )
            st.download_button(
                "Download student PDF pack",
                data=pdf_bytes,
                file_name=f"pakcareer_{sess['session_id']}.pdf",
                mime="application/pdf",
            )

    st.divider()
    st.markdown("#### Cohort sessions")
    rows = list_sessions(org_code=org_filter, limit=40)
    if not rows:
        st.info("No saved sessions yet. Complete a student assessment to populate this list.")
    else:
        st.dataframe(
            pd.DataFrame([
                {
                    "Session": r["session_id"],
                    "Created": r["created_at"][:19].replace("T", " "),
                    "Org": r["org_code"] or "—",
                    "Age": r["age"],
                    "Education": r["education"],
                    "Holland": r["holland_code"],
                    "Top-1": r["top1_house"],
                    "Fit %": r["top1_prob"],
                    "Notes": (r["notes"] or "")[:40],
                }
                for r in rows
            ]),
            hide_index=True,
            width="stretch",
        )


def main():
    _init_state()
    init_db()

    with st.sidebar:
        st.markdown("### PakCareer AI")
        st.caption("Premium assessment · demo PAAS")
        mode = st.radio(
            "Workspace",
            ["Student assessment", "Counsellor workspace"],
            index=0 if st.session_state.workspace_mode == "Student assessment" else 1,
        )
        st.session_state.workspace_mode = mode
        st.divider()
        if mode == "Student assessment":
            st.caption(
                f"Step {st.session_state.wizard_step + 1}/{len(WIZARD_STEPS)}: "
                f"{WIZARD_STEPS[st.session_state.wizard_step][1]}"
            )
        st.caption(
            f"Model: XGBoost · Top-3: {MARKET_CONTEXT['model_top3_accuracy_pct']}% · "
            f"ILO {MARKET_CONTEXT['ilo_earnings_year']} · "
            f"{MARKET_CONTEXT['rozee_total_clean']:,} Rozee.pk postings"
        )
        if not model_files_exist():
            st.error("Model weights missing in models/weights/")

    if st.session_state.workspace_mode == "Counsellor workspace":
        render_counsellor()
        return

    if not model_files_exist() and st.session_state.wizard_step >= 4:
        st.error(
            "Cannot run prediction — model files missing. "
            "Download from the README Drive link into `models/weights/`."
        )

    _step_progress()
    step_key = WIZARD_STEPS[st.session_state.wizard_step][0]
    if step_key == "landing":
        render_landing()
    elif step_key == "about":
        render_about()
    elif step_key == "riasec":
        render_riasec()
    elif step_key == "tipi":
        render_tipi()
    elif step_key == "vocab":
        render_vocab()
    elif step_key == "results":
        render_results()


main()
