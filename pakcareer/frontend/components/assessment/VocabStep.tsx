"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NavButtons } from "./NavButtons";
import { VCL_WORDS, VCL_KEYS, EDUCATION_OPTIONS } from "@/lib/questions";
import { fetchPredict } from "@/lib/api";
import type { AssessmentPayload } from "@/lib/types";
import { Check, AlertCircle } from "lucide-react";

export function VocabStep() {
  const router = useRouter();
  const {
    about,
    riasec,
    tipi,
    vocab,
    setVocab,
    setResults,
    setXgbResult,
    setStep,
    loading,
    setLoading,
    error,
    setError,
  } = useAssessmentStore();

  const handleToggle = (key: string) => {
    setVocab(key, !vocab[key]);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Build full 16 vocab object (defaults to false if unselected)
      const fullVocab: Record<string, boolean> = {};
      VCL_KEYS.forEach((k) => {
        fullVocab[k] = !!vocab[k];
      });

      const payload: AssessmentPayload = {
        riasec,
        tipi,
        vocab_checked: fullVocab,
        age: about.age || 18,
        education: about.education || EDUCATION_OPTIONS[1],
        familysize: about.familysize ?? 5,   // 0 is a valid answer
        urban_label: about.urban_label || "Urban",
        engnat_label: about.engnat_label || "No",
        invite_code: about.invite_code || null,
      };

      const res = await fetchPredict(payload);

      // Store base XGBoost results
      setResults({
        sessionId: res.session_id,
        top3: res.top3,
        allResults: res.all_results,
        profile: res.profile,
      });
      setXgbResult(res);

      // Transition to Stage 1 Follow-up
      setStep("followup");
      router.push("/assessment/followup");
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to calculate recommendations. Please check backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("tipi");
    router.push("/assessment/tipi");
  };

  const checkedCount = Object.values(vocab).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Vocabulary & Language Familiarity
            </span>
            <span className="text-xs font-bold text-[#0f766e]">
              {checkedCount} / 16 words recognized
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-[#0f2f38]">
            Which of these words do you recognize?
          </CardTitle>
          <CardDescription>
            Check the box next to each English word whose meaning you know. Please be honest — do not look up definitions or guess.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VCL_WORDS.map((word, idx) => {
              const itemKey = `VCL${idx + 1}`;
              const isChecked = !!vocab[itemKey];

              return (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => handleToggle(itemKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isChecked
                      ? "border-[#0f766e] bg-teal-50/40 text-[#0f766e] shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold text-sm capitalize">
                    {word}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isChecked
                        ? "bg-[#0f766e] border-[#0f766e] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <NavButtons
            onBack={handleBack}
            onNext={handleSubmit}
            loading={loading}
            nextLabel="Continue to AI Follow-up"
          />
        </CardContent>
      </Card>
    </div>
  );
}
