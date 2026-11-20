"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NavButtons } from "./NavButtons";
import {
  RIASEC_DOMAINS,
  DOMAIN_LABELS,
  DOMAIN_DESCRIPTIONS,
  RIASEC_QUESTIONS,
} from "@/lib/questions";

const LIKERT_OPTIONS = [
  { val: 1, label: "Strongly Dislike", short: "Dislike" },
  { val: 2, label: "Dislike", short: "Slight Dislike" },
  { val: 3, label: "Neutral / Unsure", short: "Neutral" },
  { val: 4, label: "Enjoy", short: "Enjoy" },
  { val: 5, label: "Strongly Enjoy", short: "Love it" },
];

export function RiasecStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { riasec, setRiasec, setStep } = useAssessmentStore();

  const domainParam = Number(searchParams?.get("domain") || 0);
  const [currentDomainIdx, setCurrentDomainIdx] = useState<number>(
    isNaN(domainParam) || domainParam < 0 || domainParam > 5 ? 0 : domainParam
  );

  useEffect(() => {
    const p = Number(searchParams?.get("domain") || 0);
    if (!isNaN(p) && p >= 0 && p <= 5) {
      setCurrentDomainIdx(p);
    }
  }, [searchParams]);

  const currentDomain = RIASEC_DOMAINS[currentDomainIdx];
  const questions = RIASEC_QUESTIONS[currentDomain] || [];

  const isCurrentDomainComplete = questions.every((_, qIdx) => {
    const key = `${currentDomain}${qIdx + 1}`;
    return riasec[key] !== undefined && riasec[key] >= 1 && riasec[key] <= 5;
  });

  const handleScore = (key: string, val: number) => {
    setRiasec(key, val);
  };

  const handleNext = () => {
    if (currentDomainIdx < 5) {
      const nextIdx = currentDomainIdx + 1;
      setCurrentDomainIdx(nextIdx);
      router.push(`/assessment/riasec?domain=${nextIdx}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStep("tipi");
      router.push("/assessment/tipi");
    }
  };

  const handleBack = () => {
    if (currentDomainIdx > 0) {
      const prevIdx = currentDomainIdx - 1;
      setCurrentDomainIdx(prevIdx);
      router.push(`/assessment/riasec?domain=${prevIdx}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStep("about");
      router.push("/assessment/about");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-4 px-2 sm:px-0">
      {/* Frosted Domain Navigation Pills */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
        {RIASEC_DOMAINS.map((dom, idx) => {
          const domAnswered = (RIASEC_QUESTIONS[dom] || []).filter((_, qIdx) => {
            const k = `${dom}${qIdx + 1}`;
            return riasec[k] !== undefined;
          }).length;
          const isComplete = domAnswered === 8;
          const isCurrent = idx === currentDomainIdx;

          return (
            <button
              key={dom}
              type="button"
              onClick={() => {
                setCurrentDomainIdx(idx);
                router.push(`/assessment/riasec?domain=${idx}`);
              }}
              className={`flex-1 min-w-[70px] sm:min-w-[100px] py-2 px-2.5 rounded-full text-xs font-bold border transition-all text-center cursor-pointer ${
                isCurrent
                  ? "bg-[#2b64ab] text-white border-[#2b64ab] shadow-md shadow-blue-900/20"
                  : isComplete
                  ? "bg-blue-50/80 text-[#2b64ab] border-blue-200"
                  : "bg-white/60 text-slate-700 border-white/80 hover:bg-white"
              }`}
            >
              <div className="font-extrabold">{dom}</div>
              <div className="text-[10px] hidden sm:block truncate opacity-85">
                {DOMAIN_LABELS[dom]}
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2b64ab] bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 shadow-2xs">
              Domain {currentDomainIdx + 1} of 6: {DOMAIN_LABELS[currentDomain]} ({currentDomain})
            </span>
            <span className="text-xs font-bold text-slate-500 bg-white/70 px-2.5 py-0.5 rounded-full border border-white">
              8 activities
            </span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#0f2942] pt-2">
            {DOMAIN_DESCRIPTIONS[currentDomain]}
          </CardTitle>
          <CardDescription>
            Rate how much you would enjoy or dislike doing each of the following activities on a regular basis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3.5">
            {questions.map((qText, qIdx) => {
              const itemKey = `${currentDomain}${qIdx + 1}`;
              const selectedValue = riasec[itemKey];

              return (
                <div
                  key={itemKey}
                  className={`p-4 rounded-[22px] border transition-all ${
                    selectedValue !== undefined
                      ? "border-blue-200 bg-blue-50/40 shadow-xs ring-1 ring-blue-300/40"
                      : "border-slate-200/90 bg-white/85"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-xs sm:text-sm font-bold text-[#0f2942] leading-snug">
                      <span className="font-extrabold text-[#2b64ab] mr-2">
                        {qIdx + 1}.
                      </span>
                      {qText}
                    </p>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {LIKERT_OPTIONS.map((opt) => {
                      const isChosen = selectedValue === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => handleScore(itemKey, opt.val)}
                          className={`py-2 px-1 rounded-[16px] text-xs font-bold border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isChosen
                              ? "bg-[#2b64ab] text-white border-[#2b64ab] shadow-md shadow-blue-900/15"
                              : "bg-white/90 text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-extrabold text-sm sm:text-base">
                            {opt.val}
                          </span>
                          <span className="text-[10px] hidden sm:inline leading-tight">
                            {opt.short}
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
            nextDisabled={!isCurrentDomainComplete}
            nextLabel={
              currentDomainIdx < 5
                ? `Next: ${DOMAIN_LABELS[RIASEC_DOMAINS[currentDomainIdx + 1]]}`
                : "Continue to Personality"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
