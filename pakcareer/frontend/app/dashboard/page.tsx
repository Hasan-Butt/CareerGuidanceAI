"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSessions, fetchPdfUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Compass,
  Download,
  Search,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Calendar,
  FileText,
} from "lucide-react";
import type { SessionRecord } from "@/lib/types";

export default function DashboardSessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchSessions({ limit: 50 });
      setSessions(res.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      s.session_id.toLowerCase().includes(query) ||
      s.top1_house.toLowerCase().includes(query) ||
      (s.org_code && s.org_code.toLowerCase().includes(query)) ||
      s.holland_code.toLowerCase().includes(query)
    );
  });

  // Calculate quick metrics
  const totalCount = sessions.length;
  const houseCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    houseCounts[s.top1_house] = (houseCounts[s.top1_house] || 0) + 1;
  });
  const topHouse = Object.entries(houseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet";
  const avgAge = totalCount
    ? (sessions.reduce((acc, s) => acc + s.age, 0) / totalCount).toFixed(1)
    : "—";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-white/80 bg-white/75 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2b64ab] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0f2942]">{totalCount}</div>
              <div className="text-xs font-semibold text-slate-500">Total Student Assessments</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#c45c26] flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0f2f38] truncate max-w-[200px]">
                {topHouse}
              </div>
              <div className="text-xs font-semibold text-slate-500">Most Popular Track</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0f2f38]">{avgAge} yrs</div>
              <div className="text-xs font-semibold text-slate-500">Average Student Age</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card className="border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search by ID, track, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader className="border-b border-slate-100 py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#0f2f38]">
                Student Assessment Submissions
              </CardTitle>
              <CardDescription className="text-xs">
                Click any student session to inspect full psychometric dimensions and add private counsellor notes.
              </CardDescription>
            </div>
            <Link href="/assessment/landing" target="_blank">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <GraduationCap className="w-3.5 h-3.5" />
                New Test Assessment
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-[#2b64ab] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading sessions from database...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">No assessments match the selected filter.</p>
              <Link href="/assessment/landing" target="_blank">
                <Button size="sm">Launch First Assessment</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Session</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-4">Top House Match</th>
                    <th className="py-3 px-4">Holland</th>
                    <th className="py-3 px-4">Demographics</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr
                      key={s.session_id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          href={`/dashboard/sessions/${s.session_id}`}
                          className="hover:text-[#2b64ab] hover:underline"
                        >
                          {s.session_id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {s.org_code ? (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {s.org_code}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 italic">Public</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span>{s.top1_house}</span>
                          <Badge variant="accent" className="text-[10px] py-0 px-1.5">
                            {s.top1_prob}%
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#2b64ab] bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                          {s.holland_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {s.age}y · {s.urban}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Link href={`/dashboard/sessions/${s.session_id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            View
                          </Button>
                        </Link>
                        <a
                          href={fetchPdfUrl(s.session_id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Download className="w-3 h-3" />
                            PDF
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

