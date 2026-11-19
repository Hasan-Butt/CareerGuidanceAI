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

// 48 RIASEC questions (grouped by domain, 8 each)
export const RIASEC_QUESTIONS: Record<string, string[]> = {
  R: [
    "Build or repair things around the house",
    "Work on engines or machines",
    "Use hand tools (e.g. hammer, drill, wrench)",
    "Assemble or repair electronic devices",
    "Operate farm or construction equipment",
    "Read a blueprint or technical diagram",
    "Do landscaping or garden work",
    "Work with wood or metal to build objects",
  ],
  I: [
    "Study how the human body works",
    "Conduct scientific experiments",
    "Read scientific journals or research papers",
    "Analyse data to find patterns",
    "Develop theories to explain observations",
    "Use a microscope or laboratory equipment",
    "Solve complex maths or logic puzzles",
    "Research a topic in depth using multiple sources",
  ],
  A: [
    "Sketch, draw, or paint for fun",
    "Write short stories, poetry, or creative content",
    "Play a musical instrument",
    "Act in plays or improvise scenes",
    "Design graphics, logos, or layouts",
    "Decorate rooms or design interior spaces",
    "Create sculptures or craft objects",
    "Choreograph or perform dance routines",
  ],
  S: [
    "Volunteer at a charity or community centre",
    "Tutor or teach others a skill",
    "Counsel or listen to friends with problems",
    "Plan group activities or social events",
    "Work as part of a team on shared goals",
    "Care for children or elderly people",
    "Mediate or resolve conflicts between people",
    "Advocate for social justice or community issues",
  ],
  E: [
    "Lead a team or club at school",
    "Negotiate or debate in competitions",
    "Start a small business or sell products",
    "Recruit or motivate other people",
    "Give speeches or presentations",
    "Make strategic decisions in games or simulations",
    "Manage a budget or fundraise for a project",
    "Influence others to adopt your ideas",
  ],
  C: [
    "Keep detailed records or spreadsheets",
    "File documents and maintain organised systems",
    "Use accounting or billing software",
    "Follow step-by-step instructions precisely",
    "Perform data entry or statistical computing",
    "Proofread written materials for errors",
    "Schedule and plan meetings or tasks",
    "Manage inventories or databases",
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

// Vocabulary (16 items — do NOT indicate which are fake)
export const VCL_WORDS: string[] = [
  "boat",   "incoherent", "pallid",    "mural",
  "flommy", "caress",     "clauver",   "decide",
  "fatuous","piquant",    "tectonic",  "herbal",
  "quenzy", "glitter",    "staunch",   "glib",
];

export const VCL_KEYS = Array.from({ length: 16 }, (_, i) => `VCL${i + 1}`);

// Fake words (never shown to student, used server-side only)
export const FAKE_WORD_KEYS = ["VCL5", "VCL7", "VCL13"]; // flommy, clauver, quenzy

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
  primary: "#0f766e",
  dark: "#0f2f38",
  light: "#ccfbf1",
  accent: "#c45c26",
} as const;

