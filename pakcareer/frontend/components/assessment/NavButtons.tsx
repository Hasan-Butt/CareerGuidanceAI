"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface NavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled = false,
  loading = false,
  showBack = true,
}: NavButtonsProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-slate-100/80 mt-8">
      {showBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-full bg-white/70 hover:bg-white text-slate-700 border border-white/90 px-5 py-2.5 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>
      ) : (
        <div />
      )}

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="rounded-full bg-[#2b64ab] hover:bg-[#1f4f8b] disabled:bg-slate-300 disabled:shadow-none text-white px-7 py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-900/20 transition cursor-pointer min-w-[130px] justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
