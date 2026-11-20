"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Brain, Compass, BookOpen, ArrowRight, ShieldCheck } from "lucide-react";

export function LandingStep() {
  const router = useRouter();
  const { about, setAbout, setStep } = useAssessmentStore();
  const [inviteCode, setInviteCode] = useState(about.invite_code || "");

  const handleStart = () => {
    if (inviteCode.trim()) {
      setAbout({ invite_code: inviteCode.trim().toUpperCase() });
    }
    setStep("about");
    router.push("/assessment/about");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="PakCareer AI Logo"
            width={80}
            height={80}
            className="w-20 h-20 rounded-2xl shadow-md border border-slate-200/80 object-cover"
            priority
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0f766e] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by XGBoost Machine Learning
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f2f38] tracking-tight">
          Discover Your Ideal Degree & Career in Pakistan
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">
          A scientifically grounded, 10-minute assessment matching your vocational interests, personality, and aptitude against 7 Pakistani university degree houses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-teal-100 hover:border-teal-300 transition-all bg-white shadow-xs">
          <CardContent className="p-5 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0f2f38]">Holland RIASEC</h3>
            <p className="text-xs text-slate-500">
              48 questions exploring Realistic, Investigative, Artistic, Social, Enterprising & Conventional interests.
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-100 hover:border-teal-300 transition-all bg-white shadow-xs">
          <CardContent className="p-5 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0f2f38]">Big Five Personality</h3>
            <p className="text-xs text-slate-500">
              10 quick items measuring openness, conscientiousness, extraversion, agreeableness & emotional stability.
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-100 hover:border-teal-300 transition-all bg-white shadow-xs">
          <CardContent className="p-5 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0f2f38]">Vocabulary & Context</h3>
            <p className="text-xs text-slate-500">
              16 vocabulary indicators and local context calibrated for Pakistani intermediate & secondary students.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">
            School / Counsellor Invite Code (Optional)
          </label>
          <Input
            placeholder="e.g. FAST-LAHORE, LGS-DEMO"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="uppercase tracking-wider font-mono text-base"
          />
          <p className="text-xs text-slate-500">
            If your institution or career counsellor gave you an invite code, enter it here to link your report to their cohort dashboard.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Free & Private. No sign-up required.</span>
          </div>
          <Button
            size="lg"
            onClick={handleStart}
            className="w-full sm:w-auto gap-2 text-base px-8 py-6"
          >
            Start Assessment
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

