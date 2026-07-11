import type { AISettings, AppState, MacroSettings, StockEntry } from './types';
import { DEFAULT_AI_MODEL, isKnownAIModel } from './ai-models';

// Bumped to v2 to flush any stale test data from v1
const KEY = 'equityos_v2';
// Separate from KEY deliberately: sessionStorage keys are per-tab and cleared when the
// tab/browser closes, which is exactly the point when rememberKeys is off — the actual
// key strings should never touch localStorage (disk-persisted, survives browser restart)
// in that mode.
const SESSION_KEYS_KEY = 'equityos_v2_session_keys';

const DEFAULT_MACRO: MacroSettings = {
  currentUSDINR: 84.5,
  annualINRDepreciation: 3,
  annualInflation: 6,
  incomeSlabNew: '30',
  surcharge: '0',
};

const DEFAULT_AI: AISettings = {
  enabled: false,
  apiKey: '',
  tavilyApiKey: '',
  model: DEFAULT_AI_MODEL,
  rememberKeys: true,
};

export const DEFAULT_STATE: AppState = {
  stocks: [],
  macro: DEFAULT_MACRO,
  user: { name: 'Demo User', email: 'user@equityos.in' },
  ai: DEFAULT_AI,
};

interface SessionKeys {
  apiKey: string;
  tavilyApiKey: string;
}

function readSessionKeys(): SessionKeys {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS_KEY);
    if (!raw) return { apiKey: '', tavilyApiKey: '' };
    const parsed = JSON.parse(raw) as Partial<SessionKeys>;
    return { apiKey: parsed.apiKey ?? '', tavilyApiKey: parsed.tavilyApiKey ?? '' };
  } catch {
    return { apiKey: '', tavilyApiKey: '' };
  }
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    // Backfill for state saved before the `ai` field existed, and reset the model if it
    // was pinned to an ID that's since been retired from AI_MODELS (e.g. a since-dead
    // Gemini generation) so requests don't silently 400 on an unknown model.
    const ai = { ...DEFAULT_AI, ...parsed.ai };
    if (!isKnownAIModel(ai.model)) ai.model = DEFAULT_AI_MODEL;
    // localStorage never holds the real keys when rememberKeys is off (saveState blanks
    // them below) — pull them back from this tab's sessionStorage instead.
    if (!ai.rememberKeys) {
      const session = readSessionKeys();
      ai.apiKey = session.apiKey;
      ai.tavilyApiKey = session.tavilyApiKey;
    }
    return { ...DEFAULT_STATE, ...parsed, ai };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;

  if (!state.ai.rememberKeys) {
    sessionStorage.setItem(
      SESSION_KEYS_KEY,
      JSON.stringify({ apiKey: state.ai.apiKey, tavilyApiKey: state.ai.tavilyApiKey })
    );
    // Persist everything except the keys themselves to localStorage.
    localStorage.setItem(KEY, JSON.stringify({ ...state, ai: { ...state.ai, apiKey: '', tavilyApiKey: '' } }));
    return;
  }

  // Switching back to "remember" mode — nothing sensitive should linger in
  // sessionStorage once the real keys live in localStorage again.
  sessionStorage.removeItem(SESSION_KEYS_KEY);
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function addStock(stock: StockEntry): void {
  const state = loadState();
  state.stocks = [...state.stocks, stock];
  saveState(state);
}

export function removeStock(id: string): void {
  const state = loadState();
  state.stocks = state.stocks.filter((s) => s.id !== id);
  saveState(state);
}

export function updateMacro(macro: MacroSettings): void {
  const state = loadState();
  state.macro = macro;
  saveState(state);
}

export function updateAISettings(ai: AISettings): void {
  const state = loadState();
  state.ai = ai;
  saveState(state);
}
