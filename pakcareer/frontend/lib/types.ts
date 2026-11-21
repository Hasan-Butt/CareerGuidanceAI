// ── Shared TypeScript types ───────────────────────────────────────────────────

export interface HouseResult {
  house: string;
  emoji: string;
  probability: number;
}

export interface AssessmentProfile {
  riasec: Record<string, number>;        // { R: 3.5, I: 4.2, ... }
  ranked_codes: string[];                // ["I", "C", "R", ...]
  holland_code: string;                  // "I-C-R"
  differentiation: number;
  big_five: Record<string, number>;      // { Extraversion: 3.0, ... }
}

export interface PredictResponse {
  top3: HouseResult[];
  all_results: HouseResult[];
  profile: AssessmentProfile;
  session_id: string;
}

export interface AssessmentPayload {
  riasec: Record<string, number>;        // R1–C8, 1–5
  tipi: Record<string, number>;          // TIPI1–TIPI10, 1–7
  vocab_checked: Record<string, boolean>;// VCL1–VCL16
  age: number;
  education: string;
  familysize: number;
  urban_label: string;
  engnat_label: string;
  invite_code: string;
}

export interface SessionRecord {
  session_id: string;
  created_at: string;
  org_code: string | null;
  age: number;
  education: string;
  familysize: number;
  urban: string;
  engnat: string;
  holland_code: string;
  top1_house: string;
  top1_prob: number;
  top3: HouseResult[];
  all_results: HouseResult[];
  profile: AssessmentProfile;
  // Only present for the student's own counsellor (not on public share links)
  student_meta?: {
    riasec: Record<string, number>;
    tipi: Record<string, number>;
    vocab_checked: Record<string, boolean>;
  };
  notes?: string | null;
}

export interface OrgRecord {
  id: number;
  invite_code: string;
  name: string;
  org_type: "school" | "university" | "counsellor";
}

export interface AnalyticsData {
  total: number;
  house_distribution: Record<string, number>;
  holland_distribution: Record<string, number>;
  urban_split: Record<string, number>;
}

export interface SessionsResponse {
  total: number;
  sessions: SessionRecord[];
}

// ── Assessment wizard step types ──────────────────────────────────────────────

export type WizardStep =
  | "landing"
  | "about"
  | "riasec"
  | "tipi"
  | "vocab"
  | "followup"
  | "results";

export const WIZARD_STEPS: WizardStep[] = [
  "landing",
  "about",
  "riasec",
  "tipi",
  "vocab",
  "followup",
  "results",
];

export const STEP_LABELS: Record<WizardStep, string> = {
  landing:  "Welcome",
  about:    "About You",
  riasec:   "Interests",
  tipi:     "Personality",
  vocab:    "Vocabulary",
  followup: "Follow-up",
  results:  "Results",
};

// ── Gemini layer types ──────────────────────────────────────────────────────

export interface FollowupOption {
  key: "A" | "B" | "C" | "D";
  text: string;
  maps_to: string;
}

export interface FollowupQuestion {
  id: string;
  question: string;
  options: FollowupOption[];
}

export interface GeminiAdjustedHouse {
  house: string;
  emoji: string;
  original_probability: number;
  adjusted_confidence: number;
  rank_change: number;
}

export interface MarketData {
  avg_salary_pkr: string;
  rozee_openings: string;
  top_roles: string[];
  top_companies: string[];
  growth_outlook: string;
}

export interface GeminiEnrichment {
  adjusted_ranking: GeminiAdjustedHouse[];
  market_data: Record<string, MarketData>;
  narratives: Record<string, string>;
  validation_summary: string;
  data_sources: string[];
}

