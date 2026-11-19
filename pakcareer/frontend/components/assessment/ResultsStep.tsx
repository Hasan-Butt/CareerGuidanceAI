"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { fetchSession, fetchPdfUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Download,
  Share2,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  GraduationCap,
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

const HOUSE_DESCRIPTIONS: Record<string, { desc: string; degrees: string[]; careers: string[] }> = {
  "Computer Science & IT": {
    desc: "Focuses on software engineering, artificial intelligence, cybersecurity, databases, and digital infrastructure.",
    degrees: ["BS Computer Science", "BS Software Engineering", "BS Artificial Intelligence", "BS Data Science"],
    careers: ["Full-Stack Engineer", "AI/ML Developer", "Cloud Architect", "Product Manager"],
  },
  "Engineering": {
    desc: "Applies physics and mathematical principles to design machines, structures, electrical systems, and chemical processes.",
    degrees: ["BSc Electrical Engineering", "BSc Mechanical Engineering", "BSc Civil Engineering", "BSc Mechatronics"],
    careers: ["Power Systems Engineer", "Embedded Hardware Designer", "Project Manager", "Robotics Specialist"],
  },
  "Medicine & Health": {
    desc: "Dedicated to human health, diagnostics, surgery, pharmacological care, and biomedical innovation.",
    degrees: ["MBBS", "BDS", "Pharm-D", "Doctor of Physical Therapy (DPT)", "BS Nursing"],
    careers: ["Medical Doctor", "Dentist", "Clinical Pharmacist", "Healthcare Administrator"],
  },
  "Business & Commerce": {
    desc: "Focuses on enterprise management, financial analysis, marketing, supply chain, and entrepreneurial ventures.",
    degrees: ["BBA", "BS Accounting & Finance", "BS Fintech", "BS Supply Chain Management"],
    careers: ["Financial Analyst", "Marketing Strategist", "Investment Banker", "Operations Lead"],
  },
  "Arts, Humanities & Social Sciences": {
    desc: "Explores human culture, media communication, psychology, international relations, literature, and design.",
    degrees: ["BS Media Studies", "BS Psychology", "BS International Relations", "BFA Visual Communication"],
    careers: ["Digital Content Director", "Organizational Psychologist", "Policy Analyst", "UX Designer"],
  },
  "Pure Sciences": {
    desc: "Fundamental exploration of natural phenomena through mathematics, physics, chemistry, and biological sciences.",
    degrees: ["BS Mathematics", "BS Physics", "BS Biotechnology", "BS Chemistry"],
    careers: ["Research Scientist", "Biostatistician", "Actuary", "Lab Director"],
  },
  "Law": {
    desc: "Examines legal frameworks, constitutional governance, corporate compliance, and human rights advocacy.",
    degrees: ["LLB (5 Years)", "BS Criminology", "BA-LLB"],
    careers: ["Advocate High Court", "Corporate Counsel", "Civil Judge", "Compliance Officer"],
  },
};

const HOUSE_COLORS: Record<string, string> = {
  "Computer Science & IT": "#0f766e",
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
    reset,
  } = useAssessmentStore();

  const [activeTab, setActiveTab] = useState<string>("matches");
  const [sessionData, setSessionData] = useState<SessionRecord | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // If page is loaded with ?session=XYZ and store doesn't have it, fetch from API
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

  if (loadingSession) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">Loading assessment results...</p>
      </div>
    );
  }

  if (!top3 || top3.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">No Assessment Found</h2>
        <p className="text-slate-600 text-sm">
          Please complete the assessment to view your degree match recommendations.
        </p>
        <Button onClick={() => router.push("/assessment/landing")}>
          Start Assessment
        </Button>
      </div>
    );
  }

  const primaryMatch = top3[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Top Banner Card */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-900 via-[#0f2f38] to-slate-900 text-white overflow-hidden shadow-lg">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 border border-teal-400/30 text-teal-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              Machine Learning Prediction Complete
            </div>
            {effectiveSessionId && (
              <span className="text-xs text-slate-400 font-mono">
                Session ID: {effectiveSessionId.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-teal-300 text-sm font-semibold uppercase tracking-wider">
              Your #1 Recommended Degree Family
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-4xl">{primaryMatch.emoji}</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {primaryMatch.house}
              </h1>
              <Badge variant="accent" className="text-sm px-3 py-1">
                {primaryMatch.probability}% Match
              </Badge>
            </div>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl pt-1 leading-relaxed">
              {HOUSE_DESCRIPTIONS[primaryMatch.house]?.desc ||
                "A strong alignment based on your vocational interests and psychometric profile."}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-teal-800/60">
            {effectiveSessionId && (
              <a
                href={fetchPdfUrl(effectiveSessionId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button variant="default" className="gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold">
                  <Download className="w-4 h-4" />
                  Download Parents PDF Report
                </Button>
              </a>
            )}

            <Button
              variant="outline"
              onClick={handleShare}
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Link Copied!" : "Share Results"}
            </Button>

            <Button
              variant="ghost"
              onClick={handleRetake}
              className="gap-2 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 p-1.5 h-auto">
          <TabsTrigger value="matches" className="py-2.5 text-xs sm:text-sm">
            Top Degree Matches
          </TabsTrigger>
          <TabsTrigger value="profile" className="py-2.5 text-xs sm:text-sm">
            Psychometric Profile
          </TabsTrigger>
          <TabsTrigger value="careers" className="py-2.5 text-xs sm:text-sm">
            Careers & Pakistan Outlook
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: MATCHES ── */}
        <TabsContent value="matches" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((res, idx) => (
              <Card
                key={res.house}
                className={`relative transition-all ${
                  idx === 0
                    ? "border-teal-500 shadow-md ring-2 ring-teal-500/20"
                    : "border-slate-200 shadow-xs"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{res.emoji}</span>
                    <Badge
                      variant={idx === 0 ? "default" : "secondary"}
                      className="font-bold text-xs"
                    >
                      Rank #{idx + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-[#0f2f38] pt-2">
                    {res.house}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Model Confidence</span>
                      <span className="text-[#0f766e]">{res.probability}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0f766e] rounded-full"
                        style={{ width: `${res.probability}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3">
                    {HOUSE_DESCRIPTIONS[res.house]?.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All 7 Houses Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0f2f38]">
                All 7 Degree Families Comparison
              </CardTitle>
              <CardDescription>
                Full distribution of your machine learning classification probabilities across all Pakistani higher education tracks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={allResults}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      domain={[0, 40]}
                      unit="%"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      dataKey="house"
                      type="category"
                      width={170}
                      tick={{ fontSize: 11, fill: "#334155" }}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [
                        `${typeof val === 'number' ? val : Number(val)}% match probability`,
                        "Confidence",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="probability" radius={[0, 6, 6, 0]}>
                      {allResults.map((entry: { house: string; probability: number }) => (
                        <Cell
                          key={`cell-${entry.house}`}
                          fill={HOUSE_COLORS[entry.house] || "#0f766e"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: PSYCHOMETRIC PROFILE ── */}
        <TabsContent value="profile" className="space-y-6 pt-4">
          {profile && (
            <>
              {/* Holland Summary Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-teal-200 bg-teal-50/40">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Holland Code
                    </span>
                    <div className="text-3xl font-extrabold text-[#0f766e] font-mono">
                      {profile.holland_code}
                    </div>
                    <p className="text-xs text-slate-600">
                      Top 3 interest orientations in order of dominance
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Differentiation
                    </span>
                    <div className="text-3xl font-extrabold text-[#0f2f38]">
                      {profile.differentiation}
                    </div>
                    <p className="text-xs text-slate-500">
                      Scale sharpness ({profile.differentiation > 2.0 ? "High focus" : "Balanced profile"})
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Benchmark Cohort
                    </span>
                    <div className="text-3xl font-extrabold text-[#0f2f38]">
                      PK Norms
                    </div>
                    <p className="text-xs text-slate-500">
                      Calibrated against 100k+ validated responses
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* RIASEC Domain Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-[#0f2f38]">
                    Holland RIASEC Interest Dimensions (1.0 to 5.0)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(profile.riasec).map(([code, val]) => {
                    const pct = ((val - 1) / 4) * 100;
                    return (
                      <div key={code} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>
                            <strong className="text-[#0f766e] font-mono mr-1">
                              {code}
                            </strong>
                            {code === "R" && "Realistic (Hands-on / Tools)"}
                            {code === "I" && "Investigative (Analytical / Science)"}
                            {code === "A" && "Artistic (Creative / Expression)"}
                            {code === "S" && "Social (Helping / Teaching)"}
                            {code === "E" && "Enterprising (Leadership / Business)"}
                            {code === "C" && "Conventional (Organized / Data)"}
                          </span>
                          <span className="font-mono">{val.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0f766e] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Big Five Personality Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-[#0f2f38]">
                    Big Five Personality Dimensions (1.0 to 7.0)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(profile.big_five).map(([trait, score]) => {
                    const pct = ((score - 1) / 6) * 100;
                    return (
                      <div key={trait} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{trait}</span>
                          <span className="font-mono">{score.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── TAB 3: CAREERS & PAKISTAN OUTLOOK ── */}
        <TabsContent value="careers" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {top3.map((match) => {
              const meta = HOUSE_DESCRIPTIONS[match.house];
              if (!meta) return null;

              return (
                <Card key={match.house} className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{match.emoji}</span>
                      <div>
                        <CardTitle className="text-base font-bold text-[#0f2f38]">
                          {match.house}
                        </CardTitle>
                        <span className="text-xs font-semibold text-[#0f766e]">
                          {match.probability}% alignment
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                        <GraduationCap className="w-4 h-4 text-[#0f766e]" />
                        Top University Degrees in Pakistan
                      </h4>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        {meta.degrees.map((deg) => (
                          <li key={deg}>{deg}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                        <Briefcase className="w-4 h-4 text-[#c45c26]" />
                        Emerging Career Roles
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.careers.map((c) => (
                          <Badge key={c} variant="outline" className="text-[11px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pakistan Market Context Summary */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0f766e]" />
                Pakistan Tech & Degree Market Outlook (Rozee.pk / ILO 2025 Benchmarks)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computer Science and Software Engineering remain the highest starting salary sectors for fresh graduates in Pakistan (PKR 90k–160k starting median in tier-1 cities), followed by Electrical/Mechatronics Engineering and specialized Corporate Finance/Fintech.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

