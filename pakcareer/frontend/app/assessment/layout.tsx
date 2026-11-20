import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AssessmentHeader } from "@/components/assessment/AssessmentHeader";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Degree Assessment",
  description:
    "10-minute vocational interest assessment matching students against 7 Pakistani university degree families.",
};

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
            <Image
              src="/logo.png"
              alt="PakCareer AI Logo"
              width={34}
              height={34}
              className="w-8 h-8 rounded-lg object-cover shadow-xs border border-slate-200/60"
              priority
            />
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
