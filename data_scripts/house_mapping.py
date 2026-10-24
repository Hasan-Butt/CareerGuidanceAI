"""
Maps free text (a university major, or a job title) onto one of the seven
PakCareer "houses". Rules are checked in order and the first match wins, so
specific rules sit above general ones (e.g. "computer engineering" must hit
CS/IT before the generic "engineer" rule, "political science" must hit
Arts & Social Sciences before the generic "science" rule).
"""

import re

HOUSES = [
    "Medicine & Health",
    "Engineering",
    "Computer Science & IT",
    "Business & Commerce",
    "Law",
    "Arts, Humanities & Social Sciences",
    "Pure Sciences",
]

# answers that carry no information about a field of study
NON_ANSWERS = re.compile(
    r"^(no|none|nil|nope|na|n/?a|-+|\.+|x|0|null|nothing|undecided|undeclared|"
    r"idk|i ?dont ?know|i don'?t know|not sure|unsure|dont know|don'?t know|"
    r"general|general studies|general education|other|yes|unknown|"
    r"not applicable|haven'?t decided|still deciding|didn'?t attend|"
    r"did not attend|high ?school|n\.a\.?)$"
)

RULES = [
    ("Computer Science & IT", r"computer|software|\bit\b|information tech|information system|"
                              r"computing|cyber|data scien|programm|web dev|informatic|\bcs\b|"
                              r"\bict\b|artificial intel|machine learn|network|^technology$|"
                              r"developer|devops|\bsqa\b|\bqa\b|database|\bseo\b|graphic programmer"),
    ("Arts, Humanities & Social Sciences", r"psych|psyc|psic|pysch|pycholog|phycholog|pschol|"
                              r"counsel|social (work|scien|stud|policy)|sociolog|politic|"
                              r"behavio|anthropolog|library scien|human servic|"
                              r"human development|child development|public policy|government"),
    ("Engineering", r"engineer|aviation|urban planning|welding|mechanics|electrician"),
    ("Medicine & Health", r"nurs|medic|mbbs|doctor|pharm|dent|health|physio|physical therap|"
                          r"occupational therap|nutrition|dietet|kinesiolog|exercise scien|"
                          r"athletic train|radiolog|veterinar|paramedic|surg|anatom|physician|"
                          r"pre[- ]?med|optometr|midwi|speech (path|therap)|respiratory|"
                          r"biomedical scien|clinic|hospital|caregiver|lab technician|rehab|"
                          r"recreational therap"),
    ("Engineering", r"engineer|architect|aerospace|aeronaut|mechatron|electronic|"
                    r"construction|mechanical|electrical|civil|automotive|technician|"
                    r"autocad|quantity survey|site supervisor"),
    ("Law", r"\blaw\b|legal|paralegal|criminal|criminolog|justice|\bllb\b|\bllm\b|"
            r"jurispru|advocate|lawyer|attorney|solicitor|barrister|forensic"),
    ("Business & Commerce", r"busi|buis|bussi|account|financ|commerce|market|manag|\bmba\b|"
                            r"\bbba\b|econom|\bhr\b|\bhrm\b|human resource|admin|entrepren|"
                            r"bank|hospitality|tourism|hotel|actuar|supply chain|logistic|"
                            r"sales|advertis|public relations|real estate|retail|"
                            r"procurement|merchandis|audit|tax|cashier|recruit|"
                            r"business development|customer|telesales|call cent|insurance|"
                            r"\bcpa\b|\bacca\b|\bca\b|leadership|\becon\b|"
                            # job-title terms (Rozee postings)
                            r"\bsale\b|lead generation|purchas|\bcsr\b|relationship officer|"
                            r"store keeper|front desk|receptionist|data entry|office assistant|"
                            r"coordinator|bidder|cold call|outreach"),
    ("Pure Sciences", r"biolog|chemi|physics|math|statist|scien|biochem|zoolog|botan|"
                      r"microbio|geolog|astronom|genetic|ecolog|marine|biotech|agricult|"
                      r"animal|food (sci|tech)|earth|environment|forestry|horticult|"
                      r"research scientist"),
    ("Arts, Humanities & Social Sciences", r"history|philosoph|english|literat|language|linguist|"
                              r"spanish|french|german|japanese|chinese|arabic|urdu|translat|"
                              r"journalis|communicat|media|film|\bart|music|design|theat|drama|"
                              r"danc|photograph|animat|fashion|culinar|chef|writ|educat|teach|"
                              r"theolog|religio|islamic|geograph|classics|archaeolog|liberal|"
                              r"humanit|gender|ethnic|sport|physical education|international "
                              r"(relations|studies|affairs)|content|editor|lecturer|tutor|"
                              r"instructor|cosmetolog|acting|illustrat|early childhood|pedagog|"
                              r"family studies|american studies|philolog|russian|filipino|ministry"),
]
_COMPILED = [(h, re.compile(p)) for h, p in RULES]


def normalise(text):
    if text is None:
        return ""
    t = str(text).lower().strip()
    t = re.sub(r"[^a-z0-9/&\-' ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def map_to_house(text):
    """Return a house name, or None when the text is empty, a non-answer, or unmatched."""
    t = normalise(text)
    if len(t) < 2 or NON_ANSWERS.match(t):
        return None
    for house, rx in _COMPILED:
        if rx.search(t):
            return house
    return None
