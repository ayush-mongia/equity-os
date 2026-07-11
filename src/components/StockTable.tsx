"use client";

import { useState } from "react";
import { Trash2, Info, ChevronDown, Sparkles } from "lucide-react";
import { fmtINR, fmtUSD, fmtPct, gainColor } from "@/lib/utils";
import { computeGate } from "@/lib/slumpVerdict";
import type { StockMetrics, MacroSettings } from "@/lib/types";

interface Props {
  metrics: StockMetrics[];
  macro: MacroSettings;
  onDelete: (id: string) => void;
  aiEnabled: boolean;
  onOpenVerdict: (m: StockMetrics) => void;
}

export default function StockTable({ metrics, macro, onDelete, aiEnabled, onOpenVerdict }: Props) {
  return (
    <div className="bg-[#0f172a] border border-[#1e2d47] rounded-2xl overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[#1e2d47] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Stock-level Breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="hidden sm:inline">
              USD/INR at purchase back-calculated using {macro.annualINRDepreciation}%/yr depreciation ·{" "}
            </span>
            Inflation {macro.annualInflation}%/yr
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <Info className="w-3.5 h-3.5" />
          Finance Act 2024
        </div>
      </div>

      {/* Mobile: stacked, tappable cards — no horizontal table scrolling */}
      <div className="sm:hidden divide-y divide-[#1e2d47]/50">
        {metrics.map((m) => (
          <StockCard
            key={m.stock.id}
            m={m}
            macro={macro}
            onDelete={onDelete}
            aiEnabled={aiEnabled}
            onOpenVerdict={onOpenVerdict}
          />
        ))}
      </div>

      {/* Desktop / tablet: full breakdown table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e2d47]">
              {[
                "Stock",
                "Holding",
                "Invested (INR)",
                "Current Value",
                "Gross Return",
                "Tax",
                "Post-Tax Return",
                "Inflation Drag",
                "Real Return",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <StockRow
                key={m.stock.id}
                m={m}
                macro={macro}
                onDelete={onDelete}
                aiEnabled={aiEnabled}
                onOpenVerdict={onOpenVerdict}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockCard({
  m,
  macro,
  onDelete,
  aiEnabled,
  onOpenVerdict,
}: {
  m: StockMetrics;
  macro: MacroSettings;
  onDelete: (id: string) => void;
  aiEnabled: boolean;
  onOpenVerdict: (m: StockMetrics) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const showAI = aiEnabled && computeGate(m).kind !== "skip";

  return (
    <div className="px-4 py-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-indigo-300">{m.stock.ticker.slice(0, 2)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{m.stock.ticker}</p>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border shrink-0 ${
                m.classification === "LTCG"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {m.classification}
            </span>
          </div>
          <p className="text-slate-500 text-[11px] truncate">
            {m.stock.shares} sh · {m.monthsHeld} mo held
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${gainColor(m.realGainINR)}`}>{fmtPct(m.realReturnPct)}</p>
          <p className={`text-[10px] ${gainColor(m.realGainINR)}`}>{fmtINR(m.realGainINR)}</p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 pl-12 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <Metric label="Invested" value={fmtINR(m.purchaseValueINR)} sub={fmtUSD(m.purchaseValueUSD)} />
          <Metric label="Current Value" value={fmtINR(m.currentValueINR)} sub={fmtUSD(m.currentValueUSD)} />
          <Metric
            label="Gross Return"
            value={fmtINR(m.grossGainINR)}
            sub={fmtPct(m.grossGainPct)}
            valueClass={gainColor(m.grossGainINR)}
          />
          <Metric
            label="Tax"
            value={fmtINR(m.taxAmountINR)}
            sub={`${(m.taxRateEffective * 100).toFixed(1)}% eff.`}
            valueClass="text-orange-300"
          />
          <Metric
            label="Post-Tax Return"
            value={fmtINR(m.postTaxGainINR)}
            sub={fmtPct(m.postTaxReturnPct)}
            valueClass={gainColor(m.postTaxGainINR)}
          />
          <Metric
            label="Inflation Drag"
            value={`-${fmtINR(m.inflationErosionINR)}`}
            sub={`${m.yearsHeld.toFixed(1)} yr erosion`}
            valueClass="text-red-400"
          />
          <div className="col-span-2 text-[11px] text-slate-600">
            ₹{m.historicalUSDINR.toFixed(1)} → ₹{macro.currentUSDINR.toFixed(1)} · {m.stock.companyName}
          </div>
          {showAI && (
            <button
              onClick={() => onOpenVerdict(m)}
              className="col-span-2 flex items-center justify-center gap-1.5 mt-1 py-2.5 text-xs text-indigo-300 border border-indigo-500/30 bg-indigo-600/10 rounded-xl active:bg-indigo-600/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Slump Verdict
            </button>
          )}
          <button
            onClick={() => onDelete(m.stock.id)}
            className="col-span-2 flex items-center justify-center gap-1.5 mt-1 py-2.5 text-xs text-red-400 border border-red-500/20 bg-red-500/5 rounded-xl active:bg-red-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove position
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  valueClass = "text-slate-200",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-slate-500 text-[10px] uppercase tracking-wide">{label}</p>
      <p className={`font-medium ${valueClass}`}>{value}</p>
      {sub && <p className="text-slate-600 text-[10px]">{sub}</p>}
    </div>
  );
}

function StockRow({
  m,
  macro,
  onDelete,
  aiEnabled,
  onOpenVerdict,
}: {
  m: StockMetrics;
  macro: MacroSettings;
  onDelete: (id: string) => void;
  aiEnabled: boolean;
  onOpenVerdict: (m: StockMetrics) => void;
}) {
  const showAI = aiEnabled && computeGate(m).kind !== "skip";
  return (
    <tr className="border-b border-[#1e2d47]/50 hover:bg-[#141e33]/60 transition">
      {/* Stock info */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-indigo-300">
              {m.stock.ticker.slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-white">{m.stock.ticker}</p>
            <p className="text-slate-500 text-[10px]">
              {m.stock.shares} sh · {fmtUSD(m.stock.purchasePriceUSD)}/sh
            </p>
            <p className="text-slate-600 text-[10px] truncate max-w-[120px]">{m.stock.companyName}</p>
          </div>
        </div>
      </td>

      {/* Holding */}
      <td className="px-4 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            m.classification === "LTCG"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
        >
          {m.classification}
        </span>
        <p className="text-slate-500 text-[10px] mt-1">
          {m.monthsHeld} mo · {m.yearsHeld.toFixed(1)} yr
        </p>
        <p className="text-slate-600 text-[10px]">
          ₹{m.historicalUSDINR.toFixed(1)} → ₹{macro.currentUSDINR.toFixed(1)}
        </p>
      </td>

      {/* Invested */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-slate-200 font-medium">{fmtINR(m.purchaseValueINR)}</p>
        <p className="text-slate-500 text-[10px]">{fmtUSD(m.purchaseValueUSD)}</p>
        <p className="text-slate-600 text-[10px]">@₹{m.historicalUSDINR.toFixed(1)}</p>
      </td>

      {/* Current value */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-slate-200 font-medium">{fmtINR(m.currentValueINR)}</p>
        <p className="text-slate-500 text-[10px]">{fmtUSD(m.currentValueUSD)}</p>
        <p className="text-slate-600 text-[10px]">{fmtUSD(m.stock.currentPriceUSD)}/sh</p>
      </td>

      {/* Gross return */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className={`font-semibold ${gainColor(m.grossGainINR)}`}>
          {fmtINR(m.grossGainINR)}
        </p>
        <p className={`text-[10px] ${gainColor(m.grossGainINR)}`}>
          {fmtPct(m.grossGainPct)}
        </p>
        <p className="text-[10px] text-slate-600">
          FX gain: {fmtINR(m.currencyImpactINR)}
        </p>
      </td>

      {/* Tax */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-orange-300 font-medium">{fmtINR(m.taxAmountINR)}</p>
        <p className="text-[10px] text-slate-500">
          {(m.taxRateEffective * 100).toFixed(1)}% eff.
        </p>
        <p className="text-[10px] text-slate-600">
          {m.classification} Sec 112{m.classification === "STCG" ? "/slab" : ""}
        </p>
      </td>

      {/* Post-tax */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className={`font-semibold ${gainColor(m.postTaxGainINR)}`}>
          {fmtINR(m.postTaxGainINR)}
        </p>
        <p className={`text-[10px] ${gainColor(m.postTaxGainINR)}`}>
          {fmtPct(m.postTaxReturnPct)}
        </p>
      </td>

      {/* Inflation drag */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-red-400 font-medium">-{fmtINR(m.inflationErosionINR)}</p>
        <p className="text-[10px] text-slate-500">
          {m.yearsHeld.toFixed(1)} yr erosion
        </p>
      </td>

      {/* Real return — the headline metric */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className={`px-2.5 py-1.5 rounded-lg inline-block ${
          m.realGainINR >= 0
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-red-500/10 border border-red-500/20"
        }`}>
          <p className={`font-bold text-sm ${gainColor(m.realGainINR)}`}>
            {fmtPct(m.realReturnPct)}
          </p>
          <p className={`text-[10px] ${gainColor(m.realGainINR)}`}>
            {fmtINR(m.realGainINR)}
          </p>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          {showAI && (
            <button
              onClick={() => onOpenVerdict(m)}
              className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-400/10 transition"
              title="Get Slump Verdict"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(m.stock.id)}
            className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition"
            title="Remove position"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
