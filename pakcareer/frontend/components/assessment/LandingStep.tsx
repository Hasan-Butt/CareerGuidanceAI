"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store";
import { ArrowUpRight, Shield, Award } from "lucide-react";

export function LandingStep() {
  const router = useRouter();
  const { about, setAbout, setStep } = useAssessmentStore();
  const [inviteCode, setInviteCode] = useState(about.invite_code || "");
  const [showCodeInput, setShowCodeInput] = useState(false);

  const handleStart = () => {
    if (inviteCode.trim()) {
      setAbout({ invite_code: inviteCode.trim().toUpperCase() });
    }
    setStep("about");
    router.push("/assessment/about");
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
            Scientifically calibrated degree & career guidance powered by Holland RIASEC and XGBoost.
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

        {/* Action Controls & Invite Code */}
        <div className="space-y-3 pt-2">
          {showCodeInput ? (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-white/80 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                School / Counsellor Code
              </span>
              <input
                type="text"
                placeholder="e.g. FAST-LAHORE, LGS-DEMO"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-white/90 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0f2942] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#2b64ab]"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="text-[11px] text-white/80 hover:text-white font-medium text-center w-full underline decoration-white/40 cursor-pointer"
            >
              Have a school or counsellor code?
            </button>
          )}

          {/* Primary Pill Button (Exact from image) */}
          <button
            type="button"
            onClick={handleStart}
            className="w-full bg-[#2b64ab] hover:bg-[#204e88] text-white rounded-full py-4 px-6 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-white/75 font-medium">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> 100% Free
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Verified Norms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
