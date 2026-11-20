// ── Mirrors questions.py constants for the frontend ───────────────────────────

// RIASEC domain labels (6 domains × 8 items = 48)
export const RIASEC_DOMAINS = ["R", "I", "A", "S", "E", "C"] as const;

export const DOMAIN_LABELS: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  R: "Working with tools, machines, or outdoors",
  I: "Researching, analysing, and solving problems",
  A: "Creating art, writing, music, or design",
  S: "Teaching, helping, and working with people",
  E: "Leading, persuading, and business",
  C: "Organising, data, and following procedures",
};

// 48 RIASEC questions (grouped by domain, 8 each).
// EXACT Open Psychometrics wording the model was trained on — copied from
// backend/questions.py. Do not reword: the model reads each item as a feature.
export const RIASEC_QUESTIONS: Record<string, string[]> = {
  R: [
    "Test the quality of parts before shipment",
    "Lay brick or tile",
    "Work on an offshore oil-drilling rig",
    "Assemble electronic parts",
    "Operate a grinding machine in a factory",
    "Fix a broken faucet",
    "Assemble products in a factory",
    "Install flooring in houses",
  ],
  I: [
    "Study the structure of the human body",
    "Study animal behavior",
    "Do research on plants or animals",
    "Develop a new medical treatment or procedure",
    "Conduct biological research",
    "Study whales and other types of marine life",
    "Work in a biology lab",
    "Make a map of the bottom of an ocean",
  ],
  A: [
    "Conduct a musical choir",
    "Direct a play",
    "Design artwork for magazines",
    "Write a song",
    "Write books or plays",
    "Play a musical instrument",
    "Perform stunts for a movie or television show",
    "Design sets for plays",
  ],
  S: [
    "Give career guidance to people",
    "Do volunteer work at a non-profit organization",
    "Help people who have problems with drugs or alcohol",
    "Teach an individual an exercise routine",
    "Help people with family-related problems",
    "Supervise the activities of children at a camp",
    "Teach children how to read",
    "Help elderly people with their daily activities",
  ],
  E: [
    "Sell restaurant franchises to individuals",
    "Sell merchandise at a department store",
    "Manage the operations of a hotel",
    "Operate a beauty salon or barber shop",
    "Manage a department within a large company",
    "Manage a clothing store",
    "Sell houses",
    "Run a toy store",
  ],
  C: [
    "Generate the monthly payroll checks for an office",
    "Inventory supplies using a hand-held computer",
    "Use a computer program to generate customer bills",
    "Maintain employee records",
    "Compute and record statistical and other numerical data",
    "Operate a calculator",
    "Handle customers' bank transactions",
    "Keep shipping and receiving records",
  ],
};

// Generate ordered item keys: R1–R8, I1–I8, … C1–C8
export const RIASEC_KEYS: string[] = RIASEC_DOMAINS.flatMap((d) =>
  Array.from({ length: 8 }, (_, i) => `${d}${i + 1}`)
);

// TIPI (Big Five personality, 10 items, 1–7 scale)
export const TIPI_QUESTIONS: string[] = [
  "Extraverted, enthusiastic",
  "Critical, quarrelsome",
  "Dependable, self-disciplined",
  "Anxious, easily upset",
  "Open to new experiences, complex",
  "Reserved, quiet",
  "Sympathetic, warm",
  "Disorganised, careless",
  "Calm, emotionally stable",
  "Conventional, uncreative",
];

export const TIPI_KEYS = Array.from({ length: 10 }, (_, i) => `TIPI${i + 1}`);

export const TIPI_SCALE = [
  "Disagree strongly",
  "Disagree moderately",
  "Disagree a little",
  "Neither agree nor disagree",
  "Agree a little",
  "Agree moderately",
  "Agree strongly",
];

// Vocabulary (16 items — do NOT indicate which are fake). Same words and
// order as training (backend/questions.py VOCAB_WORDS).
export const VCL_WORDS: string[] = ["boat", "incoherent", "pallid", "robot", "audible", "cuivocal", "paucity", "epistemology", "florted", "decide", "pastiche", "verdid", "abysmal", "lucid", "betray", "funny"];

export const VCL_KEYS = Array.from({ length: 16 }, (_, i) => `VCL${i + 1}`);

// Fake words (never shown as such to the student; scored server-side)
export const FAKE_WORD_KEYS = ["VCL6", "VCL9", "VCL12"]; // cuivocal, florted, verdid

// Demographics
export const EDUCATION_OPTIONS = [
  "Less than secondary school",
  "Some secondary school",
  "Completed secondary school",
  "Some university/college (no degree)",
  "University degree",
  "Graduate degree",
];

export const URBAN_OPTIONS: Record<string, string> = {
  Rural: "rural",
  Suburban: "suburban",
  Urban: "urban",
};

export const ENGNAT_OPTIONS: Record<string, string> = {
  Yes: "native",
  No: "non_native",
};

// Degree houses (displayed order)
export const HOUSES = [
  "Arts, Humanities & Social Sciences",
  "Business & Commerce",
  "Computer Science & IT",
  "Engineering",
  "Law",
  "Medicine & Health",
  "Pure Sciences",
] as const;

export const HOUSE_EMOJIS: Record<string, string> = {
  "Arts, Humanities & Social Sciences": "🎨",
  "Business & Commerce": "💼",
  "Computer Science & IT": "💻",
  "Engineering": "⚙️",
  "Law": "⚖️",
  "Medicine & Health": "🏥",
  "Pure Sciences": "🔬",
};

// Brand colours (matches tailwind.config.ts)
export const BRAND = {
  primary: "#2b64ab",
  dark: "#0f2942",
  light: "#e3effa",
  accent: "#2b64ab",
} as const;

