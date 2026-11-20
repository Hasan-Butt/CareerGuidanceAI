import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardGate } from "@/components/dashboard/DashboardGate";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Counsellor Portal & Analytics",
  description:
    "Institutional dashboard for cohort analytics and student degree advising.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Frosted Modern Sidebar */}
      <aside className="w-full md:w-64 bg-[#18395f]/95 backdrop-blur-2xl text-white flex flex-col shrink-0 border-r border-white/20 shadow-xl">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="PakCareer AI Logo"
              width={36}
              height={36}
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-white/40"
              priority
            />
            <div>
              <div className="font-extrabold text-base tracking-tight text-white leading-none">
                PakCareer <span className="text-blue-300">PAAS</span>
              </div>
              <div className="text-[10px] text-blue-200 font-semibold pt-1">
                Counsellor Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation wrapped in Suspense */}
        <DashboardNav />

        <div className="p-4 border-t border-white/10 text-xs text-blue-100 flex items-center gap-2 mt-auto">
          <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
          <span className="text-[11px] leading-tight">Only your institution&apos;s students are shown.</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/60 backdrop-blur-xl border-b border-white/80 py-3.5 px-6 flex items-center justify-between shadow-xs">
          <h1 className="text-base font-extrabold text-[#0f2942]">
            Institutional Career Guidance Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#2b64ab] bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60 shadow-2xs">
              FastAPI + SQL
            </span>
          </div>
        </header>

        <div className="p-4 sm:p-6 flex-1 overflow-auto">
          <Suspense fallback={<div className="py-20 text-center text-white font-bold">Loading dashboard...</div>}>
            <DashboardGate>{children}</DashboardGate>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
