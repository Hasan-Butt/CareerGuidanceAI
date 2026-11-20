"use client";

import React, { use, Suspense } from "react";
import { notFound } from "next/navigation";
import { LandingStep } from "@/components/assessment/LandingStep";
import { AboutStep } from "@/components/assessment/AboutStep";
import { RiasecStep } from "@/components/assessment/RiasecStep";
import { TipiStep } from "@/components/assessment/TipiStep";
import { VocabStep } from "@/components/assessment/VocabStep";
import { FollowupStep } from "@/components/assessment/FollowupStep";
import { ResultsStep } from "@/components/assessment/ResultsStep";

interface PageProps {
  params: Promise<{ step: string }>;
}

export default function AssessmentStepPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const step = resolvedParams.step;

  switch (step) {
    case "landing":
      return <LandingStep />;
    case "about":
      return <AboutStep />;
    case "riasec":
      return (
        <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading questions...</div>}>
          <RiasecStep />
        </Suspense>
      );
    case "tipi":
      return <TipiStep />;
    case "vocab":
      return <VocabStep />;
    case "followup":
      return (
        <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading AI follow-up...</div>}>
          <FollowupStep />
        </Suspense>
      );
    case "results":
      return (
        <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading results...</div>}>
          <ResultsStep />
        </Suspense>
      );
    default:
      notFound();
  }
}
