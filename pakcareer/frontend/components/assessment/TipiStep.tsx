"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NavButtons } from "./NavButtons";
import { TIPI_QUESTIONS, TIPI_KEYS } from "@/lib/questions";

const TIPI_SCALE_LABELS = [
  { val: 1, label: "Disagree strongly", short: "Strongly Disagree" },
  { val: 2, label: "Disagree moderately", short: "Disagree" },
  { val: 3, label: "Disagree a little", short: "Slight Disagree" },
  { val: 4, label: "Neither agree nor disagree", short: "Neutral" },
  { val: 5, label: "Agree a little", short: "Slight Agree" },
  { val: 6, label: "Agree moderately", short: "Agree" },
  { val: 7, label: "Agree strongly", short: "Strongly Agree" },
];

export function TipiStep() {
  const router = useRouter();
  const { tipi, setTipi, setStep } = useAssessmentStore();

  const isComplete = TIPI_KEYS.every(
    (k) => tipi[k] !== undefined && tipi[k] >= 1 && tipi[k] <= 7
  );

  const handleNext = () => {
    setStep("vocab");
    router.push("/assessment/vocab");
  };

  const handleBack = () => {
    setStep("riasec");
    router.push("/assessment/riasec?domain=5");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Personality Inventory (TIPI)
            </span>
            <span className="text-xs font-medium text-slate-500">
              10 short traits
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-[#0f2f38]">
            How would you describe yourself?
          </CardTitle>
          <CardDescription>
            Rate the extent to which each pair of traits applies to you, even if one characteristic applies more strongly than the other.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {TIPI_QUESTIONS.map((trait, idx) => {
              const itemKey = `TIPI${idx + 1}`;
              const selectedValue = tipi[itemKey];

              return (
                <div
                  key={itemKey}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedValue !== undefined
                      ? "border-teal-200 bg-teal-50/20"
                      : "border-slate-200/80 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    <span className="text-slate-400 mr-2 font-mono text-xs">
                      #{idx + 1}
                    </span>
                    I see myself as:{" "}
                    <span className="text-[#0f766e] font-bold">{trait}</span>
                  </p>

                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {TIPI_SCALE_LABELS.map((scale) => {
                      const isChosen = selectedValue === scale.val;
                      return (
                        <button
                          key={scale.val}
                          type="button"
                          onClick={() => setTipi(itemKey, scale.val)}
                          className={`py-2 px-1 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isChosen
                              ? "bg-[#0f766e] text-white border-[#0f766e] shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-bold text-sm sm:text-base">
                            {scale.val}
                          </span>
                          <span className="text-[9px] hidden md:inline leading-tight line-clamp-1">
                            {scale.short}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <NavButtons
            onBack={handleBack}
            onNext={handleNext}
            nextDisabled={!isComplete}
            nextLabel="Continue to Vocabulary"
          />
        </CardContent>
      </Card>
    </div>
  );
}

