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
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2b64ab] bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 shadow-2xs">
              Personality Inventory (TIPI)
            </span>
            <span className="text-xs font-bold text-slate-500 bg-white/70 px-2.5 py-0.5 rounded-full border border-white">
              10 short traits
            </span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#0f2942] pt-2">
            How would you describe yourself?
          </CardTitle>
          <CardDescription>
            Rate the extent to which each pair of traits applies to you, even if one characteristic applies more strongly than the other.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3.5">
            {TIPI_QUESTIONS.map((trait, idx) => {
              const itemKey = `TIPI${idx + 1}`;
              const selectedValue = tipi[itemKey];

              return (
                <div
                  key={itemKey}
                  className={`p-4 rounded-[22px] border transition-all ${
                    selectedValue !== undefined
                      ? "border-blue-200/80 bg-blue-50/60 shadow-xs ring-1 ring-blue-300/50 backdrop-blur-md"
                      : "border-white/80 bg-white/70 backdrop-blur-md shadow-2xs"
                  }`}
                >
                  <p className="text-xs sm:text-sm font-semibold text-[#0f2942] mb-3">
                    <span className="text-slate-400 mr-2 font-mono text-xs">
                      #{idx + 1}
                    </span>
                    I see myself as:{" "}
                    <span className="text-[#2b64ab] font-extrabold">{trait}</span>
                  </p>

                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {TIPI_SCALE_LABELS.map((scale) => {
                      const isChosen = selectedValue === scale.val;
                      return (
                        <button
                          key={scale.val}
                          type="button"
                          onClick={() => setTipi(itemKey, scale.val)}
                          className={`py-2 px-1 rounded-[14px] text-xs font-bold border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isChosen
                              ? "bg-[#2b64ab] text-white border-[#2b64ab] shadow-md shadow-blue-900/20"
                              : "bg-white/80 backdrop-blur-sm text-slate-700 border-white/90 hover:bg-white shadow-2xs"
                          }`}
                        >
                          <span className="font-extrabold text-sm sm:text-base">
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
