"use client";

import React, { useEffect, useState } from "react";
import { fetchAnalytics } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, Users, Compass, School, PieChart } from "lucide-react";
import type { AnalyticsData } from "@/lib/types";

const HOUSE_COLORS: Record<string, string> = {
  "Computer Science & IT": "#2b64ab",
  "Engineering": "#0284c7",
  "Medicine & Health": "#059669",
  "Business & Commerce": "#d97706",
  "Arts, Humanities & Social Sciences": "#7c3aed",
  "Pure Sciences": "#4f46e5",
  "Law": "#c45c26",
};

export default function DashboardAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const houseData = data?.house_distribution
    ? Object.entries(data.house_distribution).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  const hollandData = data?.holland_distribution
    ? Object.entries(data.holland_distribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([code, count]) => ({ code, count }))
    : [];

  const urbanData = data?.urban_split
    ? Object.entries(data.urban_split).map(([area, count]) => ({ area, count }))
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Filter Bar */}
      <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-[#2b64ab]" />
            <span className="font-extrabold text-sm text-[#0f2942]">
              Cohort Analytics & Trends
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAnalytics()}
              className="text-xs font-bold rounded-full bg-white/70 border-white/90 text-slate-700 hover:bg-white"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-2">
          <div className="inline-block w-8 h-8 border-4 border-[#2b64ab] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Compiling batch analytics...</p>
        </div>
      ) : !data || data.total === 0 ? (
        <Card className="bg-white/75 backdrop-blur-xl border-white/85 py-16 text-center shadow-sm">
          <CardContent className="space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800">No Assessment Data Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once students from this institution take the assessment, cohort aggregations will display here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50/80 text-[#2b64ab] border border-blue-200/60 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0f2942]">{data.total}</div>
                  <div className="text-xs font-semibold text-slate-500">Cohort Assessments</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50/80 text-[#c45c26] border border-amber-200/60 flex items-center justify-center font-bold">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0f2942]">
                    {Object.keys(data.house_distribution).length} / 7
                  </div>
                  <div className="text-xs font-semibold text-slate-500">Active Degree Tracks</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50/80 text-purple-700 border border-purple-200/60 flex items-center justify-center font-bold">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0f2942]">
                    {hollandData[0]?.code || "—"}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">Leading Holland Code</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Degree House Distribution Chart */}
          <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[#0f2942]">
                Cohort Degree Family Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Number of students with each degree family predicted as their #1 recommended pathway.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={houseData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: unknown) => [
                        `${typeof val === 'number' ? val : Number(val)} students`,
                        "Cohort Count",
                      ]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {houseData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={HOUSE_COLORS[entry.name] || "#2b64ab"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Grid: Holland Codes & Urban Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Holland Codes */}
            <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-extrabold text-[#0f2942]">
                  Top Holland Codes in Cohort
                </CardTitle>
                <CardDescription className="text-xs">
                  Frequency of 3-letter RIASEC vocational codes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hollandData.map((item) => {
                    const pct = ((item.count / data.total) * 100).toFixed(0);
                    return (
                      <div key={item.code} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="font-mono text-[#2b64ab] font-bold">{item.code}</span>
                          <span>{item.count} students ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2b64ab] to-[#518ee0] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Urban / Rural Split */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#0f2f38]">
                  Geographic Environment Split
                </CardTitle>
                <CardDescription className="text-xs">
                  Demographic living environment reported by students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {urbanData.map((u) => {
                    const pct = ((u.count / data.total) * 100).toFixed(0);
                    return (
                      <div key={u.area} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 capitalize">
                          <span>{u.area}</span>
                          <span>{u.count} students ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

