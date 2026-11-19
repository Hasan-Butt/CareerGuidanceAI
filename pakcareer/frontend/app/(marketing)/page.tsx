import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Brain,
  FileText,
  School,
  CheckCircle,
  Building2,
  TrendingUp,
} from "lucide-react";

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0f766e] text-white flex items-center justify-center font-bold text-base shadow-xs">
              PK
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#0f2f38] text-lg tracking-tight">
                PakCareer <span className="text-[#0f766e]">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                National Degree Guidance System
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-600 text-xs sm:text-sm">
                Counsellor Portal
              </Button>
            </Link>
            <Link href="/assessment/landing">
              <Button size="sm" className="gap-1.5 text-xs sm:text-sm">
                Take Assessment
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#0f766e] text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          Trained on 100,000+ Profiles · 86.5% Top-3 Precision
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#0f2f38] tracking-tight leading-[1.1]">
          Stop guessing your university major.{" "}
          <span className="text-[#0f766e]">Let data guide your future.</span>
        </h1>

        <p className="text-slate-600 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
          PakCareer AI is a scientifically grounded platform that analyzes your vocational interests and personality to match you with the right Pakistani university degree track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/assessment/landing" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 py-6 shadow-md">
              Start Free Student Assessment
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 text-base px-8 py-6 border-slate-300"
            >
              <School className="w-4 h-4 text-[#0f766e]" />
              Institutional Counsellor PAAS
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> 10-Minute Assessment
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Downloadable PDF for Parents
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Free & Confidential
          </span>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-white border-y border-slate-200 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0f766e]">86.5%</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-700">Top-3 Validation Accuracy</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0f2f38]">7</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-700">Pakistani Degree Houses</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#c45c26]">48+10</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-700">RIASEC & Big-5 Features</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0f766e]">10 min</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-700">Average Completion Time</div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="secondary" className="px-3 py-1 font-bold">
            Methodology
          </Badge>
          <h2 className="text-3xl font-extrabold text-[#0f2f38]">How PakCareer AI Works</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Combining validated psychometric frameworks with production-grade gradient boosting machine learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#0f2f38]">1. Psychometric Profiling</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Complete 48 Holland RIASEC vocational interest items, 10 Big Five personality traits, and vocabulary fluency checks.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#c45c26] flex items-center justify-center font-bold">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#0f2f38]">2. XGBoost Model Inference</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our 88-feature classification pipeline compares your multi-factor profile against academic success patterns in Pakistan.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#0f2f38]">3. Actionable Reports</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Get probability rankings across 7 degree families, salary insights, and an official PDF summary ready to share with parents.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Institutional CTA */}
      <section className="bg-gradient-to-br from-[#0f2f38] to-teal-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Building2 className="w-12 h-12 text-teal-400 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Empower Your Entire School or University Cohort
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Institutional career counsellors can track student assessments, analyze batch interest distributions, and generate cohort analytics via custom invite codes.
          </p>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-8 py-6">
                Explore Counsellor Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 PakCareer AI. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/assessment/landing" className="hover:text-[#0f766e]">Student Assessment</Link>
            <Link href="/dashboard" className="hover:text-[#0f766e]">Counsellor Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

