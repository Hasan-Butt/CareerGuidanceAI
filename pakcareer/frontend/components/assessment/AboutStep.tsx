"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavButtons } from "./NavButtons";
import { EDUCATION_OPTIONS } from "@/lib/questions";
import { fetchOrg } from "@/lib/api";

export function AboutStep() {
  const router = useRouter();
  const { about, setAbout, setStep } = useAssessmentStore();

  const [age, setAge] = useState<number>(about.age || 18);
  const [education, setEducation] = useState<string>(about.education || EDUCATION_OPTIONS[1]);
  const [familysize, setFamilysize] = useState<number>(about.familysize ?? 5);
  const [urbanLabel, setUrbanLabel] = useState<string>(about.urban_label || "Urban");
  const [engnatLabel, setEngnatLabel] = useState<string>(about.engnat_label || "No");
  const [inviteCode, setInviteCode] = useState<string>(about.invite_code || "");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  const handleNext = async () => {
    const code = inviteCode.trim().toUpperCase();
    // Check the invite code now, not after the student has answered 70 questions.
    if (code) {
      setCheckingCode(true);
      setInviteError(null);
      try {
        await fetchOrg(code);
      } catch (err) {
        const status = (err as { status?: number }).status;
        setInviteError(
          status === 404
            ? `"${code}" is not a valid invite code. Check it with your counsellor, or leave it empty.`
            : "Could not check the invite code. Is the server running?"
        );
        return;
      } finally {
        setCheckingCode(false);
      }
    }
    setAbout({
      age,
      education,
      familysize,
      urban_label: urbanLabel,
      engnat_label: engnatLabel,
      // "" (not undefined) so clearing a code from the landing page sticks
      invite_code: code,
    });
    setStep("riasec");
    router.push("/assessment/riasec");
  };

  const handleBack = () => {
    setStep("landing");
    router.push("/assessment/landing");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>About You</CardTitle>
          <CardDescription>
            These demographic factors allow our XGBoost model to contextualize your responses against benchmark cohorts in Pakistan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Age */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="age">Age</Label>
              <span className="text-sm font-bold text-[#0f766e]">{age} years old</span>
            </div>
            <input
              id="age"
              type="range"
              min={13}
              max={35}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-[#0f766e] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>13</span>
              <span>18</span>
              <span>25</span>
              <span>35</span>
            </div>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <Label htmlFor="education">Highest Education Completed / Current Level</Label>
            <select
              id="education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f766e] cursor-pointer"
            >
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Family Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="familysize">Family Size (Household Members)</Label>
              <span className="text-sm font-bold text-[#0f766e]">{familysize} persons</span>
            </div>
            <input
              id="familysize"
              type="range"
              min={1}
              max={15}
              value={familysize}
              onChange={(e) => setFamilysize(Number(e.target.value))}
              className="w-full accent-[#0f766e] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
            </div>
          </div>

          {/* Urban / Suburban / Rural */}
          <div className="space-y-2">
            <Label>Living Environment</Label>
            <div className="grid grid-cols-3 gap-3">
              {["Urban", "Suburban", "Rural"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrbanLabel(u)}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-semibold text-center transition-all cursor-pointer ${
                    urbanLabel === u
                      ? "border-[#0f766e] bg-teal-50 text-[#0f766e]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* English Native */}
          <div className="space-y-2">
            <Label>Is English your primary native language at home?</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "No (Urdu / Regional / Bilingual)", val: "No" },
                { label: "Yes (English Native)", val: "Yes" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setEngnatLabel(opt.val)}
                  className={`py-2.5 px-3 rounded-lg border text-xs sm:text-sm font-semibold text-center transition-all cursor-pointer ${
                    engnatLabel === opt.val
                      ? "border-[#0f766e] bg-teal-50 text-[#0f766e]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invite Code */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="invite">Counsellor / School Invite Code (Optional)</Label>
            <Input
              id="invite"
              placeholder="e.g. FAST-LAHORE"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setInviteError(null);
              }}
              className="uppercase font-mono"
              aria-invalid={!!inviteError}
            />
            {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
          </div>

          <NavButtons
            onBack={handleBack}
            onNext={handleNext}
            loading={checkingCode}
            nextLabel="Continue to Interests"
          />
        </CardContent>
      </Card>
    </div>
  );
}

