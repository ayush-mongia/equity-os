"use client";

import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { X, Save, Info } from "lucide-react";
import { SLAB_LABELS, SURCHARGE_LABELS, getSTCGEffectiveRate, getLTCGEffectiveRate } from "@/lib/tax";
import type { MacroSettings, IncomeSlabNew, SurchargeLevel } from "@/lib/types";

interface Props {
  macro: MacroSettings;
  onClose: () => void;
  onSave: (macro: MacroSettings) => void;
}

export default function SettingsPanel({ macro, onClose, onSave }: Props) {
  const [form, setForm] = useState<MacroSettings>({ ...macro });
  const dragControls = useDragControls();

  function set<K extends keyof MacroSettings>(key: K, value: MacroSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
        className="relative bg-[#0f172a] border border-[#1e2d47] border-b-0 sm:border-b rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[#0f172a] z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="sm:hidden pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="w-10 h-1 rounded-full bg-[#1e2d47] mx-auto" />
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d47]">
            <div>
              <h2 className="font-semibold text-white">Parameters</h2>
              <p className="text-xs text-slate-500">Macro inputs & tax bracket</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 -m-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Currency section */}
          <section>
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
              Currency
            </h3>
            <div className="space-y-3">
              <FormField
                label="Current USD/INR Rate"
                hint="Live market rate or RBI reference rate"
              >
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.currentUSDINR}
                    onChange={(e) => set("currentUSDINR", parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </FormField>

              <FormField
                label="Annual INR Depreciation %"
                hint="Used to back-calculate historical USD/INR at purchase"
              >
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={form.annualINRDepreciation}
                    onChange={(e) => set("annualINRDepreciation", parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-3.5 pr-7 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Historical INR rate = Current ÷ (1 + dep%)^years. Historical avg ~3-4%.
                </p>
              </FormField>
            </div>
          </section>

          {/* Inflation */}
          <section>
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
              Inflation
            </h3>
            <FormField
              label="Annual Indian Inflation %"
              hint="Indian CPI inflation rate (RBI target: 4%, recent: ~5–7%)"
            >
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={form.annualInflation}
                  onChange={(e) => set("annualInflation", parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-3.5 pr-7 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
              </div>
            </FormField>
          </section>

          {/* Tax */}
          <section>
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
              Tax Profile (Finance Act 2024 — New Regime)
            </h3>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 flex gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                <strong>STCG</strong> (&lt;24 mo): taxed at your marginal slab rate.{" "}
                <strong>LTCG</strong> (≥24 mo): flat 12.5% (Sec 112) · no indexation · no ₹1.25L exemption.
                US does NOT tax Indian residents on capital gains (DTAA Art.13 / IRC §871).
              </p>
            </div>

            <div className="space-y-3">
              <FormField
                label="Income Slab (New Regime FY 2025-26)"
                hint="Your marginal slab — applies to STCG only"
              >
                <select
                  value={form.incomeSlabNew}
                  onChange={(e) => set("incomeSlabNew", e.target.value as IncomeSlabNew)}
                  className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  {(Object.keys(SLAB_LABELS) as IncomeSlabNew[]).map((k) => (
                    <option key={k} value={k}>
                      {SLAB_LABELS[k]}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Surcharge"
                hint="Based on total annual income including capital gains"
              >
                <select
                  value={form.surcharge}
                  onChange={(e) => set("surcharge", e.target.value as SurchargeLevel)}
                  className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  {(Object.keys(SURCHARGE_LABELS) as SurchargeLevel[]).map((k) => (
                    <option key={k} value={k}>
                      {SURCHARGE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Effective rate preview */}
            <EffectiveRatePreview form={form} />
          </section>
        </div>

        <div className="px-6 py-4 border-t border-[#1e2d47] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="flex-1 py-3 sm:py-2.5 text-sm text-slate-400 border border-[#1e2d47] rounded-xl hover:bg-[#141e33] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition"
          >
            <Save className="w-4 h-4" />
            Save Parameters
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

function EffectiveRatePreview({ form }: { form: MacroSettings }) {
  const stcg = (getSTCGEffectiveRate(form.incomeSlabNew, form.surcharge) * 100).toFixed(1);
  const ltcg = (getLTCGEffectiveRate(form.surcharge) * 100).toFixed(1);

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wide">
          STCG Effective Rate
        </p>
        <p className="text-xl font-bold text-amber-300 mt-0.5">{stcg}%</p>
        <p className="text-[10px] text-amber-400/60 mt-0.5">slab + cess</p>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
        <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wide">
          LTCG Effective Rate
        </p>
        <p className="text-xl font-bold text-emerald-300 mt-0.5">{ltcg}%</p>
        <p className="text-[10px] text-emerald-400/60 mt-0.5">12.5% + cess</p>
      </div>
    </div>
  );
}
