import React, { Suspense } from "react";
import Link from "next/link";
import { AssessmentHeader } from "@/components/assessment/AssessmentHeader";
import { Users } from "lucide-react";

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f766e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              PK
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#0f2f38] text-base leading-tight">
                PakCareer <span className="text-[#0f766e]">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Degree Guidance System
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0f766e] transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Counsellor Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Bar Header */}
      <AssessmentHeader />

      {/* Wizard Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
        <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading step...</div>}>
          {children}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 PakCareer AI. Grounded in Holland RIASEC psychometrics and calibrated for Pakistani education.</p>
      </footer>
    </div>
  );
}
