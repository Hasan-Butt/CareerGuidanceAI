"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAssessmentStore } from "@/lib/store";
import { fetchSession, fetchPdfUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Download,
  Share2,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  Search,
  SlidersHorizontal,
  Heart,
  MoreVertical,
  Bell,
  ArrowUpRight,
  ArrowLeft,
  Bookmark,
  MapPin,
  Briefcase,
  GraduationCap,
  Building2,
  Compass,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SessionRecord } from "@/lib/types";

const HOUSE_DESCRIPTIONS: Record<string, { desc: string; degrees: string[]; careers: string[]; company: string; logoText: string; logoBg: string }> = {
  "Computer Science & IT": {
    desc: "Join top technology companies as a Software Developer, AI/ML specialist, or cloud architect building cutting-edge digital infrastructure.",
    degrees: ["BS Computer Science", "BS Software Engineering", "BS Artificial Intelligence", "BS Data Science"],
    careers: ["Full-Stack Engineer", "AI/ML Developer", "Cloud Architect", "Product Manager"],
    company: "Google / Systems Limited",
    logoText: "G",
    logoBg: "bg-blue-50 text-blue-600 border-blue-200",
  },
  "Engineering": {
    desc: "Apply advanced physics and mathematical principles to design intelligent mechanical systems, energy grids, and mechatronic devices.",
    degrees: ["BSc Electrical Engineering", "BSc Mechanical Engineering", "BSc Civil Engineering", "BSc Mechatronics"],
    careers: ["Power Systems Engineer", "Embedded Hardware Designer", "Project Manager", "Robotics Specialist"],
    company: "Engro / PARCO / NUST",
    logoText: "E",
    logoBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "Medicine & Health": {
    desc: "Dedicated to clinical patient diagnostics, surgical innovation, pharmacotherapy, and biomedical healthcare leadership.",
    degrees: ["MBBS", "BDS", "Pharm-D", "Doctor of Physical Therapy (DPT)", "BS Nursing"],
    careers: ["Medical Doctor", "Dentist", "Clinical Pharmacist", "Healthcare Administrator"],
    company: "Aga Khan / Shaukat Khanum",
    logoText: "M",
    logoBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "Business & Commerce": {
    desc: "Drive strategic market ventures, fintech products, corporate valuation, supply chain networks, and venture capital operations.",
    degrees: ["BBA", "BS Accounting & Finance", "BS Fintech", "BS Supply Chain Management"],
    careers: ["Financial Analyst", "Marketing Strategist", "Investment Banker", "Operations Lead"],
    company: "HBL / Unilever / LUMS",
    logoText: "B",
    logoBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  "Arts, Humanities & Social Sciences": {
    desc: "Lead creative media production, organizational psychology, public diplomacy, constitutional governance, and digital UX design.",
    degrees: ["BS Media Studies", "BS Psychology", "BS International Relations", "BFA Visual Communication"],
    careers: ["Digital Content Director", "Organizational Psychologist", "Policy Analyst", "UX Designer"],
    company: "UNDP / Dawn Media",
    logoText: "A",
    logoBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  "Pure Sciences": {
    desc: "Conduct foundational mathematical breakthroughs, quantum physics investigations, biotechnology assays, and actuarial modeling.",
    degrees: ["BS Mathematics", "BS Physics", "BS Biotechnology", "BS Chemistry"],
    careers: ["Research Scientist", "Biostatistician", "Actuary", "Lab Director"],
    company: "PAEC / PCSIR",
    logoText: "S",
    logoBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  "Law": {
    desc: "Advocate constitutional law, enterprise compliance, international trade agreements, dispute resolution, and judiciary reform.",
    degrees: ["LLB (5 Years)", "BS Criminology", "BA-LLB"],
    careers: ["Advocate High Court", "Corporate Counsel", "Civil Judge", "Compliance Officer"],
    company: "Supreme Court / Corporate Law",
    logoText: "L",
    logoBg: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const HOUSE_COLORS: Record<string, string> = {
  "Computer Science & IT": "#2b64ab",
  "Engineering": "#0284c7",
  "Medicine & Health": "#059669",
  "Business & Commerce": "#d97706",
  "Arts, Humanities & Social Sciences": "#7c3aed",
  "Pure Sciences": "#4f46e5",
  "Law": "#c45c26",
};

export function ResultsStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam = searchParams?.get("session");

  const {
    sessionId: storeSessionId,
    top3: storeTop3,
    allResults: storeAllResults,
    profile: storeProfile,
    geminiEnrichment,
    reset,
  } = useAssessmentStore();

  const [activeTab, setActiveTab] = useState<string>("matches");
  const [sessionData, setSessionData] = useState<SessionRecord | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetailHouse, setSelectedDetailHouse] = useState<string | null>(null);
  const [savedFavorites, setSavedFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sessionParam && (!storeSessionId || storeSessionId !== sessionParam)) {
      setLoadingSession(true);
      fetchSession(sessionParam)
        .then((data) => setSessionData(data))
        .catch((err) => console.error("Error fetching session:", err))
        .finally(() => setLoadingSession(false));
    }
  }, [sessionParam, storeSessionId]);

  const effectiveSessionId = sessionParam || storeSessionId;
  const top3 = sessionData ? sessionData.top3 : storeTop3;
  const allResults = sessionData ? sessionData.all_results : storeAllResults;
  const profile = sessionData ? sessionData.profile : storeProfile;

  const handleRetake = () => {
    reset();
    router.push("/assessment/landing");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleFavorite = (house: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedFavorites((prev) => ({ ...prev, [house]: !prev[house] }));
  };

  if (loadingSession) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#2b64ab] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white font-bold text-sm drop-shadow-xs">Loading assessment results...</p>
      </div>
    );
  }

  if (!top3 || top3.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-[32px] p-8 text-center space-y-5 shadow-xl">
          <h2 className="text-2xl font-extrabold text-[#0f2942]">No Assessment Found</h2>
          <p className="text-slate-600 text-sm">
            Please complete the assessment to view your degree match recommendations.
          </p>
          <button
            type="button"
            onClick={() => router.push("/assessment/landing")}
            className="w-full bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full py-3.5 px-6 font-bold text-sm shadow-md transition cursor-pointer"
          >
            Start Assessment ↗
          </button>
        </div>
      </div>
    );
  }

  const primaryMatch = top3[0];
  const hasGemini = !!geminiEnrichment;

  // Selected house for Detail Modal (matches the Right Screen)
  const detailMeta = selectedDetailHouse ? HOUSE_DESCRIPTIONS[selectedDetailHouse] : null;
  const detailMarket = selectedDetailHouse ? geminiEnrichment?.market_data?.[selectedDetailHouse] : null;
  const detailNarrative = selectedDetailHouse ? geminiEnrichment?.narratives?.[selectedDetailHouse] : null;
  const detailResult = selectedDetailHouse ? allResults.find((r) => r.house === selectedDetailHouse) : null;

  const filteredResults = allResults.filter((h) =>
    h.house.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 px-2 sm:px-4">
      {/* ── TOP HEADER (matching Middle Screen in reference) ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/90 shadow-md relative bg-blue-100">
            <Image
              src="/avatar-user.png"
              alt="User Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/90 font-bold drop-shadow-xs">
              <span>Hey 👋</span>
            </div>
            <span className="text-[11px] font-semibold text-white/75">
              Dream Career Found
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {effectiveSessionId && (
            <span className="hidden sm:inline text-[10px] font-mono font-bold text-white/80 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/30">
              ID: {effectiveSessionId.slice(0, 8)}
            </span>
          )}
          <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-md border border-white/50 flex items-center justify-center text-white shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Headline */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
          Hey, Discover <br />
          <span className="text-[#0f2942]">New Job Matches</span>
        </h1>
      </div>

      {/* ── GLASS SEARCH & FILTER BAR (matching Middle Screen) ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-full p-2 shadow-lg shadow-blue-900/10 flex items-center gap-2">
        <div className="pl-3 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search degree or career..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        <div className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-xs">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* AI Market Validation Banner */}
      {hasGemini && geminiEnrichment.validation_summary && (
        <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-[24px] p-4 text-xs text-[#0f2942] space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5 font-bold text-[#2b64ab]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Job Market Grounding Verified</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            {geminiEnrichment.validation_summary}
          </p>
        </div>
      )}

      {/* Quick Action Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === "matches"
                ? "bg-[#2b64ab] text-white shadow-md shadow-blue-900/20"
                : "bg-white/50 text-slate-700 hover:bg-white/80 border border-white/70"
            }`}
          >
            Job & Degree Matches
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#2b64ab] text-white shadow-md shadow-blue-900/20"
                : "bg-white/50 text-slate-700 hover:bg-white/80 border border-white/70"
            }`}
          >
            Psychometrics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("careers")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === "careers"
                ? "bg-[#2b64ab] text-white shadow-md shadow-blue-900/20"
                : "bg-white/50 text-slate-700 hover:bg-white/80 border border-white/70"
            }`}
          >
            Pakistan Outlook
          </button>
        </div>

        <div className="flex items-center gap-2">
          {effectiveSessionId && (
            <a
              href={fetchPdfUrl(effectiveSessionId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/70 hover:bg-white border border-white/80 text-[#0f2942] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#2b64ab]" />
                <span>PDF Report</span>
              </button>
            </a>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/70 hover:bg-white border border-white/80 text-[#0f2942] flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#2b64ab]" />
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT 1: EXACT MATCH CARDS (matching Middle Screen) ── */}
      {activeTab === "matches" && (
        <div className="space-y-4 pt-1">
          {filteredResults.map((item, idx) => {
            const meta = HOUSE_DESCRIPTIONS[item.house] || {
              company: "National Employers",
              logoText: "🎓",
              logoBg: "bg-blue-50 text-blue-600 border-blue-200",
              desc: "Accredited higher education track in Pakistan.",
              degrees: ["BS Degree Track"],
              careers: ["Specialist"],
            };

            const adjustedInfo = geminiEnrichment?.adjusted_ranking.find(
              (a) => a.house.toLowerCase() === item.house.toLowerCase()
            );
            const market = geminiEnrichment?.market_data?.[item.house];
            const isSaved = !!savedFavorites[item.house];
            const isTopMatch = idx === 0;

            // Formatted salary string
            const salaryDisplay = market?.avg_salary_pkr
              ? `PKR ${market.avg_salary_pkr.split("–")[0]}k`
              : isTopMatch ? "PKR 150k" : "PKR 110k";

            return (
              <div
                key={item.house}
                onClick={() => setSelectedDetailHouse(item.house)}
                className="group relative bg-white/85 hover:bg-white/95 backdrop-blur-xl border border-white/80 rounded-[28px] p-5 sm:p-6 shadow-[0_12px_36px_-12px_rgba(20,50,90,0.12)] space-y-4 transition-all duration-200 hover:shadow-[0_18px_44px_-10px_rgba(20,50,90,0.18)] cursor-pointer"
              >
                {/* Card Top Row: Logo + Company Name + Heart + Dots (Exact from image) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base border shadow-xs ${meta.logoBg}`}
                    >
                      {meta.logoText}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm sm:text-base text-[#0f2942]">
                        {meta.company}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Pakistan · Tier-1 Universities</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(item.house, e)}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition cursor-pointer ${
                        isSaved
                          ? "bg-rose-50 border-rose-200 text-rose-500"
                          : "bg-white/70 border-slate-200 text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailHouse(item.house);
                      }}
                      className="w-8 h-8 rounded-full bg-white/70 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Card Title (exact typography style from reference) */}
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-[#0f2942] leading-snug">
                    {item.house}
                  </h3>
                  {meta.careers[0] && (
                    <span className="text-xs font-semibold text-slate-500 block pt-0.5">
                      Career Track: {meta.careers[0]}
                    </span>
                  )}
                </div>

                {/* Filter Pills Row (matching: SF/Remote, Full time, Engineer Pro) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs font-medium text-slate-600 bg-white/80 border border-slate-200/80 px-3 py-1 rounded-full shadow-2xs">
                    {meta.degrees[0] || "BS Degree"}
                  </span>
                  <span className="text-xs font-medium text-slate-600 bg-white/80 border border-slate-200/80 px-3 py-1 rounded-full shadow-2xs">
                    Full time · 4 Years
                  </span>
                  <span className="text-xs font-bold text-[#2b64ab] bg-blue-50/80 border border-blue-200/80 px-3 py-1 rounded-full shadow-2xs">
                    {item.probability}% Psychometric Match
                  </span>
                  {adjustedInfo?.adjusted_confidence !== undefined && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-50/80 border border-amber-200/80 px-3 py-1 rounded-full shadow-2xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {adjustedInfo.adjusted_confidence}% AI-Verified
                    </span>
                  )}
                </div>

                {/* Bottom Row: Salary + Applicant Avatars + See Details Pill Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <div className="text-xl sm:text-2xl font-extrabold text-[#2b64ab] tracking-tight">
                      {salaryDisplay}
                      <span className="text-xs font-semibold text-slate-500"> /Month</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <div className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-blue-400" />
                        <div className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-sky-400" />
                        <div className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-amber-400" />
                      </div>
                      <span>
                        {market?.rozee_openings ? `${market.rozee_openings} Jobs` : "20+ Apply"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailHouse(item.house);
                    }}
                    className="bg-[#2b64ab] group-hover:bg-[#1f4f8b] text-white rounded-full py-2.5 px-5 text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>See Details</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB CONTENT 2: PSYCHOMETRIC PROFILE ── */}
      {activeTab === "profile" && profile && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Holland Code
              </span>
              <div className="text-3xl font-extrabold text-[#2b64ab] font-mono">
                {profile.holland_code}
              </div>
              <p className="text-xs text-slate-500">Top 3 dominant orientations</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Differentiation
              </span>
              <div className="text-3xl font-extrabold text-[#0f2942]">
                {profile.differentiation}
              </div>
              <p className="text-xs text-slate-500">Profile clarity benchmark</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Norms Calibration
              </span>
              <div className="text-3xl font-extrabold text-emerald-700">
                100k+ PK
              </div>
              <p className="text-xs text-slate-500">Validated student cohort</p>
            </div>
          </div>

          {/* RIASEC Chart */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-md space-y-4">
            <h3 className="font-extrabold text-base text-[#0f2942]">
              Holland RIASEC Interest Dimensions (1.0 to 5.0)
            </h3>
            <div className="space-y-3">
              {Object.entries(profile.riasec).map(([code, val]) => {
                const pct = ((val - 1) / 4) * 100;
                return (
                  <div key={code} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{code} — {code === "R" ? "Realistic" : code === "I" ? "Investigative" : code === "A" ? "Artistic" : code === "S" ? "Social" : code === "E" ? "Enterprising" : "Conventional"}</span>
                      <span className="font-mono text-[#2b64ab]">{val.toFixed(2)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2b64ab] to-[#4c87d4] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All 7 Houses Model Distribution */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-md space-y-4">
            <h3 className="font-extrabold text-base text-[#0f2942]">
              All 7 Degree Families XGBoost Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={allResults} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 45]} unit="%" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis dataKey="house" type="category" width={160} tick={{ fontSize: 11, fill: "#0f2942" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Bar dataKey="probability" radius={[0, 8, 8, 0]}>
                    {allResults.map((entry) => (
                      <Cell key={entry.house} fill={HOUSE_COLORS[entry.house] || "#2b64ab"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: CAREERS & PAKISTAN OUTLOOK ── */}
      {activeTab === "careers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {top3.map((m) => {
              const meta = HOUSE_DESCRIPTIONS[m.house];
              if (!meta) return null;
              return (
                <div
                  key={m.house}
                  className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{m.emoji}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0f2942]">{m.house}</h4>
                      <span className="text-xs font-bold text-[#2b64ab]">{m.probability}% match</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#2b64ab]" /> Top Degrees in Pakistan:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 pl-1">
                      {meta.degrees.slice(0, 3).map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-amber-600" /> Emerging Career Roles:
                    </span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {meta.careers.map((c) => (
                        <span key={c} className="text-[10px] font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-5 border border-white/80 space-y-2 text-xs text-slate-700 shadow-xs">
            <h4 className="font-extrabold text-[#0f2942] text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#2b64ab]" />
              Pakistan Higher Education & Hiring Outlook (Rozee.pk / HEC 2025)
            </h4>
            <p className="leading-relaxed">
              Software Engineering and Computer Science remain Pakistan&apos;s fastest growing compensation tracks for fresh university graduates in tier-1 tech hubs (Lahore, Karachi, Islamabad), with starting medians ranging from PKR 120,000 to PKR 180,000+.
            </p>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL (Exact Replica of Right Screen "Job Details") ── */}
      {selectedDetailHouse && detailMeta && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-[36px] overflow-hidden bg-gradient-to-b from-[#87a9ca] via-[#9bb9d4] to-[#bed3e8] border border-white/80 shadow-[0_24px_60px_-15px_rgba(20,50,90,0.35)] p-5 sm:p-6 flex flex-col justify-between max-h-[92vh] overflow-y-auto space-y-4">
            {/* Top Navigation Row: Back Button < | Title "Job Details" | Menu ... */}
            <div className="flex items-center justify-between text-white pb-1">
              <button
                type="button"
                onClick={() => setSelectedDetailHouse(null)}
                className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/40 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Job & Degree Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedDetailHouse(null)}
                className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/40 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Centered Logo in Glass Circle & Title (Exact from right screen) */}
            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 rounded-full bg-white/90 border-2 border-white shadow-md mx-auto flex items-center justify-center text-2xl font-extrabold text-[#2b64ab]">
                {detailMeta.logoText}
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                {selectedDetailHouse}
              </h3>
              <div className="flex items-center justify-center gap-1.5 text-xs text-white/90 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>Pakistan · Tier-1 Universities</span>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                  Full time
                </span>
                <span className="text-[11px] font-semibold text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                  4 Years HEC Track
                </span>
                <span className="text-[11px] font-bold text-white bg-[#2b64ab] px-3 py-1 rounded-full shadow-xs">
                  {detailResult ? `${detailResult.probability}% Match` : "Top Pick"}
                </span>
              </div>
            </div>

            {/* White Rounded Detail Card (Exact from right screen) */}
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[28px] p-5 space-y-4 shadow-lg text-[#0f2942]">
              {/* Card Title & Salary */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-base text-[#0f2942]">
                    {selectedDetailHouse}
                  </h4>
                  <div className="text-xl font-extrabold text-[#2b64ab]">
                    {detailMarket?.avg_salary_pkr ? `PKR ${detailMarket.avg_salary_pkr.split("–")[0]}k` : "PKR 150k"}
                    <span className="text-xs font-normal text-slate-500"> /Month</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2b64ab]">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>

              {/* Description Jobs */}
              <div className="space-y-1.5 text-xs">
                <h5 className="font-extrabold text-[#0f2942] uppercase tracking-wider text-[11px]">
                  Description
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  {detailNarrative || detailMeta.desc}
                </p>
              </div>

              {/* Job Qualification / Top Degrees */}
              <div className="space-y-2 text-xs">
                <h5 className="font-extrabold text-[#0f2942] uppercase tracking-wider text-[11px]">
                  Top Degree Programs
                </h5>
                <ul className="space-y-1 text-slate-600">
                  {detailMeta.degrees.map((d) => (
                    <li key={d} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2b64ab]" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Emerging Career Roles */}
              <div className="space-y-1.5 text-xs">
                <h5 className="font-extrabold text-[#0f2942] uppercase tracking-wider text-[11px]">
                  Emerging Roles in Pakistan
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {detailMeta.careers.map((c) => (
                    <span key={c} className="text-[10px] font-bold text-[#2b64ab] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Employers if available */}
              {detailMarket?.top_companies && (
                <div className="space-y-1 text-xs">
                  <h5 className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                    Top Hiring Employers
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {detailMarket.top_companies.map((comp) => (
                      <span key={comp} className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Primary Pill CTA (Exact from image: "Apply for this job ↗") */}
            <div className="pt-2">
              {effectiveSessionId ? (
                <a
                  href={fetchPdfUrl(effectiveSessionId)}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <button
                    type="button"
                    className="w-full bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full py-4 px-6 font-bold text-sm shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Download Full Parents Report</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDetailHouse(null)}
                  className="w-full bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full py-4 px-6 font-bold text-sm shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Explore Degree Pathways</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Retake Button Footer */}
      <div className="text-center pt-2 pb-6">
        <button
          type="button"
          onClick={handleRetake}
          className="text-xs font-semibold text-white/80 hover:text-white underline decoration-white/40 cursor-pointer inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake Full Psychometric Assessment</span>
        </button>
      </div>
    </div>
  );
}
