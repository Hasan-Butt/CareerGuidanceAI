import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AssessmentHeader } from "@/components/assessment/AssessmentHeader";
import { Users, ArrowUpRight } from "lucide-react";

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
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Frosted Glass Navigation */}
      <header className="bg-white/50 backdrop-blur-xl border-b border-white/70 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="PakCareer AI Logo"
              width={34}
              height={34}
              className="w-8 h-8 rounded-full object-cover shadow-xs border border-white/80"
              priority
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-[#0f2942] text-base leading-tight tracking-tight">
                PakCareer <span className="text-[#2b64ab]">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                Degree Guidance System
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/60 hover:bg-white px-3.5 py-1.5 rounded-full border border-white/80 shadow-2xs transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#2b64ab]" />
              <span>Counsellor Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Bar Header */}
      <AssessmentHeader />

      {/* Wizard Content */}
      <main className="flex-1 px-3 sm:px-6 py-6 max-w-6xl mx-auto w-full">
        <Suspense fallback={<div className="py-20 text-center text-white font-bold">Loading step...</div>}>
          {children}
        </Suspense>
      </main>

      {/* Frosted Glass Footer */}
      <footer className="border-t border-white/60 bg-white/40 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-600 mt-auto">
        <p className="font-medium">© 2026 PakCareer AI. Grounded in Holland RIASEC psychometrics and calibrated for Pakistani education.</p>
      </footer>
    </div>
  );
}
