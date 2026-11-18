# app/app.py
import os
import sys

import altair as alt
import pandas as pd
import streamlit as st

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from pakistan_stats import MARKET_CONTEXT, get_stats
from predictor import (
    RIASEC_LABELS,
    build_feature_row,
    compute_profile_summary,
    load_model,
    predict,
)

# ── Page config ──────────────────────────────────────────────
st.set_page_config(
    page_title="PakCareer AI",
    page_icon="🎓",
    layout="wide",
)

st.title("🎓 PakCareer AI")
st.subheader("Data-driven degree guidance for Pakistani students")
st.markdown(
    "Answer the interest (RIASEC) and personality (Big Five) questions below to discover "
    "which of **7 degree families** best fits you — backed by **ILOSTAT 2025** and "
    "**Rozee.pk** labour-market data you can share with your parents."
)
st.divider()


# ── Load model (cached) ───────────────────────────────────────
@st.cache_resource
def get_model():
    return load_model(
        model_path="models/weights/final_model.pkl",
        encoder_path="models/weights/label_encoder.pkl",
    )


model, le = get_model()

# ── Questions ────────────────────────────────────────────────
RIASEC_QUESTIONS = {
    "R1": "I enjoy working with tools and machines.",
    "R2": "I like building or fixing things.",
    "R3": "I prefer working outdoors.",
    "R4": "I enjoy physical or hands-on tasks.",
    "I1": "I enjoy solving complex problems.",
    "I2": "I like conducting research or experiments.",
    "I3": "I enjoy reading scientific articles.",
    "I4": "I like analysing data and finding patterns.",
    "A1": "I enjoy creative writing or storytelling.",
    "A2": "I like drawing, painting or designing.",
    "A3": "I enjoy performing (music, drama, dance).",
    "A4": "I appreciate art, literature and culture.",
    "S1": "I enjoy helping or teaching others.",
    "S2": "I like working in teams.",
    "S3": "I enjoy counselling or advising people.",
    "S4": "I care about community and social issues.",
    "E1": "I enjoy leading or managing people.",
    "E2": "I like persuading others to my viewpoint.",
    "E3": "I enjoy starting new projects or ventures.",
    "E4": "I like taking risks to achieve goals.",
    "C1": "I enjoy organising information and records.",
    "C2": "I like following clear rules and procedures.",
    "C3": "I enjoy working with numbers and data.",
    "C4": "I prefer structured and predictable tasks.",
}

TIPI_QUESTIONS = {
    "TIPI1": "I see myself as extraverted, enthusiastic.",
    "TIPI2": "I see myself as critical, quarrelsome.",
    "TIPI3": "I see myself as dependable, self-disciplined.",
    "TIPI4": "I see myself as anxious, easily upset.",
    "TIPI5": "I see myself as open to new experiences.",
    "TIPI6": "I see myself as reserved, quiet.",
    "TIPI7": "I see myself as sympathetic, warm.",
    "TIPI8": "I see myself as disorganised, careless.",
    "TIPI9": "I see myself as calm, emotionally stable.",
    "TIPI10": "I see myself as conventional, uncreative.",
}


def build_parents_report_markdown(
    top3: list[dict],
    all_houses: list[dict],
    profile: dict,
    student_meta: dict,
) -> str:
    """Generate a downloadable parent-facing summary grounded in Pakistan data."""
    lines = [
        "# PakCareer AI — Student & Parents' Degree Guidance Report",
        "",
        "## Student Snapshot",
        f"- **Age:** {student_meta['age']} | **Education:** {student_meta['education']}",
        f"- **Holland Interest Code:** `{profile['holland_code']}`",
        f"- **Profile Differentiation:** {profile['differentiation']} / 4.0",
        "",
        "## Top 3 Recommended Degree Families",
        f"In evaluation on 16,252 students, the model's top-3 list contains the student's "
        f"actual degree family **{MARKET_CONTEXT['model_top3_accuracy_pct']}%** of the time.",
        "",
    ]
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


# ── Sidebar: Demographics ────────────────────────────────────
with st.sidebar:
    st.header("About You")
    age = st.slider("Age", 15, 25, 18)
    education = st.selectbox(
        "Current education level",
        [
            "Matric / O-Levels",
            "Intermediate / A-Levels",
            "Undergraduate Year 1",
            "Undergraduate Year 2+",
        ],
        index=1,
    )
    edu_map = {
        "Matric / O-Levels": 1,
        "Intermediate / A-Levels": 2,
        "Undergraduate Year 1": 3,
        "Undergraduate Year 2+": 4,
    }
    familysize = st.slider("Number of siblings", 0, 10, 2)
    vocab = st.slider("Vocabulary (words you know out of 13)", 0, 13, 7)

    st.divider()
    st.caption(
        f"Model: XGBoost (88 features) · Top-3 accuracy: "
        f"{MARKET_CONTEXT['model_top3_accuracy_pct']}% · "
        f"Data: ILOSTAT {MARKET_CONTEXT['ilo_earnings_year']} & "
        f"{MARKET_CONTEXT['rozee_total_clean']:,} Rozee.pk postings"
    )

# ── Main: RIASEC ─────────────────────────────────────────────
st.header("Part 1: Interests (1 = Strongly Disagree, 5 = Strongly Agree)")

riasec_responses = {}
cols = st.columns(2)
for i, (key, question) in enumerate(RIASEC_QUESTIONS.items()):
    with cols[i % 2]:
        riasec_responses[key] = st.slider(question, 1, 5, 3, key=f"r_{key}")

# Fill remaining items (5..8 per scale) with neutral 3
for code in ("R", "I", "A", "S", "E", "C"):
    for n in range(1, 9):
        k = f"{code}{n}"
        if k not in riasec_responses:
            riasec_responses[k] = 3

# ── Main: TIPI ───────────────────────────────────────────────
st.divider()
st.header("Part 2: Personality (1 = Disagree Strongly, 7 = Agree Strongly)")

tipi_responses = {}
cols2 = st.columns(2)
for i, (key, question) in enumerate(TIPI_QUESTIONS.items()):
    with cols2[i % 2]:
        tipi_responses[key] = st.slider(question, 1, 7, 4, key=f"t_{key}")

# ── Predict ───────────────────────────────────────────────────
st.divider()
if st.button("🔍 Find My Best-Fit Degree", type="primary", width="stretch"):
    with st.spinner("Analysing your profile..."):
        feature_row = build_feature_row(
            riasec_responses,
            tipi_responses,
            age,
            edu_map[education],
            familysize,
            vocab,
        )
        all_results = predict(model, le, feature_row, top_k=None)
        profile = compute_profile_summary(riasec_responses, tipi_responses)
        st.session_state["prediction_bundle"] = {
            "all_results": all_results,
            "top3": all_results[:3],
            "profile": profile,
            "student_meta": {
                "age": age,
                "education": education,
                "familysize": familysize,
                "vocab": vocab,
            },
        }

# ── Results Dashboard ─────────────────────────────────────────
if "prediction_bundle" in st.session_state:
    bundle = st.session_state["prediction_bundle"]
    all_results = bundle["all_results"]
    top3 = bundle["top3"]
    profile = bundle["profile"]
    student_meta = bundle["student_meta"]

    st.success(
        f"Analysis complete! Your Holland code is **{profile['holland_code']}** "
        f"and your #1 degree family match is **{top3[0]['emoji']} {top3[0]['house']} "
        f"({top3[0]['probability']}%)**."
    )

    tab_matches, tab_profile, tab_parents = st.tabs([
        "🎯 Top Matches & All 7 Houses",
        "🧭 RIASEC & Personality Profile",
        "👨‍👩‍👧 Parents' Market Report",
    ])

    # ── Tab 1: Top-3 Cards + Full 7-House Chart ──────────────
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
                x=alt.X("Fit (%):Q", scale=alt.Scale(domain=[0, max(100, prob_df["Fit (%)"].max() + 10)])),
                y=alt.Y("House:N", sort="-x", title=None),
                color=alt.Color(
                    "Tier:N",
                    scale=alt.Scale(
                        domain=["Top 3 Match", "Other Houses"],
                        range=["#1f77b4", "#9aa5b1"],
                    ),
                    legend=alt.Legend(title=None, orient="top"),
                ),
                tooltip=["House", "Fit (%)", "Tier"],
            )
        )
        labels = bars.mark_text(align="left", dx=5, fontSize=12).encode(
            text=alt.Text("Fit (%):Q", format=".1f"),
            color=alt.value("#222222"),
        )
        st.altair_chart((bars + labels).properties(height=300), width="stretch")

        st.info(
            "This recommendation is based on your interest and personality profile. "
            f"Our model's top-3 list captures the student's actual degree family "
            f"{MARKET_CONTEXT['model_top3_accuracy_pct']}% of the time — use it as a "
            "starting point for discussion with your family and counsellor."
        )

    # ── Tab 2: RIASEC & Personality Profile ──────────────────
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
                {
                    "Domain": f"{RIASEC_LABELS[c][0]} ({c})",
                    "Score": profile["riasec"][c],
                }
                for c in ("R", "I", "A", "S", "E", "C")
            ])
            riasec_chart = (
                alt.Chart(riasec_df)
                .mark_bar(cornerRadiusEnd=4, color="#2563eb")
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
                .mark_bar(cornerRadiusEnd=4, color="#0d9488")
                .encode(
                    x=alt.X("Score:Q", scale=alt.Scale(domain=[0, 7])),
                    y=alt.Y("Trait:N", sort="-x", title=None),
                    tooltip=["Trait", "Score"],
                )
                .properties(height=260)
            )
            st.altair_chart(big5_chart, width="stretch")

        st.caption(
            f"**Profile Differentiation:** `{profile['differentiation']}` "
            "(difference between your highest and lowest RIASEC score; higher values mean "
            "more distinct preferences across fields)."
        )

    # ── Tab 3: Parents' Data-Backed Report ───────────────────
    with tab_parents:
        st.subheader("Pakistan Job-Market Summary for Parents")
        st.markdown(
            "In Pakistan, choosing a degree often balances **student aptitude** against "
            "**job security**. Below is a summary combining your child's psychometric fit "
            "with real Pakistani labour-market figures from **ILOSTAT 2025** and **Rozee.pk**."
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

        report_md = build_parents_report_markdown(top3, all_results, profile, student_meta)
        st.download_button(
            label="📄 Download Parents' Summary Report (.md)",
            data=report_md,
            file_name="pakcareer_parents_report.md",
            mime="text/markdown",
            width="stretch",
        )
