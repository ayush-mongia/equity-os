"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { X, Plus, Search } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { searchStocks } from "@/lib/us-stocks";
import type { StockEntry } from "@/lib/types";
import type { StockInfo } from "@/lib/us-stocks";

type TickerSuggestion = StockInfo;

interface Props {
  onClose: () => void;
  onAdd: (stock: StockEntry) => void;
}

export default function AddStockDialog({ onClose, onAdd }: Props) {
  const dragControls = useDragControls();
  const [query, setQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [shares, setShares] = useState("");
  const [monthsHeld, setMonthsHeld] = useState("");
  const [purchasePriceUSD, setPurchasePriceUSD] = useState("");
  const [currentPriceUSD, setCurrentPriceUSD] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query || selectedTicker) {
      setSuggestions([]);
      return;
    }
    setSuggestions(searchStocks(query, 8));
  }, [query, selectedTicker]);

  function selectTicker(s: TickerSuggestion) {
    setSelectedTicker(s.ticker);
    setCompanyName(s.name);
    setQuery(s.ticker);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function clearSelection() {
    setSelectedTicker("");
    setCompanyName("");
    setQuery("");
    setSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const months = parseInt(monthsHeld, 10);
  const classification =
    monthsHeld === ""
      ? null
      : months >= 24
      ? "LTCG"
      : "STCG";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedTicker && !query.trim()) errs.ticker = "Select or enter a ticker";
    if (!shares || isNaN(+shares) || +shares <= 0) errs.shares = "Enter valid number of shares";
    if (monthsHeld === "" || isNaN(months) || months < 0) errs.monthsHeld = "Enter months held (0+)";
    if (!purchasePriceUSD || isNaN(+purchasePriceUSD) || +purchasePriceUSD <= 0)
      errs.purchasePriceUSD = "Enter valid purchase price";
    if (!currentPriceUSD || isNaN(+currentPriceUSD) || +currentPriceUSD <= 0)
      errs.currentPriceUSD = "Enter valid current price";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const ticker = (selectedTicker || query).toUpperCase().trim();
    const stock: StockEntry = {
      id: uuidv4(),
      ticker,
      companyName: companyName || ticker,
      shares: parseFloat(shares),
      monthsHeld: months,
      purchasePriceUSD: parseFloat(purchasePriceUSD),
      currentPriceUSD: parseFloat(currentPriceUSD),
    };
    onAdd(stock);
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
        className="relative bg-[#0f172a] border border-[#1e2d47] border-b-0 sm:border-b rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] sm:max-h-none flex flex-col"
      >
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="sm:hidden pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <div className="w-10 h-1 rounded-full bg-[#1e2d47] mx-auto" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d47] shrink-0">
          <h2 className="font-semibold text-white">Add Stock Position</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 -m-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {/* Ticker search */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Stock / ETF
            </label>
            <div className="relative">
              {selectedTicker ? (
                /* Selected state */
                <div className="flex items-center justify-between bg-[#141e33] border border-indigo-500/50 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/25 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-indigo-300">
                        {selectedTicker.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedTicker}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{companyName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-slate-500 hover:text-white transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Search state */
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                    className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="Search AAPL, MSFT, NVDA, SPY…"
                    autoComplete="off"
                  />
                </div>
              )}

              {/* Dropdown */}
              {!selectedTicker && showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#141e33] border border-[#1e2d47] rounded-xl overflow-hidden z-50 shadow-xl">
                  {suggestions.map((s) => (
                    <button
                      key={s.ticker}
                      type="button"
                      onMouseDown={() => selectTicker(s)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-indigo-600/20 transition text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-slate-300">
                          {s.ticker.slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm">{s.ticker}</p>
                        <p className="text-slate-400 text-[11px] truncate">{s.name}</p>
                      </div>
                    </button>
                  ))}
                  {/* Manual entry hint */}
                  {query && (
                    <button
                      type="button"
                      onMouseDown={() =>
                        selectTicker({ ticker: query.toUpperCase().trim(), name: query.toUpperCase().trim() })
                      }
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-700/40 transition text-left border-t border-[#1e2d47]"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-700/30 flex items-center justify-center shrink-0">
                        <Plus className="w-3 h-3 text-slate-400" />
                      </div>
                      <p className="text-slate-300 text-sm">
                        Use &ldquo;<span className="font-bold text-white">{query.toUpperCase()}</span>&rdquo; anyway
                      </p>
                    </button>
                  )}
                </div>
              )}
            </div>
            {errors.ticker && <p className="text-red-400 text-[11px] mt-1">{errors.ticker}</p>}
          </div>

          {/* Shares */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Number of Shares
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              placeholder="e.g. 10"
            />
            {errors.shares && <p className="text-red-400 text-[11px] mt-1">{errors.shares}</p>}
          </div>

          {/* Months held */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Months Held
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="600"
                step="1"
                value={monthsHeld}
                onChange={(e) => setMonthsHeld(e.target.value)}
                className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl px-3.5 pr-24 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="e.g. 30"
              />
              {classification && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      classification === "LTCG"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {classification} {classification === "LTCG" ? "12.5%" : "slab rate"}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              &lt;24 months = STCG (slab rate) · ≥24 months = LTCG (12.5% flat, Sec 112)
            </p>
            {errors.monthsHeld && <p className="text-red-400 text-[11px] mt-1">{errors.monthsHeld}</p>}
          </div>

          {/* Prices row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
                Purchase Price / sh
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchasePriceUSD}
                  onChange={(e) => setPurchasePriceUSD(e.target.value)}
                  className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="145.00"
                />
              </div>
              {errors.purchasePriceUSD && (
                <p className="text-red-400 text-[11px] mt-1">{errors.purchasePriceUSD}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
                Current Price / sh
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentPriceUSD}
                  onChange={(e) => setCurrentPriceUSD(e.target.value)}
                  className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="193.00"
                />
              </div>
              {errors.currentPriceUSD && (
                <p className="text-red-400 text-[11px] mt-1">{errors.currentPriceUSD}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 sm:py-2.5 text-sm text-slate-400 border border-[#1e2d47] rounded-xl hover:bg-[#141e33] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Position
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
