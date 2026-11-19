"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { StepProgressBar } from "./StepProgressBar";
import { WIZARD_STEPS, type WizardStep } from "@/lib/types";

function HeaderContent() {
  const pathname = usePathname();
  const stepMatch = pathname?.split("/")[2] as WizardStep;
  const currentStep: WizardStep = WIZARD_STEPS.includes(stepMatch)
    ? stepMatch
    : "landing";

  return <StepProgressBar currentStep={currentStep} />;
}

export function AssessmentHeader() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-white border-b border-slate-200 py-4 px-4 h-16" />
      }
    >
      <HeaderContent />
    </Suspense>
  );
}

