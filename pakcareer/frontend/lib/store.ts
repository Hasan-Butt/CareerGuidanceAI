// ── Zustand assessment store with sessionStorage persistence ──────────────────
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AssessmentProfile, HouseResult, WizardStep } from "./types";

interface AboutData {
  age: number;
  education: string;
  familysize: number;
  urban_label: string;
  engnat_label: string;
  invite_code: string;
}

interface AssessmentState {
  // Step navigation
  step: WizardStep;
  setStep: (s: WizardStep) => void;

  // About
  about: Partial<AboutData>;
  setAbout: (data: Partial<AboutData>) => void;

  // RIASEC responses (R1–C8, each 1–5)
  riasec: Record<string, number>;
  setRiasec: (key: string, val: number) => void;

  // TIPI responses (TIPI1–TIPI10, each 1–7)
  tipi: Record<string, number>;
  setTipi: (key: string, val: number) => void;

  // Vocab checkboxes (VCL1–VCL16)
  vocab: Record<string, boolean>;
  setVocab: (key: string, val: boolean) => void;

  // Results (populated after /api/predict)
  sessionId: string | null;
  top3: HouseResult[];
  allResults: HouseResult[];
  profile: AssessmentProfile | null;
  setResults: (data: {
    sessionId: string;
    top3: HouseResult[];
    allResults: HouseResult[];
    profile: AssessmentProfile;
  }) => void;

  // Loading / error
  loading: boolean;
  error: string | null;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;

  // Reset everything
  reset: () => void;
}

const INITIAL: Omit<
  AssessmentState,
  | "setStep" | "setAbout" | "setRiasec" | "setTipi" | "setVocab"
  | "setResults" | "setLoading" | "setError" | "reset"
> = {
  step: "landing",
  about: {},
  riasec: {},
  tipi: {},
  vocab: {},
  sessionId: null,
  top3: [],
  allResults: [],
  profile: null,
  loading: false,
  error: null,
};

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setStep: (step) => set({ step }),
      setAbout: (data) => set((s) => ({ about: { ...s.about, ...data } })),
      setRiasec: (key, val) =>
        set((s) => ({ riasec: { ...s.riasec, [key]: val } })),
      setTipi: (key, val) =>
        set((s) => ({ tipi: { ...s.tipi, [key]: val } })),
      setVocab: (key, val) =>
        set((s) => ({ vocab: { ...s.vocab, [key]: val } })),
      setResults: ({ sessionId, top3, allResults, profile }) =>
        set({ sessionId, top3, allResults, profile }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set({ ...INITIAL }),
    }),
    {
      name: "pakcareer-assessment",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
      // Don't persist transient UI state
      partialize: (s) => ({
        step: s.step,
        about: s.about,
        riasec: s.riasec,
        tipi: s.tipi,
        vocab: s.vocab,
        sessionId: s.sessionId,
        top3: s.top3,
        allResults: s.allResults,
        profile: s.profile,
      }),
    }
  )
);

