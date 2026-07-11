"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { StockMetrics } from "@/lib/types";

interface Props {
  metrics: StockMetrics[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] border border-[#1e2d47] rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <div key={entry.name} className="flex justify-between gap-6">
            <span style={{ color: entry.fill }} className="font-medium">
              {entry.name}
            </span>
            <span className="text-slate-300 font-mono">
              {entry.value >= 0 ? "+" : ""}
              {entry.value.toFixed(2)}%
            </span>
          </div>
        )
      )}
    </div>
  );
}

export default function ReturnChart({ metrics }: Props) {
  const data = metrics.map((m) => ({
    name: m.stock.ticker,
    "Gross Return": parseFloat(m.grossGainPct.toFixed(2)),
    "Post-Tax Return": parseFloat(m.postTaxReturnPct.toFixed(2)),
    "Real Adjusted Return": parseFloat(m.realReturnPct.toFixed(2)),
  }));

  // Each stock needs ~90px to keep its three bars legible; below that, scroll horizontally
  // instead of squeezing bars into unreadable slivers on narrow phone screens.
  const minWidth = Math.max(data.length * 90, 320);

  return (
    <div className="bg-[#0f172a] border border-[#1e2d47] rounded-2xl p-4 sm:p-6">
      <div className="mb-5 px-2 sm:px-0">
        <h2 className="text-sm font-semibold text-white">Returns Comparison</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gross → Post-Tax → Real Adjusted (after inflation erosion)
        </p>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth }} className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              barCategoryGap="30%"
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#1e2d47" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 12 }}
                iconType="square"
                iconSize={8}
              />
              <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
              <Bar dataKey="Gross Return" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Post-Tax Return" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Real Adjusted Return" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
