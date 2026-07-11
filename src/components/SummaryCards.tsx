"use client";

import { TrendingUp, TrendingDown, Wallet, Receipt, Shield, BarChart3 } from "lucide-react";
import { fmtINR, fmtPct, gainColor } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/types";

interface Props {
  summary: PortfolioSummary;
}

export default function SummaryCards({ summary }: Props) {
  const cards = [
    {
      label: "Total Invested",
      value: fmtINR(summary.totalInvestedINR),
      sub: "at purchase-time INR",
      icon: Wallet,
      accent: "text-slate-300",
      bg: "bg-slate-500/10 border-slate-500/20",
      iconColor: "text-slate-400",
    },
    {
      label: "Current Value",
      value: fmtINR(summary.totalCurrentValueINR),
      sub: `at current USD/INR`,
      icon: BarChart3,
      accent: "text-blue-300",
      bg: "bg-blue-500/10 border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Gross Return",
      value: fmtINR(summary.totalGrossGainINR),
      sub: fmtPct(summary.totalGrossGainPct) + " pre-tax, pre-inflation",
      icon: summary.totalGrossGainINR >= 0 ? TrendingUp : TrendingDown,
      accent: gainColor(summary.totalGrossGainINR),
      bg: summary.totalGrossGainINR >= 0
        ? "bg-emerald-500/10 border-emerald-500/20"
        : "bg-red-500/10 border-red-500/20",
      iconColor: gainColor(summary.totalGrossGainINR),
    },
    {
      label: "Tax Liability",
      value: fmtINR(summary.totalTaxINR),
      sub: "STCG/LTCG per Finance Act 2024",
      icon: Receipt,
      accent: "text-orange-300",
      bg: "bg-orange-500/10 border-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      label: "Post-Tax Return",
      value: fmtINR(summary.totalPostTaxGainINR),
      sub: fmtPct(summary.totalPostTaxReturnPct) + " after India CG tax",
      icon: Shield,
      accent: gainColor(summary.totalPostTaxGainINR),
      bg: summary.totalPostTaxGainINR >= 0
        ? "bg-emerald-500/10 border-emerald-500/20"
        : "bg-red-500/10 border-red-500/20",
      iconColor: gainColor(summary.totalPostTaxGainINR),
    },
    {
      label: "Real Adjusted Return",
      value: fmtINR(summary.totalRealGainINR),
      sub: fmtPct(summary.totalRealReturnPct) + " after tax + inflation",
      icon: summary.totalRealGainINR >= 0 ? TrendingUp : TrendingDown,
      accent: gainColor(summary.totalRealGainINR),
      bg: summary.totalRealGainINR >= 0
        ? "bg-emerald-500/10 border-emerald-500/20"
        : "bg-red-500/10 border-red-500/20",
      iconColor: gainColor(summary.totalRealGainINR),
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`relative rounded-2xl border p-4 sm:p-5 ${card.bg} ${
              card.highlight ? "ring-1 ring-indigo-500/30 col-span-2 md:col-span-1" : ""
            }`}
          >
            {card.highlight && (
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-semibold bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  KEY METRIC
                </span>
              </div>
            )}
            <div className={`${card.iconColor} mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
              {card.label}
            </p>
            <p className={`text-lg sm:text-xl font-bold ${card.accent} leading-tight`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
