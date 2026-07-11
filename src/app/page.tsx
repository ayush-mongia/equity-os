"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  animate,
} from "framer-motion";
import {
  TrendingUp,
  ArrowRight,
  Shield,
  BarChart3,
  Zap,
  RefreshCw,
  ChevronDown,
  IndianRupee,
  Percent,
  Clock,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────── */
function useCountUp(target: number, duration = 1.8) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setVal(Math.round(v * 10) / 10),
    });
    return controls.stop;
  }, [inView, target, duration]);
  return { val, ref };
}

function useTilt(strength = 8) {
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateX.set(((e.clientY - cy) / (rect.height / 2)) * -strength);
    rotateY.set(((e.clientX - cx) / (rect.width / 2)) * strength);
  }
  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return { rotateX, rotateY, onMove, onLeave };
}

/* ─── variants ────────────────────────────────── */
function makeFadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

/* ─── sub-components ──────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  body,
  accent,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  accent: string;
  delay: number;
}) {
  const tilt = useTilt(6);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const anim = makeFadeUp(delay * 0.12);

  return (
    <motion.div
      ref={ref}
      initial={anim.initial}
      animate={inView ? anim.animate : anim.initial}
      transition={anim.transition}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 800 }}
      onMouseMove={tilt.onMove}
      onMouseLeave={tilt.onLeave}
      className="relative rounded-2xl border border-[#1e2d47] bg-[#0f172a]/80 backdrop-blur p-7 overflow-hidden cursor-default"
    >
      <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 ${accent}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 border ${accent.replace("bg-", "border-").replace("/20", "/30")} bg-opacity-10 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
    </motion.div>
  );
}

function StatPill({
  value,
  unit,
  label,
  prefix = "",
}: {
  value: number;
  unit: string;
  label: string;
  prefix?: string;
}) {
  const { val, ref } = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-6">
      <span ref={ref} className="text-4xl font-black text-white stat-glow">
        {prefix}{val}{unit}
      </span>
      <span className="text-xs text-slate-500 text-center max-w-[140px] leading-tight mt-1">{label}</span>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="w-8 h-8 rounded-full border border-indigo-500/40 bg-indigo-600/15 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
      {n}
    </div>
  );
}

/* ─── mock return card (hero preview) ─────────── */
function MockCard() {
  const rows = [
    { label: "Gross return", val: "+38.4%", color: "text-slate-300" },
    { label: "After India CGT", val: "+33.0%", color: "text-amber-400" },
    { label: "After inflation", val: "+18.7%", color: "text-emerald-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-3xl" />
      <div className="relative bg-[#0f172a] border border-[#1e2d47] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#1e2d47] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-[9px] font-black text-indigo-300">AA</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">AAPL</p>
              <p className="text-[10px] text-slate-500">10 shares · 30 mo · LTCG</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            LTCG 12.5%
          </span>
        </div>
        <div className="px-5 py-4 space-y-3">
          {rows.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 + i * 0.15, duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <span className="text-xs text-slate-500">{r.label}</span>
              <span className={`text-sm font-bold ${r.color}`}>{r.val}</span>
            </motion.div>
          ))}
        </div>
        <div className="mx-5 mb-5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-slate-400">Real adjusted return</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="text-lg font-black text-emerald-400"
          >
            +18.7%
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── ticker ───────────────────────────────────── */
const TICKER_ITEMS = [
  "0% US capital gains tax for Indian residents (DTAA Art.13)",
  "12.5% LTCG flat — Finance Act 2024",
  "No ₹1.25L exemption on US stocks",
  "24 months holding for LTCG qualification",
  "4% cess on all capital gains",
  "INR depreciates ~3–5% annually vs USD",
  "Indian CPI inflation ~5–7% per year",
  "India exclusively taxes CG — no US withholding",
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full overflow-hidden border-y border-[#1e2d47] bg-[#0a1020] py-3">
      <div className="ticker-track flex gap-0 whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 text-xs text-slate-400">
            <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── main page ────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  return (
    <div className="w-full min-h-screen bg-[#080d1a] text-slate-200">

      {/* ── NAV ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2d47]/60 bg-[#080d1a]/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">EquityOS</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
          >
            Launch App
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      {/* No overflow-hidden here — the orbs use negative offsets and need room */}
      <section
        ref={heroRef}
        className="relative w-full min-h-screen flex flex-col items-center justify-center pt-14 pb-0"
      >
        {/* Clip container for orbs only — keeps them from scrolling the page wide */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-1 absolute -top-32 -left-32 w-[700px] h-[700px] bg-indigo-700/20 rounded-full blur-3xl" />
          <div className="orb-2 absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-purple-700/15 rounded-full blur-3xl" />
          <div className="orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-3xl" />
        </div>

        {/* dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

        {/* radial fade at edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #080d1a 100%)" }}
        />

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">

          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="float-badge inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-600/10 px-4 py-1.5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-300 font-medium">
              Built for Indian investors · Finance Act 2024 · FY 2025-26
            </span>
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-6"
          >
            Your US stocks are{" "}
            <span className="gradient-text">earning less than</span> you think.
          </motion.h1>

          {/* subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            EquityOS calculates your{" "}
            <span className="text-slate-200 font-medium">real, inflation-adjusted, post-tax INR returns</span>{" "}
            on US equity — accounting for Indian capital gains tax, INR depreciation, and purchasing power erosion.
            The number your broker shows you is just the beginning.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.48 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 btn-shimmer text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 hover:-translate-y-1 text-sm"
            >
              Get Started — it&apos;s free
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-[#1e2d47] hover:border-slate-600 rounded-2xl px-6 py-3.5 transition-all duration-200"
            >
              How it works
              <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>

          {/* mock card */}
          <MockCard />
        </div>

        {/* bottom fade into ticker */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080d1a] to-transparent pointer-events-none" />
      </section>

      {/* ── TICKER ── */}
      <Ticker />

      {/* ── STATS ── */}
      <section className="w-full py-20 border-b border-[#1e2d47]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-12"
          >
            The numbers your broker never shows you
          </motion.p>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#1e2d47] rounded-2xl border border-[#1e2d47] overflow-hidden bg-[#0a1020]">
            <StatPill value={0} unit="%" label="US capital gains tax for Indian residents" />
            <StatPill value={12.5} unit="%" label="Flat LTCG rate under Finance Act 2024" />
            <StatPill value={24} unit=" mo" label="Minimum holding for LTCG qualification" />
            <StatPill value={5} unit="%" label="Average annual INR depreciation vs USD" prefix="~" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef} id="features" className="w-full py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">What EquityOS does</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Three hidden costs,{" "}
              <span className="gradient-text">one clear answer</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Most Indian investors only track USD gains. EquityOS layers on the three forces silently eating your real wealth.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              delay={0}
              icon={Shield}
              accent="bg-indigo-600/20"
              title="Tax-precise — Finance Act 2024"
              body="STCG at your income slab rate. LTCG at 12.5% (Sec 112) with no ₹1.25L exemption. Zero US CGT via DTAA Art.13. Surcharge + 4% cess automatically applied. No guessing."
            />
            <FeatureCard
              delay={1}
              icon={RefreshCw}
              accent="bg-purple-600/20"
              title="Currency reality, not illusion"
              body="A 30% USD gain is not a 30% INR gain. We back-calculate your purchase-time INR rate using historical depreciation, so every number is in real rupees — not wishful ones."
            />
            <FeatureCard
              delay={2}
              icon={BarChart3}
              accent="bg-emerald-600/20"
              title="Inflation-adjusted real returns"
              body="With Indian CPI at 5–7% annually, your 'gains' are partly just inflation keeping up. We strip that out and show what your portfolio actually earned in real purchasing power."
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="w-full py-24 border-t border-[#1e2d47]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Up and running in{" "}
              <span className="gradient-text">60 seconds</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                icon: Zap,
                title: "Add your US stock positions",
                body: "Search any US ticker — AAPL, NVDA, SPY, or type any symbol. Enter shares, months held, purchase price, and current price. That's it.",
              },
              {
                icon: IndianRupee,
                title: "Set your macro parameters",
                body: "Enter current USD/INR rate, annual INR depreciation %, Indian inflation %, and select your income tax slab and surcharge bracket for accurate STCG/LTCG calculation.",
              },
              {
                icon: Percent,
                title: "See the truth about your returns",
                body: "Instantly see gross return, post-tax return, and real inflation-adjusted return — both in rupees and percentage — for each stock and your total portfolio.",
              },
            ].map((step, i) => {
              const Icon = step.icon;
              const ref = useRef(null);
              const inView = useInView(ref, { once: true, margin: "-60px" });
              return (
                <motion.div
                  key={i}
                  ref={ref}
                  initial={{ opacity: 0, x: -24 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-5 rounded-2xl border border-[#1e2d47] bg-[#0a1020] p-6 hover:border-indigo-500/30 transition-colors"
                >
                  <StepBadge n={i + 1} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU SEE ── */}
      <section className="w-full py-20 border-t border-[#1e2d47]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">The output</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Every number you need,{" "}
              <span className="gradient-text">nothing you don&apos;t</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: BarChart3, label: "Gross Return", desc: "USD gain converted at real INR rates", color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
              { icon: Shield, label: "Post-Tax Return", desc: "After STCG/LTCG + surcharge + 4% cess", color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
              { icon: TrendingUp, label: "Real Adjusted Return", desc: "After tax AND Indian inflation erosion", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5", highlight: true },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                  className={`rounded-2xl border ${item.border} ${item.bg} p-7 ${item.highlight ? "ring-1 ring-emerald-500/20" : ""}`}
                >
                  <Icon className={`w-5 h-5 ${item.color} mb-4`} />
                  <p className={`text-base font-bold ${item.color} mb-1`}>{item.label}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  {item.highlight && (
                    <span className="mt-3 inline-block text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                      The number that matters
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-2xl border border-[#1e2d47] bg-[#0a1020] p-6 grid sm:grid-cols-3 gap-5 text-xs text-slate-500"
          >
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>INR depreciation back-calculates your actual purchase rate — not today&apos;s rate.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>STCG vs LTCG auto-classified by months held. 24-month threshold per Indian tax law.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <IndianRupee className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>All output in INR — both absolute amount and percentage return.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="w-full py-28 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-700/15 rounded-full blur-3xl" />
        </div>
        <div className="dot-grid absolute inset-0 opacity-30 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-2xl mx-auto px-6 text-center"
        >
          <div className="float-badge inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-600/10 px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">Free · No signup · Works in your browser</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-5">
            See your real returns <br />
            <span className="gradient-text">in under a minute</span>
          </h2>

          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            No account. No subscription. Your data stays in your browser, always.
            Built for Indian retail investors who want the complete picture.
          </p>

          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2.5 btn-shimmer text-white font-bold px-10 py-4 rounded-2xl text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 hover:-translate-y-1"
          >
            Get Started — it&apos;s free
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full border-t border-[#1e2d47] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-white">EquityOS</span>
          </div>
          <p className="text-[11px] text-slate-600 text-center max-w-md leading-relaxed">
            Tax calculations reference Finance Act 2024, India-US DTAA, and Sec 112 ITA. This tool is for informational
            purposes only and does not constitute financial or tax advice. Consult a CA before filing.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <span>FY 2025-26</span>
            <span className="mx-1.5 text-slate-700">·</span>
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 transition">
              Open App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
