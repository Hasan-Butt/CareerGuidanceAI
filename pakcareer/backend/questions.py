"""Assessment content: RIASEC activities, TIPI, vocabulary checklist."""

# Exact Open Psychometrics / survey wording (must match training stimuli).
RIASEC_QUESTIONS = {
    "R1": "Test the quality of parts before shipment",
    "R2": "Lay brick or tile",
    "R3": "Work on an offshore oil-drilling rig",
    "R4": "Assemble electronic parts",
    "R5": "Operate a grinding machine in a factory",
    "R6": "Fix a broken faucet",
    "R7": "Assemble products in a factory",
    "R8": "Install flooring in houses",
    "I1": "Study the structure of the human body",
    "I2": "Study animal behavior",
    "I3": "Do research on plants or animals",
    "I4": "Develop a new medical treatment or procedure",
    "I5": "Conduct biological research",
    "I6": "Study whales and other types of marine life",
    "I7": "Work in a biology lab",
    "I8": "Make a map of the bottom of an ocean",
    "A1": "Conduct a musical choir",
    "A2": "Direct a play",
    "A3": "Design artwork for magazines",
    "A4": "Write a song",
    "A5": "Write books or plays",
    "A6": "Play a musical instrument",
    "A7": "Perform stunts for a movie or television show",
    "A8": "Design sets for plays",
    "S1": "Give career guidance to people",
    "S2": "Do volunteer work at a non-profit organization",
    "S3": "Help people who have problems with drugs or alcohol",
    "S4": "Teach an individual an exercise routine",
    "S5": "Help people with family-related problems",
    "S6": "Supervise the activities of children at a camp",
    "S7": "Teach children how to read",
    "S8": "Help elderly people with their daily activities",
    "E1": "Sell restaurant franchises to individuals",
    "E2": "Sell merchandise at a department store",
    "E3": "Manage the operations of a hotel",
    "E4": "Operate a beauty salon or barber shop",
    "E5": "Manage a department within a large company",
    "E6": "Manage a clothing store",
    "E7": "Sell houses",
    "E8": "Run a toy store",
    "C1": "Generate the monthly payroll checks for an office",
    "C2": "Inventory supplies using a hand-held computer",
    "C3": "Use a computer program to generate customer bills",
    "C4": "Maintain employee records",
    "C5": "Compute and record statistical and other numerical data",
    "C6": "Operate a calculator",
    "C7": "Handle customers' bank transactions",
    "C8": "Keep shipping and receiving records",
}

RIASEC_DOMAIN_ORDER = ("R", "I", "A", "S", "E", "C")

RIASEC_DOMAIN_META = {
    "R": ("Realistic", "Hands-on technical work"),
    "I": ("Investigative", "Research and analysis"),
    "A": ("Artistic", "Creative expression"),
    "S": ("Social", "Helping and teaching"),
    "E": ("Enterprising", "Leading and selling"),
    "C": ("Conventional", "Organising and systems"),
}

TIPI_QUESTIONS = {
    "TIPI1": "Extraverted, enthusiastic",
    "TIPI2": "Critical, quarrelsome",
    "TIPI3": "Dependable, self-disciplined",
    "TIPI4": "Anxious, easily upset",
    "TIPI5": "Open to new experiences, complex",
    "TIPI6": "Reserved, quiet",
    "TIPI7": "Sympathetic, warm",
    "TIPI8": "Disorganized, careless",
    "TIPI9": "Calm, emotionally stable",
    "TIPI10": "Conventional, uncreative",
}

# Open Psychometrics VCL checklist (VCL6/9/12 are not real words).
VOCAB_WORDS = {
    "VCL1": ("boat", False),
    "VCL2": ("incoherent", False),
    "VCL3": ("pallid", False),
    "VCL4": ("robot", False),
    "VCL5": ("audible", False),
    "VCL6": ("cuivocal", True),
    "VCL7": ("paucity", False),
    "VCL8": ("epistemology", False),
    "VCL9": ("florted", True),
    "VCL10": ("decide", False),
    "VCL11": ("pastiche", False),
    "VCL12": ("verdid", True),
    "VCL13": ("abysmal", False),
    "VCL14": ("lucid", False),
    "VCL15": ("betray", False),
    "VCL16": ("funny", False),
}

FAKE_WORD_KEYS = ["VCL6", "VCL9", "VCL12"]
REAL_WORD_KEYS = [k for k, (_, fake) in VOCAB_WORDS.items() if not fake]

EDUCATION_OPTIONS = [
    "Matric / O-Levels",
    "Intermediate / A-Levels",
    "Undergraduate Year 1",
    "Undergraduate Year 2+",
]

# Training codebook: 1 = less than high school, 2 = high school,
# 3 = university degree, 4 = graduate degree.
EDU_MAP = {
    # Labels shown by the Next.js wizard (frontend/lib/questions.ts)
    "Less than secondary school": 1,
    "Some secondary school": 1,
    "Completed secondary school": 2,
    "Some university/college (no degree)": 2,
    "University degree": 3,
    "Graduate degree": 4,
    # Labels from the original Streamlit app
    "Matric / O-Levels": 1,
    "Intermediate / A-Levels": 2,
    "Undergraduate Year 1": 3,
    "Undergraduate Year 2+": 4,
}

# Training codebook: 1 = rural, 2 = suburban, 3 = urban (town, city).
URBAN_OPTIONS = {
    "Rural": "rural",
    "Suburban": "suburban",
    "Urban": "urban",
    "Rural (village)": "rural",
    "Small town / suburban": "suburban",
    "City": "urban",
}

ENGNAT_OPTIONS = {
    "Yes": "native",
    "No": "non_native",
    "Yes — English is my native language": "native",
    "No — English is not my native language": "non_native",
}

RIASEC_SCALE_HELP = "1 = Dislike · 2 = Slightly dislike · 3 = Neither · 4 = Slightly enjoy · 5 = Enjoy"
TIPI_SCALE_HELP = (
    "1 = Disagree strongly · 2 = Disagree moderately · 3 = Disagree a little · "
    "4 = Neither · 5 = Agree a little · 6 = Agree moderately · 7 = Agree strongly"
)

WIZARD_STEPS = [
    ("landing", "Welcome"),
    ("about", "About you"),
    ("riasec", "Interests"),
    ("tipi", "Personality"),
    ("vocab", "Vocabulary"),
    ("results", "Results"),
]
