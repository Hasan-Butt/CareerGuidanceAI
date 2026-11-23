"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { ArrowUpRight, Shield, Award, KeyRound, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchOrg } from "@/lib/api";

export function LandingStep() {
  const router = useRouter();
  const { about, setAbout, setStep } = useAssessmentStore();
  const [inviteCode, setInviteCode] = useState(about.invite_code || "");
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      setError("An invite code is required. Please enter the code given by your school or counsellor.");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const org = await fetchOrg(code);
      setVerifiedName(org.name);
      setAbout({ invite_code: code });
      setStep("about");
      router.push("/assessment/about");
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      setVerifiedName(null);
      if (status === 404) {
        setError(`"${code}" is not a valid invite code. You must enter a registered school or counsellor code to take this test.`);
      } else {
        setError("Unable to verify invite code. Please check that the server is running or contact support.");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-2 sm:py-4 px-2 sm:px-0">
      {/* Mobile-Frame-Style Glassmorphic Card (exact replica of Left Screen) */}
      <div className="relative rounded-[36px] overflow-hidden bg-gradient-to-b from-[#87a9ca] via-[#9bb9d4] to-[#bed3e8] border border-white/70 shadow-[0_24px_60px_-15px_rgba(20,50,90,0.25)] p-6 sm:p-8 flex flex-col justify-between min-h-[660px]">
        {/* Ambient Top Bar */}
        <div className="flex items-center justify-between text-xs text-white/90 font-semibold pt-1 pb-4">
          <span className="font-mono text-sm tracking-tight text-white/90">9:40 PM</span>
          <div className="flex items-center gap-1.5 text-white/90">
            <span className="text-[11px] bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30">
              PakCareer PAAS
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white/50" />
          </div>
        </div>

        {/* Hero Section with Badge & Title */}
        <div className="space-y-4 pt-2">
          {/* Magnifying Glass 3D Search Badge & Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/25 backdrop-blur-md border border-white/60 p-1 shadow-lg flex items-center justify-center overflow-hidden">
                <Image
                  src="/3d-search-badge.png"
                  alt="3D Search Badge"
                  width={76}
                  height={76}
                  className="w-full h-full object-cover rounded-full drop-shadow-md"
                  priority
                />
              </div>
              {/* Dotted curve decor */}
              <div className="absolute top-full left-1/2 w-0.5 h-12 border-l-2 border-dashed border-white/40 -translate-x-1/2" />
            </div>

            <div className="text-right flex-1 pt-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                Start <br /> Your <br />
                <span className="text-white">Career</span> <br />
                Now
              </h1>
            </div>
          </div>

          <p className="text-white/85 text-xs sm:text-sm font-medium leading-relaxed pt-2 text-right max-w-xs ml-auto">
            Calibrated degree & career guidance powered by Holland RIASEC and XGBoost.
          </p>
        </div>

        {/* Studio-Quality 3D Robot Character Image */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="relative w-full max-w-[280px] h-[225px] flex items-center justify-center">
            <Image
              src="/3d-robot-desk.png"
              alt="3D Career AI Robot"
              fill
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
        </div>

        {/* Mandatory School / Counsellor Invite Code Guard */}
        <form onSubmit={handleStart} className="space-y-3 pt-2">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/90 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#2b64ab]" />
                School / Counsellor Code
              </span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Required
              </span>
            </div>

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setError(null);
                setVerifiedName(null);
              }}
              disabled={verifying}
              className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-mono font-extrabold text-[#0f2942] uppercase tracking-wider placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b64ab]"
            />

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5 font-semibold leading-tight">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {verifiedName && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified: {verifiedName}</span>
              </div>
            )}

            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              Access is restricted to registered partner cohorts. Enter the invite code provided by your school, university, or career counsellor.
            </p>
          </div>

          {/* Primary Pill Button */}
          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-[#2b64ab] hover:bg-[#1f4f8b] disabled:bg-slate-400 text-white rounded-full py-4 px-6 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25 transition-all duration-200 hover:scale-[1.01] cursor-pointer"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Invite Code...</span>
              </>
            ) : (
              <>
                <span>Start Assessment</span>
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-white/75 font-medium">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Verified Institution Access
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> RIASEC & XGBoost
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
