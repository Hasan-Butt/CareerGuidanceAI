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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0f2f38] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-teal-800/40">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="PakCareer AI Logo"
              width={36}
              height={36}
              className="w-9 h-9 rounded-lg object-cover shadow-xs border border-teal-700/50"
              priority
            />
            <div>
              <div className="font-extrabold text-base tracking-tight text-white leading-none">
                PakCareer <span className="text-teal-400">PAAS</span>
              </div>
              <div className="text-[10px] text-teal-300 font-medium">
                Counsellor Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation wrapped in Suspense */}
        <DashboardNav />

        <div className="p-4 border-t border-teal-800/40 text-xs text-teal-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Only your institution&apos;s students are shown.</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex items-center justify-between">
          <h1 className="text-base font-bold text-[#0f2f38]">
            Institutional Career Guidance Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              FastAPI + SQL
            </Badge>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">
          <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading dashboard...</div>}>
            <DashboardGate>{children}</DashboardGate>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
