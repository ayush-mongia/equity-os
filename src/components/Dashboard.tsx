"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { TrendingUp, Plus, Settings2, RotateCcw, Sparkles } from "lucide-react";
import { loadState, saveState, DEFAULT_STATE } from "@/lib/storage";
import { calcStockMetrics, calcPortfolioSummary } from "@/lib/calculations";
import type {
  AISettings,
  AppState,
  StockEntry,
  MacroSettings,
  StockMetrics,
  PortfolioSummary,
} from "@/lib/types";
import SummaryCards from "./SummaryCards";
import StockTable from "./StockTable";
import AddStockDialog from "./AddStockDialog";
import SettingsPanel from "./SettingsPanel";
import ReturnChart from "./ReturnChart";
import AISettingsSheet from "./AISettingsSheet";
import SlumpVerdictSheet from "./SlumpVerdictSheet";

export default function Dashboard() {
  const [state, setState] = useState<AppState | null>(null);
  const [metrics, setMetrics] = useState<StockMetrics[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [verdictTargetId, setVerdictTargetId] = useState<string | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const recompute = useCallback((s: AppState) => {
    const m = s.stocks.map((stock) => calcStockMetrics(stock, s.macro));
    setMetrics(m);
    setSummary(calcPortfolioSummary(m));
  }, []);

  useEffect(() => {
    if (state) recompute(state);
  }, [state, recompute]);

  function handleAddStock(stock: StockEntry) {
    if (!state) return;
    const next = { ...state, stocks: [...state.stocks, stock] };
    saveState(next);
    setState(next);
    setShowAdd(false);
  }

  function handleDeleteStock(id: string) {
    if (!state) return;
    const next = { ...state, stocks: state.stocks.filter((s) => s.id !== id) };
    saveState(next);
    setState(next);
  }

  function handleSaveMacro(macro: MacroSettings) {
    if (!state) return;
    const next = { ...state, macro };
    saveState(next);
    setState(next);
    setShowSettings(false);
  }

  function handleReset() {
    saveState({ ...DEFAULT_STATE });
    setState({ ...DEFAULT_STATE });
    setConfirmReset(false);
  }

  function handleToggleAI() {
    if (!state) return;
    if (state.ai.enabled) {
      const next = { ...state, ai: { ...state.ai, enabled: false } };
      saveState(next);
      setState(next);
    } else if (state.ai.apiKey) {
      const next = { ...state, ai: { ...state.ai, enabled: true } };
      saveState(next);
      setState(next);
    } else {
      setShowAISettings(true);
    }
  }

  function handleSaveAI(ai: AISettings) {
    if (!state) return;
    const next = { ...state, ai };
    saveState(next);
    setState(next);
    setShowAISettings(false);
  }

  if (!state) {
    return (
      <div className="w-full min-h-screen bg-[#080d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#080d1a] text-slate-200">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 bg-[#080d1a]/90 backdrop-blur border-b border-[#1e2d47] pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight truncate">EquityOS</span>
            <span className="hidden md:inline text-[10px] text-slate-500 border border-[#1e2d47] rounded px-1.5 py-0.5 ml-1 shrink-0">
              Indian Investor · US Equity Real Returns
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Parameters"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-[#1e2d47] hover:border-indigo-500/50 rounded-lg p-2 sm:px-3 sm:py-1.5 transition"
            >
              <Settings2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Parameters</span>
            </button>
            <button
              onClick={() => setShowAdd(true)}
              aria-label="Add Stock"
              className="hidden sm:flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 transition font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Stock
            </button>
            {state.stocks.length > 0 && (
              <button
                onClick={() => setConfirmReset(true)}
                className="p-2 text-slate-600 hover:text-red-400 rounded-lg transition"
                title="Reset portfolio"
                aria-label="Reset portfolio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28 sm:pb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Portfolio Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real returns adjusted for INR depreciation · Indian inflation · India-US DTAA tax (Finance Act 2024)
          </p>
        </div>

        <div className="rounded-2xl border border-[#1e2d47] bg-[#0f172a] px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Slump Verdict</p>
              <p className="text-[11px] text-slate-500 truncate">
                AI drawdown analysis for negative-return stocks · uses your own Tavily + Gemini keys
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {state.ai.enabled && (
              <button
                onClick={() => setShowAISettings(true)}
                aria-label="AI settings"
                className="p-1.5 text-slate-500 hover:text-white transition"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}
            <button
              role="switch"
              aria-checked={state.ai.enabled}
              onClick={handleToggleAI}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                state.ai.enabled ? "bg-indigo-600" : "bg-[#1e2d47]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  state.ai.enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {summary && state.stocks.length > 0 ? (
          <>
            <SummaryCards summary={summary} />
            <ReturnChart metrics={metrics} />
            <StockTable
              metrics={metrics}
              macro={state.macro}
              onDelete={handleDeleteStock}
              aiEnabled={state.ai.enabled}
              onOpenVerdict={(m) => setVerdictTargetId(m.stock.id)}
            />
          </>
        ) : (
          <EmptyState onAdd={() => setShowAdd(true)} />
        )}
      </main>

      {/* Floating action button — primary "Add Stock" entry point on mobile */}
      <button
        onClick={() => setShowAdd(true)}
        aria-label="Add Stock"
        className="sm:hidden fixed z-30 right-5 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] w-14 h-14 rounded-full bg-indigo-600 active:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {showAdd && (
          <AddStockDialog onClose={() => setShowAdd(false)} onAdd={handleAddStock} />
        )}
        {showSettings && (
          <SettingsPanel
            macro={state.macro}
            onClose={() => setShowSettings(false)}
            onSave={handleSaveMacro}
          />
        )}
        {confirmReset && (
          <ResetConfirmDialog onConfirm={handleReset} onCancel={() => setConfirmReset(false)} />
        )}
        {showAISettings && (
          <AISettingsSheet current={state.ai} onClose={() => setShowAISettings(false)} onSave={handleSaveAI} />
        )}
        {verdictTargetId &&
          (() => {
            const target = metrics.find((m) => m.stock.id === verdictTargetId);
            if (!target) return null;
            return (
              <SlumpVerdictSheet
                metrics={target}
                ai={state.ai}
                onClose={() => setVerdictTargetId(null)}
                onOpenAISettings={() => {
                  setVerdictTargetId(null);
                  setShowAISettings(true);
                }}
              />
            );
          })()}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-5">
        <TrendingUp className="w-8 h-8 text-indigo-400" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">No positions yet</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        Add your US stock purchases to see real adjusted returns after tax, inflation, and currency impact.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
      >
        <Plus className="w-4 h-4" />
        Add your first stock
      </button>
    </div>
  );
}

function ResetConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const dragControls = useDragControls();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
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
          if (info.offset.y > 100) onCancel();
        }}
        className="relative bg-[#0f172a] border border-[#1e2d47] border-b-0 sm:border-b rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="sm:hidden -mt-2 mb-4 pt-2 pb-1 -mx-6 px-6 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 rounded-full bg-[#1e2d47] mx-auto" />
        </div>
        <h2 className="font-semibold text-white mb-2">Reset portfolio?</h2>
        <p className="text-sm text-slate-400 mb-6">
          This will remove all stock entries and reset parameters to defaults. Your data is stored in this browser — this cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 sm:py-2.5 text-sm text-slate-400 border border-[#1e2d47] rounded-xl hover:bg-[#141e33] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 sm:py-2.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition"
          >
            Reset
          </button>
        </div>
      </motion.div>
    </div>
  );
}
