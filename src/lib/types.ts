export interface StockEntry {
  id: string;
  ticker: string;
  companyName: string;
  shares: number;
  monthsHeld: number; // how long the position has been held
  purchasePriceUSD: number; // per share
  currentPriceUSD: number; // per share
}

// New Tax Regime FY 2025-26
export type IncomeSlabNew =
  | 'nil'   // 0–4L: 0%
  | '5'     // 4L–8L: 5%
  | '10'    // 8L–12L: 10%
  | '15'    // 12L–16L: 15%
  | '20'    // 16L–20L: 20%
  | '25'    // 20L–24L: 25%
  | '30';   // >24L: 30%

export type SurchargeLevel =
  | '0'    // ≤50L
  | '10'   // 50L–1Cr
  | '15'   // 1Cr–2Cr
  | '25';  // >2Cr

export interface MacroSettings {
  currentUSDINR: number;
  annualINRDepreciation: number; // % e.g. 3
  annualInflation: number;       // % e.g. 6
  incomeSlabNew: IncomeSlabNew;
  surcharge: SurchargeLevel;
}

export interface StockMetrics {
  stock: StockEntry;
  yearsHeld: number;
  monthsHeld: number;
  classification: 'STCG' | 'LTCG';

  historicalUSDINR: number;

  purchaseValueUSD: number;
  currentValueUSD: number;

  purchaseValueINR: number;
  currentValueINR: number;

  grossGainINR: number;
  grossGainPct: number;

  taxRateEffective: number; // e.g. 0.13 = 13%
  taxAmountINR: number;

  postTaxGainINR: number;
  postTaxReturnPct: number;

  inflationErosionINR: number; // how much purchasing power lost

  realGainINR: number;        // post-tax minus inflation erosion
  realReturnPct: number;

  currencyImpactINR: number;  // gain from INR depreciation alone
}

export interface PortfolioSummary {
  totalInvestedINR: number;
  totalCurrentValueINR: number;
  totalGrossGainINR: number;
  totalGrossGainPct: number;
  totalTaxINR: number;
  totalPostTaxGainINR: number;
  totalPostTaxReturnPct: number;
  totalInflationErosionINR: number;
  totalRealGainINR: number;
  totalRealReturnPct: number;
}

export interface AppState {
  stocks: StockEntry[];
  macro: MacroSettings;
  user: { name: string; email: string };
  ai: AISettings;
}

// ── Slump Verdict (AI drawdown analysis) ──────────────────────────

export type AIModel = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-2.0-flash';

export interface AISettings {
  enabled: boolean;
  apiKey: string;
  tavilyApiKey: string;
  model: AIModel;
  // When false, apiKey/tavilyApiKey are never written to localStorage — they live only
  // in sessionStorage, so closing the tab/browser forgets them. Everything else in
  // AISettings still persists normally either way.
  rememberKeys: boolean;
}

export type MarketCapTier = 'MEGA' | 'LARGE' | 'MID' | 'SMALL' | 'UNKNOWN';
export type MarginTrend = 'EXPANDING' | 'FLAT' | 'COMPRESSING' | 'UNKNOWN';
export type VerdictLabel = 'BUSINESS_IMPAIRED' | 'CYCLE_OR_SENTIMENT' | 'INSUFFICIENT_EVIDENCE';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface VerdictDriver {
  date: string;
  event: string;
  est_impact: string;
}

export interface VerdictFalsifier {
  metric: string;
  threshold: string;
  check_on: string;
  reads_as: string;
}

export interface VerdictData {
  verdict: VerdictLabel;
  one_liner: string;
  drivers: VerdictDriver[];
  bear_case: string;
  bull_rebuttal: string;
  falsifier: VerdictFalsifier;
  margin_trend: MarginTrend;
  market_cap_tier: MarketCapTier;
  confidence: ConfidenceLevel;
  citations: string[];
}

export interface SlumpVerdictContext {
  ticker: string;
  companyName: string;
  yourRetPct: number; // e.g. -12.4
  stockRetPct: number; // e.g. -1.2
  retrievalDate: string; // ISO date the verdict/template was generated
}

export type SlumpVerdictResult =
  | { kind: 'entry_price'; ctx: SlumpVerdictContext }
  | { kind: 'verdict'; ctx: SlumpVerdictContext; data: VerdictData; cached: boolean }
  | { kind: 'degraded_no_citation'; ctx: SlumpVerdictContext }
  | { kind: 'degraded_quota'; ctx: SlumpVerdictContext; source: 'gemini' | 'search'; retryEta?: string }
  | {
      kind: 'error';
      ctx: SlumpVerdictContext;
      reason: 'invalid_key' | 'model_unavailable' | 'search_unavailable' | 'network' | 'timeout' | 'unknown';
      message: string;
    };
