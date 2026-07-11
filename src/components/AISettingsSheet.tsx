"use client";

import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { X, Sparkles, Eye, EyeOff, ExternalLink, Check, ShieldOff } from "lucide-react";
import { AI_MODELS } from "@/lib/ai-models";
import type { AISettings, AIModel } from "@/lib/types";

interface Props {
  current: AISettings;
  onClose: () => void;
  onSave: (ai: AISettings) => void;
}

export default function AISettingsSheet({ current, onClose, onSave }: Props) {
  const dragControls = useDragControls();
  const [apiKey, setApiKey] = useState(current.apiKey ?? "");
  const [tavilyApiKey, setTavilyApiKey] = useState(current.tavilyApiKey ?? "");
  const [model, setModel] = useState<AIModel>(current.model);
  const [rememberKeys, setRememberKeys] = useState(current.rememberKeys ?? true);
  const [showKey, setShowKey] = useState(false);
  const [showTavilyKey, setShowTavilyKey] = useState(false);

  const canSave = apiKey.trim().length > 0 && tavilyApiKey.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({ enabled: true, apiKey: apiKey.trim(), tavilyApiKey: tavilyApiKey.trim(), model, rememberKeys });
  }

  function handleDisable() {
    onSave({ ...current, enabled: false });
  }

  function handleForgetKey() {
    setApiKey("");
    setTavilyApiKey("");
    onSave({ enabled: false, apiKey: "", tavilyApiKey: "", model: current.model, rememberKeys });
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
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <div>
                <h2 className="font-semibold text-white">Slump Verdict</h2>
                <p className="text-xs text-slate-500">AI drawdown analysis, powered by your own Tavily + Gemini keys</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 -m-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed">
            When a position shows a real drawdown, we search the web with Tavily for
            dated, citable evidence, then ask Gemini to steelman the bear case from only
            that evidence and give you one checkable metric that would prove it wrong.
            This is bring-your-own-key for both: your keys are stored only in this
            browser and sent only to your own app&apos;s server when you request a
            verdict, which forwards them to Tavily and Google respectively.
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
                className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition p-1"
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 mt-2 transition"
            >
              Get a free Gemini API key
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Tavily API Key
            </label>
            <div className="relative">
              <input
                type={showTavilyKey ? "text" : "password"}
                value={tavilyApiKey}
                onChange={(e) => setTavilyApiKey(e.target.value)}
                placeholder="tvly-..."
                autoComplete="off"
                className="w-full bg-[#141e33] border border-[#1e2d47] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowTavilyKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition p-1"
                aria-label={showTavilyKey ? "Hide key" : "Show key"}
              >
                {showTavilyKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <a
              href="https://app.tavily.com/home"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 mt-2 transition"
            >
              Get a free Tavily API key (1,000 searches/month)
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2.5">Model</label>
            <div className="space-y-2">
              {AI_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                    model === m.id
                      ? "border-indigo-500/60 bg-indigo-600/10"
                      : "border-[#1e2d47] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{m.label}</p>
                        {m.recommended && (
                          <span className="text-[9px] font-semibold bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/30 shrink-0">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-indigo-400/80 mt-0.5">{m.tagline}</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{m.detail}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${
                        model === m.id ? "border-indigo-500 bg-indigo-600" : "border-[#1e2d47]"
                      }`}
                    >
                      {model === m.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 mt-2.5">
              All three are free-tier eligible today. Exact rate limits are enforced by
              Google and shown live in Google AI Studio — if you hit a limit, EquityOS
              will tell you and let you retry rather than fail silently.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRememberKeys((v) => !v)}
            className="w-full flex items-start gap-3 text-left rounded-xl border border-[#1e2d47] px-4 py-3 hover:border-slate-600 transition"
          >
            <ShieldOff className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-white">Don&apos;t remember my keys on this device</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Keeps both keys only for this browser tab — they&apos;re gone as soon as
                you close it. Good for a shared or public computer. Leave this off to
                stay signed in across visits.
              </p>
            </div>
            <div
              className={`w-9 h-5 rounded-full shrink-0 transition relative ${
                !rememberKeys ? "bg-indigo-600" : "bg-[#1e2d47]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${
                  !rememberKeys ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>

        <div className="px-6 py-4 border-t border-[#1e2d47] pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 sm:py-2.5 text-sm text-slate-400 border border-[#1e2d47] rounded-xl hover:bg-[#141e33] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl font-medium transition"
            >
              <Sparkles className="w-4 h-4" />
              {current.enabled ? "Save" : "Enable Slump Verdict"}
            </button>
          </div>
          {current.enabled && (
            <div className="flex gap-3 text-xs">
              <button onClick={handleDisable} className="flex-1 text-slate-500 hover:text-white transition py-1">
                Turn off
              </button>
              <button onClick={handleForgetKey} className="flex-1 text-red-400/70 hover:text-red-400 transition py-1">
                Forget API keys
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
