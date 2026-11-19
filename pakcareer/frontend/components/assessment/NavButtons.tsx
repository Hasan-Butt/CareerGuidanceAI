"use client";

import React from "react";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
      {showBack && onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Button>
      ) : (
        <div />
      )}

      {onNext && (
        <Button
          type="button"
          variant="default"
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="gap-2 min-w-[140px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

