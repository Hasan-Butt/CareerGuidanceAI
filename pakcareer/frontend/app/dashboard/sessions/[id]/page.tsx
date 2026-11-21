"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchSession, patchNotes, fetchPdfUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Save,
  CheckCircle2,
  Calendar,
  GraduationCap,
  Sparkles,
  User,
  MapPin,
  Users,
} from "lucide-react";
import type { SessionRecord } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSaved, setNotesSaved] = useState<boolean>(false);

  useEffect(() => {
    fetchSession(sessionId)
      .then((data) => {
        setSession(data);
        setNotes(data.notes || "");
      })
      .catch((err) => console.error("Error fetching session:", err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await patchNotes(sessionId, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading student session details...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Session Not Found</h2>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2b64ab] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sessions</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#0f2942]">
              Session Details
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {session.session_id.slice(0, 10)}
            </Badge>
            {session.org_code && (
              <Badge variant="secondary" className="font-mono text-xs bg-blue-50 text-[#2b64ab] border-blue-200">
                {session.org_code}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href={fetchPdfUrl(session.session_id)} target="_blank" rel="noreferrer">
            <Button size="sm" className="gap-1.5 bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full font-bold">
              <Download className="w-4 h-4" />
              Download Parents Report PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Demographics & Match Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Demographics Card */}
        <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold text-[#0f2942] flex items-center gap-2">
              <User className="w-4 h-4 text-[#2b64ab]" />
              Student Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Age</span>
              <span className="font-semibold text-slate-800">{session.age} years</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Education</span>
              <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                {session.education}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Family Size</span>
              <span className="font-semibold text-slate-800">{session.familysize} members</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Environment</span>
              <span className="font-semibold text-slate-800 capitalize">{session.urban}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">English Native</span>
              <span className="font-semibold text-slate-800 capitalize">{session.engnat}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-slate-800">
                {new Date(session.created_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right 2 cols: Prediction Matches */}
        <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-extrabold text-[#0f2942] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2b64ab]" />
              Predicted Degree Families (Top Matches)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {session.top3?.map((m, idx) => (
                <div
                  key={m.house}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    idx === 0
                      ? "bg-blue-50/80 border-blue-200 text-[#2b64ab] shadow-xs"
                      : "bg-white/70 border-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{m.emoji}</span>
                    <Badge variant={idx === 0 ? "default" : "outline"} className={`text-[10px] ${idx === 0 ? "bg-[#2b64ab] text-white" : ""}`}>
                      #{idx + 1}
                    </Badge>
                  </div>
                  <div className="font-bold text-slate-900 truncate">{m.house}</div>
                  <div className="text-slate-500 font-semibold text-[11px]">
                    {m.probability}% match
                  </div>
                </div>
              ))}
            </div>

            {/* Holland & Psychometric Summary */}
            {session.profile && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Holland Code</div>
                  <div className="text-base font-bold font-mono text-[#0f766e]">
                    {session.profile.holland_code}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Differentiation</div>
                  <div className="text-base font-bold text-slate-800">
                    {session.profile.differentiation}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Primary RIASEC</div>
                  <div className="text-base font-bold text-slate-800">
                    {session.profile.ranked_codes?.[0] || "—"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Model Confidence</div>
                  <div className="text-base font-bold text-[#c45c26]">
                    {session.top1_prob}%
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Psychometric Scores & RIASEC Detail */}
      {session.profile && (
        <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold text-[#0f2942]">
              Holland RIASEC Domain Scores (1.0 – 5.0)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {Object.entries(session.profile.riasec || {}).map(([dim, score]) => (
                <div key={dim} className="p-3 rounded-2xl border border-white/80 text-center bg-white/60">
                  <div className="font-mono text-sm font-bold text-[#2b64ab]">{dim}</div>
                  <div className="text-lg font-extrabold text-slate-900">{score.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {dim === "R" && "Realistic"}
                    {dim === "I" && "Investigative"}
                    {dim === "A" && "Artistic"}
                    {dim === "S" && "Social"}
                    {dim === "E" && "Enterprising"}
                    {dim === "C" && "Conventional"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Counsellor Notes (Auto-save or on blur) */}
      <Card className="bg-white/75 backdrop-blur-xl border-white/85 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-[#0f2942]">
                Confidential Counsellor Notes
              </CardTitle>
              <CardDescription className="text-xs">
                Private notes recorded by the academic advisor or career counsellor for this student.
              </CardDescription>
            </div>
            {notesSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Notes Saved
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Record advising remarks, recommended university choices, parent meeting notes, or follow-up action items..."
            rows={4}
            className="w-full p-3 rounded-xl border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b64ab] focus:border-transparent transition-all"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="gap-1.5 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {savingNotes ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

