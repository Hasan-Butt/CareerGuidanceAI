"use client";

import React from "react";
import { WIZARD_STEPS, STEP_LABELS, type WizardStep } from "@/lib/types";

interface StepProgressBarProps {
  currentStep: WizardStep;
}

export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);
  const progressPercent = ((currentIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="w-full bg-white/45 backdrop-blur-xl border-b border-white/70 py-3 px-4 shadow-xs">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {/* Step indicator header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-white/70 px-3 py-1 rounded-full border border-white/90 shadow-2xs">
              Step {currentIndex + 1} of {WIZARD_STEPS.length}
            </span>
            <span className="text-xs font-extrabold text-[#2b64ab] bg-blue-50/80 px-3.5 py-1 rounded-full border border-blue-200/60 shadow-2xs">
              {STEP_LABELS[currentStep]}
            </span>
          </div>

          <span className="text-xs font-bold text-slate-600 hidden sm:inline">
            {Math.round(progressPercent)}% Completed
          </span>
        </div>

        {/* Frosted Progress Track */}
        <div className="h-2 w-full bg-white/50 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-white/80 shadow-2xs">
          <div
            className="h-full bg-gradient-to-r from-[#2b64ab] to-[#518ee0] rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Breadcrumb Steps Pill List */}
        <div className="hidden sm:flex items-center justify-between gap-1 text-[11px] font-semibold pt-0.5 overflow-x-auto">
          {WIZARD_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={step}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-[#2b64ab] text-white font-extrabold shadow-xs"
                    : isCompleted
                    ? "text-[#2b64ab] bg-white/50 border border-white/70 font-bold"
                    : "text-slate-500 bg-white/30"
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/20">
                  {idx + 1}
                </span>
                <span>{STEP_LABELS[step]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
