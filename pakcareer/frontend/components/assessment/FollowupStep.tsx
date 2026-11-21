"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { fetchFollowupQuestions, fetchGeminiEnrichment } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, AlertCircle, Loader2, ArrowUpRight } from "lucide-react";
import type { FollowupQuestion } from "@/lib/types";

const DEFAULT_FALLBACK_QUESTIONS: FollowupQuestion[] = [
  {
    id: "fq1",
    question: "If you had to pick one weekend project, which would you enjoy most?",
    options: [
      { key: "A", text: "Build a mobile app or website", maps_to: "Computer Science & IT" },
      { key: "B", text: "Design and assemble a mechanical gadget", maps_to: "Engineering" },
      { key: "C", text: "Start a small online business or manage accounts", maps_to: "Business & Commerce" },
      { key: "D", text: "Volunteer at a health clinic or awareness campaign", maps_to: "Medicine & Health" },
    ],
  },
  {
    id: "fq2",
    question: "Which university club would you most likely join?",
    options: [
      { key: "A", text: "AI & Robotics Club", maps_to: "Computer Science & IT" },
      { key: "B", text: "Debate & Model UN Society", maps_to: "Arts, Humanities & Social Sciences" },
      { key: "C", text: "Science Olympiad Team", maps_to: "Pure Sciences" },
      { key: "D", text: "Moot Court / Law Society", maps_to: "Law" },
    ],
  },
  {
    id: "fq3",
    question: "In a group project, which role do you naturally take?",
    options: [
      { key: "A", text: "The researcher who finds data and writes reports", maps_to: "Pure Sciences" },
      { key: "B", text: "The technical person who builds the prototype", maps_to: "Engineering" },
      { key: "C", text: "The presenter and negotiator", maps_to: "Business & Commerce" },
      { key: "D", text: "The coordinator who keeps everyone on track", maps_to: "Arts, Humanities & Social Sciences" },
    ],
  },
];

export function FollowupStep() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    sessionId,
    allResults,
    top3,
    profile,
    xgbResult,
    followupQuestions,
    followupAnswers,
    setFollowupQuestions,
    setFollowupAnswer,
    setGeminiEnrichment,
    setStep,
  } = useAssessmentStore();

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingStage2, setSubmittingStage2] = useState(false);
  const [stage2Status, setStage2Status] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId && (!allResults || allResults.length === 0)) {
      router.push("/assessment/landing");
    }
  }, [sessionId, allResults, router]);

  useEffect(() => {
    if (followupQuestions && followupQuestions.length > 0) return;
    if (!allResults || allResults.length === 0) return;

    let isMounted = true;
    setLoadingQuestions(true);
    setFetchError(null);

    // Hard 4-second safety guard: never let the user wait longer than 4s
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn("Gemini stage 1 response delayed; falling back to instant diagnostic questions.");
        setFollowupQuestions(DEFAULT_FALLBACK_QUESTIONS);
        setLoadingQuestions(false);
      }
    }, 4000);

    const sorted = [...allResults].sort((a, b) => b.probability - a.probability);
    const weakDomains: string[] = [];
    if (sorted.length >= 2) {
      weakDomains.push(sorted[0].house, sorted[1].house);
      if (sorted.length >= 3 && Math.abs(sorted[1].probability - sorted[2].probability) < 8) {
        weakDomains.push(sorted[2].house);
      }
    }

    const probabilitiesPayload = allResults.map((r) => ({
      house: r.house,
      probability: r.probability,
      emoji: r.emoji || "🎓",
    }));

    fetchFollowupQuestions({
      xgb_probabilities: probabilitiesPayload,
      holland_code: profile?.holland_code || "I-R-C",
      weak_domains: weakDomains,
    })
      .then((res) => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        if (res && res.questions && res.questions.length > 0) {
          setFollowupQuestions(res.questions);
        } else {
          setFollowupQuestions(DEFAULT_FALLBACK_QUESTIONS);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        console.warn("Stage 1 Gemini error/timeout; using instant fallback questions:", err);
        setFollowupQuestions(DEFAULT_FALLBACK_QUESTIONS);
      })
      .finally(() => {
        if (isMounted) setLoadingQuestions(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [allResults, profile, followupQuestions, setFollowupQuestions]);

  const questions = followupQuestions || [];
  const answeredCount = questions.filter((q) => !!followupAnswers[q.id]).length;
  const isAllAnswered = questions.length > 0 && answeredCount === questions.length;

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setFollowupAnswer(questionId, optionKey);
  };

  const handleSkipOrProceedWithoutAI = () => {
    setStep("results");
    router.push(`/assessment/results?session=${sessionId || ""}`);
  };

  const handleSubmit = async () => {
    if (!isAllAnswered) return;

    setSubmittingStage2(true);
    setStage2Status("Connecting to Gemini AI layer...");
    setFetchError(null);

    try {
      setStage2Status("Searching Pakistani job market data (Rozee.pk & HEC)...");

      const rankingPayload = (top3.length > 0 ? top3 : allResults.slice(0, 3)).map((r) => ({
        house: r.house,
        emoji: r.emoji || "🎓",
        probability: r.probability,
      }));

      const enrichment = await fetchGeminiEnrichment({
        xgb_ranking: rankingPayload,
        followup_answers: followupAnswers,
        holland_code: profile?.holland_code || "I-R-C",
      });

      setStage2Status("Synthesizing market intelligence...");
      setGeminiEnrichment(enrichment);

      setStep("results");
      startTransition(() => {
        router.push(`/assessment/results?session=${sessionId || ""}`);
      });
    } catch (err: unknown) {
      console.error("Stage 2 validation failed:", err);
      setStep("results");
      router.push(`/assessment/results?session=${sessionId || ""}`);
    } finally {
      setSubmittingStage2(false);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-white/70 backdrop-blur-md border border-white/80 flex items-center justify-center mx-auto shadow-md">
          <Loader2 className="w-8 h-8 text-[#2b64ab] animate-spin" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Stage 1: AI Diagnostic Layer
          </span>
          <h2 className="text-2xl font-extrabold text-white drop-shadow-xs">
            Evaluating Your Profile
          </h2>
          <p className="text-xs text-white/85 max-w-xs mx-auto">
            Preparing 3–5 targeted questions to fine-tune your degree match recommendations...
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSkipOrProceedWithoutAI}
            className="text-xs font-bold text-white/90 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 transition cursor-pointer"
          >
            Skip to Instant Results ↗
          </button>
        </div>
      </div>
    );
  }

  if (submittingStage2) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-white/70 backdrop-blur-md border border-white/80 flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 inline-flex items-center gap-1.5">
            Stage 2: Live Market Grounding
          </span>
          <h2 className="text-2xl font-extrabold text-white drop-shadow-xs">
            Validating Job Market Demand
          </h2>
          <p className="text-xs font-medium text-white/90 max-w-xs mx-auto">
            {stage2Status || "Enriching your profile with real-time industry insights..."}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSkipOrProceedWithoutAI}
            className="text-xs font-bold text-white/90 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 transition cursor-pointer"
          >
            Skip Directly to Results ↗
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-2 sm:px-0">
      <div className="bg-white/75 backdrop-blur-2xl border border-white/85 rounded-[32px] overflow-hidden shadow-[0_18px_45px_-10px_rgba(20,50,90,0.16)]">
        {/* Header Area */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-white/40 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#2b64ab] bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" /> Stage 1 Diagnostic
            </span>
            <span className="text-xs font-mono font-bold text-slate-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
              {answeredCount} of {questions.length} answered
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f2942]">
            Targeted Follow-Up Diagnostic
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Your interests indicate close alignment across multiple fields. Answer these real-world scenarios so AI can calibrate your exact ranking.
          </p>
        </div>

        {/* Content & Questions */}
        <div className="p-6 sm:p-8 space-y-8">
          {fetchError && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={handleSkipOrProceedWithoutAI}
                className="text-xs font-bold text-[#2b64ab] underline"
              >
                Skip to Results
              </button>
            </div>
          )}

          {questions.map((q, qIdx) => {
            const selectedKey = followupAnswers[q.id];

            return (
              <div key={q.id} className="space-y-3 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2b64ab] text-white text-xs font-extrabold shrink-0 mt-0.5 shadow-2xs">
                    {qIdx + 1}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#0f2942]">
                    {q.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-9">
                  {q.options.map((opt) => {
                    const isSelected = selectedKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        className={`p-3.5 rounded-[20px] border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? "border-[#2b64ab] bg-blue-50/80 shadow-xs ring-2 ring-[#2b64ab]/30 backdrop-blur-md"
                            : "border-white/85 bg-white/70 hover:border-white hover:bg-white text-slate-800 shadow-2xs backdrop-blur-md"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? "bg-[#2b64ab] text-white"
                              : "border border-white/90 text-slate-600 bg-white/60"
                          }`}
                        >
                          {opt.key}
                        </div>
                        <div className="flex-1 text-xs leading-relaxed font-semibold">
                          {opt.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSkipOrProceedWithoutAI}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Skip to Results
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isAllAnswered || isPending}
              className="rounded-full bg-[#2b64ab] hover:bg-[#1f4f8b] disabled:bg-slate-300 text-white px-7 py-3 font-bold text-xs sm:text-sm shadow-md shadow-blue-900/20 flex items-center gap-2 transition cursor-pointer"
            >
              <span>Validate & See Verified Results</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
