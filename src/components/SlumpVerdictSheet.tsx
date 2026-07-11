"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import {
  X,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Settings2,
} from "lucide-react";
import {
  buildContext,
  buyDateApprox,
  computeGate,
  entryPriceCopy,
  entryPriceResult,
  getCachedVerdict,
  isOnCooldown,
  noCitationCopy,
  quotaCopy,
  setCachedVerdict,
  startCooldown,
} from "@/lib/slumpVerdict";
import { getStockInfo } from "@/lib/us-stocks";
import { fmtPct, gainColor } from "@/lib/utils";
import type { AISettings, SlumpVerdictResult, StockMetrics, VerdictData } from "@/lib/types";

interface Props {
  metrics: StockMetrics;
  ai: AISettings;
  onClose: () => void;
  onOpenAISettings: () => void;
}

type ViewState = { phase: "loading" } | { phase: "cooldown" } | { phase: "result"; result: SlumpVerdictResult };

export default function SlumpVerdictSheet({ metrics, ai, onClose, onOpenAISettings }: Props) {
  const dragControls = useDragControls();
  const [view, setView] = useState<ViewState>({ phase: "loading" });
  const cancelledRef = useRef(false);
  const ticker = metrics.stock.ticker;

  async function run() {
    const gate = computeGate(metrics);

    if (gate.kind === "skip") {
      onClose();
      return;
    }

    if (gate.kind === "entry_price") {
      setView({ phase: "result", result: entryPriceResult(metrics, gate.yourRet, gate.stockRet) });
      return;
    }

    const cached = getCachedVerdict(ticker);
    if (cached) {
      setView({ phase: "result", result: cached });
      return;
    }

    if (isOnCooldown(ticker)) {
      setView({ phase: "cooldown" });
      return;
    }

    setView({ phase: "loading" });
    const ctx = buildContext(metrics, gate.yourRet, gate.stockRet);
    const sector = getStockInfo(ticker)?.sector ?? "Unknown";

    try {
      const res = await fetch("/api/slump-verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: ai.apiKey,
          tavilyApiKey: ai.tavilyApiKey,
          model: ai.model,
          ticker,
          companyName: metrics.stock.companyName,
          sector,
          yourRetPct: ctx.yourRetPct,
          stockRetPct: ctx.stockRetPct,
          buyDateApprox: buyDateApprox(metrics.monthsHeld),
        }),
      });
      if (cancelledRef.current) return;
      startCooldown(ticker);

      if (!res.ok) {
        setView({
          phase: "result",
          result: { kind: "error", ctx, reason: "unknown", message: "Something went wrong on our end. Try again." },
        });
        return;
      }

      const responseBody = await res.json();
      let result: SlumpVerdictResult;
      if (responseBody.kind === "verdict") {
        result = { kind: "verdict", ctx, data: responseBody.data as VerdictData, cached: false };
        setCachedVerdict(ticker, result);
      } else if (responseBody.kind === "degraded_no_citation") {
        result = { kind: "degraded_no_citation", ctx };
      } else if (responseBody.kind === "degraded_quota") {
        result = {
          kind: "degraded_quota",
          ctx,
          source: responseBody.source === "search" ? "search" : "gemini",
          retryEta: responseBody.retryEta ?? undefined,
        };
      } else {
        result = {
          kind: "error",
          ctx,
          reason: responseBody.reason ?? "unknown",
          message: responseBody.message ?? "Something went wrong.",
        };
      }
      if (!cancelledRef.current) setView({ phase: "result", result });
    } catch {
      if (cancelledRef.current) return;
      setView({
        phase: "result",
        result: { kind: "error", ctx, reason: "network", message: "Could not reach the server. Check your connection." },
      });
    }
  }

  useEffect(() => {
    cancelledRef.current = false;
    run();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
        }}
        className="relative bg-[#0f172a] border border-[#1e2d47] border-b-0 sm:border-b rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl max-h-[92dvh] sm:max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[#0f172a] z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="sm:hidden pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="w-10 h-1 rounded-full bg-[#1e2d47] mx-auto" />
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d47]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <div>
                <h2 className="font-semibold text-white">Slump Verdict · {ticker}</h2>
                <p className="text-xs text-slate-500">{metrics.stock.companyName}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 -m-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {view.phase === "loading" && <LoadingView ticker={ticker} />}
          {view.phase === "cooldown" && <CooldownView onRetry={run} />}
          {view.phase === "result" && (
            <ResultView result={view.result} onRetry={run} onOpenAISettings={onOpenAISettings} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function LoadingView({ ticker }: { ticker: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
      <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-300">
        Checking {ticker}&apos;s drawdown&hellip;
      </p>
      <p className="text-xs text-slate-500 max-w-xs">
        Searching for dated, citable evidence, then asking Gemini to weigh it, before we
        render anything. This can take up to 45&ndash;55 seconds.
      </p>
    </div>
  );
}

function CooldownView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <Clock className="w-6 h-6 text-slate-500" />
      <p className="text-sm text-slate-300">Just requested a moment ago.</p>
      <p className="text-xs text-slate-500 max-w-xs">
        Give it a few seconds so a rapid re-tap doesn&apos;t spend another call.
      </p>
      <button
        onClick={onRetry}
        className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Try again
      </button>
    </div>
  );
}

function ResultView({
  result,
  onRetry,
  onOpenAISettings,
}: {
  result: SlumpVerdictResult;
  onRetry: () => void;
  onOpenAISettings: () => void;
}) {
  if (result.kind === "entry_price") {
    const copy = entryPriceCopy(result.ctx);
    return (
      <TemplateCard
        icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        tint="emerald"
        headline={copy.headline}
        body={copy.body}
        footer="Zero API calls used — this was determined locally before any Gemini request."
      />
    );
  }

  if (result.kind === "degraded_no_citation") {
    const copy = noCitationCopy(result.ctx);
    return (
      <TemplateCard
        icon={<ShieldQuestion className="w-5 h-5 text-slate-400" />}
        tint="slate"
        headline={copy.headline}
        body={copy.body}
        footer={copy.footer}
        retry={onRetry}
      />
    );
  }

  if (result.kind === "degraded_quota") {
    const copy = quotaCopy(result.ctx, result.source, result.retryEta);
    return (
      <TemplateCard
        icon={<Clock className="w-5 h-5 text-amber-400" />}
        tint="amber"
        headline={copy.headline}
        body={copy.body}
        footer={copy.retryEta ? `Retry suggested in ${copy.retryEta}.` : undefined}
        retry={onRetry}
      />
    );
  }

  if (result.kind === "error") {
    const needsSettings =
      result.reason === "invalid_key" || result.reason === "model_unavailable" || result.reason === "search_unavailable";
    return (
      <TemplateCard
        icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
        tint="red"
        headline={
          result.reason === "invalid_key"
            ? "Your Gemini API key looks invalid."
            : result.reason === "model_unavailable"
              ? "This model isn't available for your key."
              : result.reason === "search_unavailable"
                ? "Web search isn't available."
                : result.reason === "timeout"
                  ? "The request took too long to respond."
                  : "Couldn't get a verdict."
        }
        body={result.message}
        retry={!needsSettings ? onRetry : undefined}
        action={
          needsSettings
            ? { label: "Open AI Settings", icon: <Settings2 className="w-3.5 h-3.5" />, onClick: onOpenAISettings }
            : undefined
        }
      />
    );
  }

  return <VerdictCard result={result} />;
}

function TemplateCard({
  icon,
  tint,
  headline,
  body,
  footer,
  retry,
  action,
}: {
  icon: React.ReactNode;
  tint: "emerald" | "slate" | "amber" | "red";
  headline: string;
  body: string;
  footer?: string;
  retry?: () => void;
  action?: { label: string; icon: React.ReactNode; onClick: () => void };
}) {
  const tintClasses = {
    emerald: "bg-emerald-500/5 border-emerald-500/20",
    slate: "bg-[#141e33] border-[#1e2d47]",
    amber: "bg-amber-500/5 border-amber-500/20",
    red: "bg-red-500/5 border-red-500/20",
  }[tint];

  return (
    <div className={`rounded-2xl border p-5 ${tintClasses}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white leading-snug">{headline}</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-line">{body}</p>
          {footer && <p className="text-[11px] text-slate-600 mt-3">{footer}</p>}
          {(retry || action) && (
            <div className="flex items-center gap-4 mt-4">
              {retry && (
                <button
                  onClick={retry}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
              {action && (
                <button
                  onClick={action.onClick}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  {action.icon}
                  {action.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const VERDICT_STYLES: Record<VerdictData["verdict"], { label: string; className: string }> = {
  BUSINESS_IMPAIRED: { label: "Business Impaired", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  CYCLE_OR_SENTIMENT: {
    label: "Cycle or Sentiment",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  INSUFFICIENT_EVIDENCE: {
    label: "Insufficient Evidence",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
};

const CONFIDENCE_STYLES: Record<VerdictData["confidence"], string> = {
  HIGH: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LOW: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

// Belt-and-suspenders alongside the server-side citation whitelist (gemini.ts) — never
// render a citation as a clickable link unless it's actually http(s), so a guardrail bug
// upstream can't turn into a javascript:/data: URL rendered as a clickable link here.
function isSafeHttpUrl(url: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function VerdictCard({ result }: { result: Extract<SlumpVerdictResult, { kind: "verdict" }> }) {
  const { data, ctx, cached } = result;
  const vStyle = VERDICT_STYLES[data.verdict];
  const safeCitations = data.citations.filter(isSafeHttpUrl);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${vStyle.className}`}>
          {vStyle.label}
        </span>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CONFIDENCE_STYLES[data.confidence]}`}>
          {data.confidence} confidence
        </span>
        {cached && (
          <span className="text-[11px] text-slate-500 px-2.5 py-1 rounded-full border border-[#1e2d47]">Cached</span>
        )}
      </div>

      <div>
        <p className="text-base font-semibold text-white leading-snug">{data.one_liner}</p>
        <p className="text-xs text-slate-500 mt-1.5">
          {ctx.ticker} is <span className={gainColor(ctx.stockRetPct)}>{fmtPct(ctx.stockRetPct)}</span> in USD ·
          your real return is <span className={gainColor(ctx.yourRetPct)}>{fmtPct(ctx.yourRetPct)}</span>
        </p>
      </div>

      {data.drivers.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Drivers</h4>
          <div className="space-y-2">
            {data.drivers.map((d, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="text-slate-600 font-mono shrink-0 w-20">{d.date}</span>
                <div>
                  <p className="text-slate-300">{d.event}</p>
                  {d.est_impact && <p className="text-slate-600 mt-0.5">{d.est_impact}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <h4 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide mb-1.5">
          Bear case, steelmanned
        </h4>
        <p className="text-xs text-amber-100/80 leading-relaxed">{data.bear_case}</p>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <h4 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">Bull rebuttal</h4>
        <p className="text-xs text-emerald-100/80 leading-relaxed">{data.bull_rebuttal}</p>
      </div>

      <div className="rounded-xl border border-indigo-500/30 bg-indigo-600/10 p-4">
        <h4 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide mb-1.5">
          The falsifier — check this on {data.falsifier.check_on}
        </h4>
        <p className="text-xs text-white leading-relaxed">
          <span className="font-semibold">{data.falsifier.metric}</span> vs threshold{" "}
          <span className="font-semibold">{data.falsifier.threshold}</span>
        </p>
        <p className="text-[11px] text-indigo-300/70 mt-1">{data.falsifier.reads_as}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span>
          Margin trend: <span className="text-slate-300">{data.margin_trend}</span>
        </span>
        <span>
          Market cap: <span className="text-slate-300">{data.market_cap_tier}</span>
        </span>
      </div>

      {safeCitations.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Sources</h4>
          <div className="space-y-1.5">
            {safeCitations.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-600 pt-1 border-t border-[#1e2d47]">
        Checked {ctx.retrievalDate}. {cached ? "Served from this week's cache." : "Re-runs weekly."} Not investment
        advice.
      </p>
    </div>
  );
}
