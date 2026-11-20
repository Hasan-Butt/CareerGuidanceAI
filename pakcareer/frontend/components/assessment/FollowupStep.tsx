"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { fetchFollowupQuestions, fetchGeminiEnrichment } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

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

  // If user navigates directly without XGBoost results, redirect back to start
  useEffect(() => {
    if (!sessionId && (!allResults || allResults.length === 0)) {
      router.push("/assessment/landing");
    }
  }, [sessionId, allResults, router]);

  // Stage 1: Load follow-up questions if not already fetched
  useEffect(() => {
    if (followupQuestions && followupQuestions.length > 0) return;
    if (!allResults || allResults.length === 0) return;

    let isMounted = true;
    setLoadingQuestions(true);
    setFetchError(null);

    // Identify weak / ambiguous domains (e.g. top 2-3 houses with close probabilities, or close differences)
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
        if (res && res.questions && res.questions.length > 0) {
          setFollowupQuestions(res.questions);
        } else {
          setFetchError("Unable to generate follow-up questions. You can proceed directly to results.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Stage 1 Gemini error:", err);
        setFetchError("AI service currently busy. You can skip directly to your results.");
      })
      .finally(() => {
        if (isMounted) setLoadingQuestions(false);
      });

    return () => {
      isMounted = false;
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
    setStage2Status("Connecting to Gemini 2.5 Flash...");
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
      // Fallback: Proceed to results anyway so student is not blocked
      setStep("results");
      router.push(`/assessment/results?session=${sessionId || ""}`);
    } finally {
      setSubmittingStage2(false);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto shadow-sm">
          <Loader2 className="w-8 h-8 text-[#0f766e] animate-spin" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-teal-700 bg-teal-50 border-teal-200 gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Stage 1: AI Diagnostic Layer
          </Badge>
          <h2 className="text-2xl font-extrabold text-[#0f2f38]">
            Analyzing Your Psychometric Profile
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Gemini is evaluating your borderline scores and preparing 3–5 targeted questions to fine-tune your degree match recommendations...
          </p>
        </div>
      </div>
    );
  }

  if (submittingStage2) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-amber-800 bg-amber-50 border-amber-200 gap-1.5 py-1 px-3">
            Stage 2: Live Market Grounding
          </Badge>
          <h2 className="text-2xl font-extrabold text-[#0f2f38]">
            Validating Against Pakistan&apos;s Job Market
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto font-medium text-teal-800">
            {stage2Status || "Enriching your profile with real-time industry insights..."}
          </p>
          <p className="text-xs text-slate-400 pt-2">
            Verifying Rozee.pk salary benchmarks and hiring trends...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <Card className="border-teal-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-900 via-[#0f2f38] to-slate-900 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="accent" className="gap-1.5 text-xs py-1 px-2.5">
              <Sparkles className="w-3.5 h-3.5" /> Stage 1 Diagnostic
            </Badge>
            <span className="text-xs text-teal-200 font-mono">
              {answeredCount} of {questions.length} answered
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-white pt-2">
            Targeted Follow-Up Questions
          </CardTitle>
          <CardDescription className="text-slate-300 text-sm">
            Your psychometric scores show close competition between top degree fields.
            Please answer these quick scenario questions so Gemini AI can validate your profile against live Pakistani market demand.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {fetchError && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipOrProceedWithoutAI}
                className="text-xs"
              >
                Skip to Results
              </Button>
            </div>
          )}

          {questions.map((q, qIdx) => {
            const selectedKey = followupAnswers[q.id];

            return (
              <div key={q.id} className="space-y-3 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-[#0f766e] text-xs font-bold shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h3 className="font-bold text-base text-[#0f2f38]">
                    {q.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-8">
                  {q.options.map((opt) => {
                    const isSelected = selectedKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? "border-[#0f766e] bg-teal-50/60 shadow-xs ring-1 ring-[#0f766e]"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? "bg-[#0f766e] text-white"
                              : "border border-slate-300 text-slate-500 bg-white"
                          }`}
                        >
                          {opt.key}
                        </div>
                        <div className="flex-1 text-xs leading-relaxed font-medium">
                          {opt.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={handleSkipOrProceedWithoutAI}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Skip to Psychometric Results
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!isAllAnswered || isPending}
              className="gap-2 bg-[#0f766e] hover:bg-[#0d635c] text-white font-bold px-6"
            >
              <span>Validate & See Verified Results</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

