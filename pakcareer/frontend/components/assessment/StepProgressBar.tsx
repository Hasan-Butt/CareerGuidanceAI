"use client";

import React from "react";
import { WIZARD_STEPS, STEP_LABELS, type WizardStep } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface StepProgressBarProps {
  currentStep: WizardStep;
}

export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);
  const progressPercent = ((currentIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="w-full bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Step {currentIndex + 1} of {WIZARD_STEPS.length}</span>
          <span className="text-[#0f766e]">{STEP_LABELS[currentStep]}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="hidden sm:flex justify-between mt-2 text-[11px] text-slate-400 font-medium">
          {WIZARD_STEPS.map((s, idx) => (
            <span
              key={s}
              className={
                idx <= currentIndex
                  ? "text-[#0f766e] font-semibold"
                  : "text-slate-400"
              }
            >
              {STEP_LABELS[s]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

