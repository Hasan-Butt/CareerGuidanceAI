"""Generate a parents-facing PDF summary report."""

from __future__ import annotations

from io import BytesIO

from fpdf import FPDF

from pakistan_stats import MARKET_CONTEXT, get_stats


class ParentsReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(15, 76, 92)
        self.cell(0, 8, "PakCareer AI", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(80, 90, 100)
        self.cell(
            0,
            6,
            "Student & Parents' Degree Guidance Report",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(
            0,
            10,
            f"Page {self.page_no()}  |  Data-driven conversation starter, not a guarantee.",
            align="C",
        )


def _safe(text: str) -> str:
    """FPDF core fonts are Latin-1; strip/replace unsupported glyphs."""
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "%": " pct",
        "\u00b7": "-",
    }
    out = str(text)
    for src, dst in replacements.items():
        out = out.replace(src, dst)
    return out.encode("latin-1", errors="replace").decode("latin-1")


def build_parents_report_pdf(
    top3: list[dict],
    all_houses: list[dict],
    profile: dict,
    student_meta: dict,
    session_id: str | None = None,
) -> bytes:
    pdf = ParentsReportPDF(format="A4")
    pdf.set_margins(left=18, top=18, right=18)
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    usable = pdf.epw

    def write_line(text: str, h: float = 6):
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(usable, h, _safe(text))

    def write_heading(text: str):
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 47, 56)
        write_line(text, 8)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(30, 30, 30)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(30, 30, 30)

    write_heading("Student Snapshot")
    lines = [
        f"Age: {student_meta.get('age')}  |  Education: {student_meta.get('education')}",
        f"Holland Interest Code: {profile.get('holland_code')}",
        f"Profile Differentiation: {profile.get('differentiation')} / 4.0",
    ]
    if session_id:
        lines.append(f"Session ID: {session_id}")
    if student_meta.get("org_name"):
        lines.append(f"Organisation: {student_meta['org_name']}")
    for line in lines:
        write_line(line)

    write_heading("Top 3 Recommended Degree Families")
    write_line(
        f"In evaluation on 16,252 students, the model's top-3 list contains the "
        f"student's actual degree family {MARKET_CONTEXT['model_top3_accuracy_pct']} pct "
        f"of the time."
    )

    for rank, item in enumerate(top3, start=1):
        stats = get_stats(item["house"]) or {}
        pdf.set_font("Helvetica", "B", 11)
        write_line(f"#{rank} {item['house']} ({item['probability']} pct fit)", 7)
        pdf.set_font("Helvetica", "", 10)
        bullets = [
            f"Sample Pakistani Degrees: {', '.join(stats.get('sample_degrees', [])[:4])}",
            f"Avg Monthly Sector Earnings: {stats.get('avg_salary', 'N/A')}",
            f"Rozee.pk Mapped Job Postings: {stats.get('job_postings', 0):,}",
            f"Top Roles: {', '.join(stats.get('top_roles', [])[:4])}",
            f"Top Hiring Cities: {', '.join(stats.get('top_cities', []))}",
            f"Why it matters: {stats.get('parent_takeaway', '')}",
        ]
        for b in bullets:
            write_line(f"- {b}", 5)
        pdf.ln(1)

    write_heading("All 7 Degree Families")
    for rank, item in enumerate(all_houses, start=1):
        write_line(f"{rank}. {item['house']} - {item['probability']} pct", 5)

    write_heading("Pakistan Labour Market Context")
    write_line(
        f"Rozee.pk postings analysed: {MARKET_CONTEXT['rozee_total_clean']:,} "
        f"({MARKET_CONTEXT['rozee_bachelor_share_pct']} pct Bachelor's where specified). "
        f"Pakistan unemployment (ILO {MARKET_CONTEXT['ilo_earnings_year']}): "
        f"{MARKET_CONTEXT['pk_unemployment_total_pct']} pct overall; "
        f"{MARKET_CONTEXT['pk_unemployment_advanced_pct']} pct advanced degree."
    )

    buf = BytesIO()
    pdf.output(buf)
    return buf.getvalue()
