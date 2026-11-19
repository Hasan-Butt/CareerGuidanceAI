import React, { Suspense } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

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
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-sm">
              PK
            </div>
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

        {/* Demo Org Badge */}
        <div className="p-4 border-t border-teal-800/40 text-xs">
          <div className="flex items-center gap-2 text-teal-200 mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="font-bold">Active Institutions</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="secondary" className="text-[10px] bg-teal-900/80 text-teal-200 border-teal-700">FAST-LAHORE</Badge>
            <Badge variant="secondary" className="text-[10px] bg-teal-900/80 text-teal-200 border-teal-700">LGS-DEMO</Badge>
            <Badge variant="secondary" className="text-[10px] bg-teal-900/80 text-teal-200 border-teal-700">COUNSEL-DEMO</Badge>
          </div>
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
              FastAPI + PostgreSQL
            </Badge>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">
          <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading dashboard...</div>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
