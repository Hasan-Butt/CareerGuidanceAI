"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListFilter, BarChart3, ChevronRight, GraduationCap, ExternalLink } from "lucide-react";

function NavContent() {
  const pathname = usePathname();

  const navItems = [
    { label: "Student Sessions", href: "/dashboard", icon: ListFilter },
    { label: "Cohort Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  return (
    <nav className="p-4 space-y-1.5 flex-1">
      <div className="text-[10px] uppercase font-bold text-blue-200/70 tracking-wider px-3 mb-2">
        Management
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-3 py-2.5 rounded-full text-xs sm:text-sm transition-all ${
              isActive
                ? "bg-[#2b64ab] text-white font-bold shadow-md shadow-blue-950/40"
                : "text-blue-100 hover:bg-white/10 hover:text-white font-semibold"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {isActive && <ChevronRight className="w-4 h-4" />}
          </Link>
        );
      })}

      <div className="pt-6">
        <div className="text-[10px] uppercase font-bold text-blue-200/70 tracking-wider px-3 mb-2">
          Assessment Flow
        </div>
        <Link
          href="/assessment/landing"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-full text-xs text-blue-200 hover:bg-white/10"
        >
          <div className="flex items-center gap-2 font-medium">
            <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
            <span>Student Assessment</span>
          </div>
          <ExternalLink className="w-3 h-3 text-blue-300" />
        </Link>
      </div>
    </nav>
  );
}

export function DashboardNav() {
  return (
    <Suspense fallback={<div className="p-4 space-y-2 flex-1 animate-pulse" />}>
      <NavContent />
    </Suspense>
  );
}
