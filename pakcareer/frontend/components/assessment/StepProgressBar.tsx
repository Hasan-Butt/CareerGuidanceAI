"use client";

import React from "react";
import { WIZARD_STEPS, STEP_LABELS, type WizardStep } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from "next/image";

interface StepProgressBarProps {
  currentStep: WizardStep;
}

export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);
  const progressPercent = ((currentIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="w-full bg-white/40 backdrop-blur-xl border-b border-white/60 py-3.5 px-4 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="PakCareer AI"
              width={28}
              height={28}
              className="w-7 h-7 rounded-lg object-cover shadow-xs border border-white/80"
            />
            <span className="font-extrabold text-[#0f2942] text-sm tracking-tight hidden sm:inline">
              PakCareer <span className="text-[#2b64ab]">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-white/60 px-2.5 py-0.5 rounded-full border border-white/80">
              Step {currentIndex + 1} of {WIZARD_STEPS.length}
            </span>
            <span className="text-xs font-bold text-[#2b64ab] bg-blue-50/70 px-3 py-1 rounded-full border border-blue-200/50">
              {STEP_LABELS[currentStep]}
            </span>
          </div>
        </div>

        <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden p-0.5 border border-white/60">
          <div
            className="h-full bg-gradient-to-r from-[#2b64ab] to-[#4c87d4] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
