import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Heart,
  MoreVertical,
  Bell,
  Sparkles,
  Compass,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Building2,
  TrendingUp,
} from "lucide-react";

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Frosted Floating Glass Header */}
      <header className="sticky top-4 z-40 px-4 max-w-5xl mx-auto w-full">
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-full px-5 py-3 shadow-lg shadow-blue-900/5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="PakCareer AI Logo"
              width={34}
              height={34}
              className="w-8 h-8 rounded-full object-cover shadow-xs border border-white/80"
              priority
            />
            <span className="font-extrabold text-[#0f2942] text-base tracking-tight">
              PakCareer <span className="text-[#2b64ab]">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard">
              <button className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white/50 hover:bg-white/80 border border-white/60 transition cursor-pointer">
                Counsellor Portal
              </button>
            </Link>
            <Link href="/assessment/landing">
              <button className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#2b64ab] hover:bg-[#1f4f8b] shadow-md shadow-blue-900/15 flex items-center gap-1.5 transition cursor-pointer">
                <span>Take Assessment</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-12 sm:space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline, search & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-[#2b64ab] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>National Career Guidance PAAS · Calibrated for Pakistan</span>
            </div>

            <div className="space-y-2">
              <p className="text-white font-bold text-sm uppercase tracking-wider drop-shadow-xs">
                Dream Degree & Career Found
              </p>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-sm">
                Hey, Discover Your <br />
                <span className="text-[#0f2942]">New Career Matches</span>
              </h1>
            </div>

            <p className="text-slate-800 text-sm sm:text-base font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Trained on 100,000+ student profiles. Match your Holland RIASEC interests and Big Five personality to 7 Pakistani university tracks with live job market validation.
            </p>

            {/* Glassmorphic Search Bar (matching Middle Screen) */}
            <div className="max-w-lg mx-auto lg:mx-0 bg-white/70 backdrop-blur-xl border border-white/80 rounded-full p-2 shadow-lg shadow-blue-900/10 flex items-center gap-2">
              <div className="pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search Computer Science, Engineering, Business..."
                className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                readOnly
              />
              <Link href="/assessment/landing">
                <button className="w-9 h-9 rounded-full bg-[#2b64ab] hover:bg-[#1f4f8b] text-white flex items-center justify-center shadow-md transition cursor-pointer">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/assessment/landing">
                <button className="bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full py-4 px-8 font-bold text-sm sm:text-base shadow-xl shadow-blue-900/20 flex items-center gap-2 hover:scale-[1.02] transition cursor-pointer">
                  <span>Start Career Assessment</span>
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="bg-white/60 hover:bg-white/80 backdrop-blur-md text-slate-800 rounded-full py-4 px-6 font-bold text-sm sm:text-base border border-white/80 shadow-md transition cursor-pointer">
                  Counsellor Portal
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Showcase Card with 3D Robot Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm rounded-[36px] overflow-hidden bg-gradient-to-b from-[#87a9ca] via-[#9bb9d4] to-[#bed3e8] border border-white/80 shadow-[0_24px_50px_-10px_rgba(20,50,90,0.3)] p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-white/90 font-semibold">
                <span className="font-mono text-sm">9:40 PM</span>
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/40 text-[10px]">
                  PAAS Mobile UI
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md border border-white/60 p-0.5 flex items-center justify-center shadow-md overflow-hidden">
                  <Image
                    src="/3d-search-badge.png"
                    alt="Career Search"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-extrabold text-white/80 tracking-wider">
                    PakCareer AI
                  </span>
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    Start Your <br /> Career Now
                  </h3>
                </div>
              </div>

              {/* 3D Robot Image */}
              <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-white/50 shadow-md bg-white/10 my-2">
                <Image
                  src="/3d-robot-desk.png"
                  alt="AI Career Robot"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <Link href="/assessment/landing" className="block pt-2">
                <button className="w-full bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full py-3.5 px-6 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25 transition cursor-pointer">
                  <span>Get Started</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Degree Cards matching the Middle Screen */}
        <section className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wider">
                Explore Pakistani Degree Fields
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2942]">
                Recommended Higher Education Tracks
              </h2>
            </div>
            <Link href="/assessment/landing">
              <span className="text-xs font-bold text-[#2b64ab] bg-white/60 hover:bg-white/80 px-4 py-2 rounded-full border border-white/80 inline-flex items-center gap-1 shadow-xs cursor-pointer">
                Take Quiz to Match <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: CS & IT */}
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-5 shadow-lg shadow-blue-900/5 space-y-4 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center text-lg shadow-xs">
                    💻
                  </div>
                  <span className="font-extrabold text-sm text-[#0f2942]">Systems / FAST</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-white/70 border border-slate-200 flex items-center justify-center text-slate-400">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/70 border border-slate-200 flex items-center justify-center text-slate-400">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#0f2942] leading-snug">
                  Computer Science & Software Development
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full">
                    BS CS / SE
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full">
                    Full time
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Top Salary
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-base font-extrabold text-[#2b64ab]">
                    PKR 140k
                  </span>
                  <span className="text-[11px] font-medium text-slate-500"> /Month</span>
                  <div className="text-[10px] text-slate-400 font-medium">3,500+ Rozee openings</div>
                </div>

                <Link href="/assessment/landing">
                  <button className="bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-blue-900/15 flex items-center gap-1 transition cursor-pointer">
                    <span>See Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Card 2: Engineering */}
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-5 shadow-lg shadow-blue-900/5 space-y-4 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center text-lg shadow-xs">
                    ⚙️
                  </div>
                  <span className="font-extrabold text-sm text-[#0f2942]">Engro / NUST</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-white/70 border border-slate-200 flex items-center justify-center text-slate-400">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/70 border border-slate-200 flex items-center justify-center text-slate-400">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#0f2f38] leading-snug">
                  Mechanical, Electrical & Robotics Engineering
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full">
                    BSc Eng
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full">
                    PEC Accredited
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                    Core Industry
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-base font-extrabold text-[#2b64ab]">
                    PKR 110k
                  </span>
                  <span className="text-[11px] font-medium text-slate-500"> /Month</span>
                  <div className="text-[10px] text-slate-400 font-medium">2,800+ openings</div>
                </div>

                <Link href="/assessment/landing">
                  <button className="bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-blue-900/15 flex items-center gap-1 transition cursor-pointer">
                    <span>See Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Card 3: Business & Commerce */}
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-5 shadow-lg shadow-blue-900/5 space-y-4 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-lg shadow-xs">
                    📊
                  </div>
                  <span className="font-extrabold text-sm text-[#0f2942]">HBL / LUMS / IBA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-white/70 border border-slate-200 flex items-center justify-center text-slate-400">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/70 border border-slate-200 flex items-center justify-center text-slate-400">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#0f2942] leading-snug">
                  Corporate Finance, Fintech & BBA
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full">
                    BBA / ACF
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full">
                    Fintech
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    High Growth
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-base font-extrabold text-[#2b64ab]">
                    PKR 125k
                  </span>
                  <span className="text-[11px] font-medium text-slate-500"> /Month</span>
                  <div className="text-[10px] text-slate-400 font-medium">4,000+ openings</div>
                </div>

                <Link href="/assessment/landing">
                  <button className="bg-[#2b64ab] hover:bg-[#1f4f8b] text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-blue-900/15 flex items-center gap-1 transition cursor-pointer">
                    <span>See Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Frosted Glass Footer */}
      <footer className="mt-12 py-6 px-4 text-center text-xs text-slate-700 bg-white/40 backdrop-blur-md border-t border-white/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-medium">© 2026 PakCareer AI PAAS. All rights reserved.</span>
          <div className="flex gap-4 font-bold text-[#2b64ab]">
            <Link href="/assessment/landing" className="hover:underline">Student Assessment</Link>
            <Link href="/dashboard" className="hover:underline">Counsellor Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
