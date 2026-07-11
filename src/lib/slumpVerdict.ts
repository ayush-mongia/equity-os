import { getISOWeek, getISOWeekYear, subMonths, formatISO } from 'date-fns';
import type { SlumpVerdictContext, SlumpVerdictResult, StockMetrics } from './types';

const GATE_THRESHOLD = -0.05; // -5%: below this, the stock itself is genuinely down
const CACHE_KEY = 'equityos_verdict_cache_v1';
const COOLDOWN_MS = 5000;

export type Gate =
  | { kind: 'skip' }
  | { kind: 'entry_price'; yourRet: number; stockRet: number }
  | { kind: 'needs_verdict'; yourRet: number; stockRet: number };

/**
 * The deterministic gate (spec §1), adapted for EquityOS's own return model:
 * `yourRet` is the app's real (post-tax, post-inflation, currency-adjusted) return —
 * not just raw price move — so a red position here can be a pure tax/currency/inflation
 * artifact even when the underlying US stock (`stockRet`, raw USD price) is flat or up.
 */
export function computeGate(m: StockMetrics): Gate {
  const yourRet = m.realReturnPct / 100;
  const stockRet =
    m.stock.purchasePriceUSD > 0
      ? (m.stock.currentPriceUSD - m.stock.purchasePriceUSD) / m.stock.purchasePriceUSD
      : 0;

  if (yourRet >= 0) return { kind: 'skip' };
  if (stockRet > GATE_THRESHOLD) return { kind: 'entry_price', yourRet, stockRet };
  return { kind: 'needs_verdict', yourRet, stockRet };
}

export function buyDateApprox(monthsHeld: number): string {
  return formatISO(subMonths(new Date(), monthsHeld), { representation: 'date' });
}

function fmtPctSigned(v: number): string {
  const pct = v * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}

export function buildContext(m: StockMetrics, yourRet: number, stockRet: number): SlumpVerdictContext {
  return {
    ticker: m.stock.ticker,
    companyName: m.stock.companyName,
    yourRetPct: yourRet * 100,
    stockRetPct: stockRet * 100,
    retrievalDate: formatISO(new Date(), { representation: 'date' }),
  };
}

/** Zero-token local template — spec §5c. Never spends a model call. */
export function entryPriceResult(m: StockMetrics, yourRet: number, stockRet: number): SlumpVerdictResult {
  return { kind: 'entry_price', ctx: buildContext(m, yourRet, stockRet) };
}

export function entryPriceCopy(ctx: SlumpVerdictContext) {
  return {
    headline: 'The stock did not break. Your entry, tax, and currency did.',
    body: `${ctx.ticker} is ${fmtPctSigned(ctx.stockRetPct / 100)} in USD since you bought it. Your real return — after India capital-gains tax, INR depreciation, and inflation — is ${fmtPctSigned(ctx.yourRetPct / 100)}.\n\nA negative real return is a fact about your position, not the company. Nothing in the business changed to produce this number.`,
  };
}

/** Spec §5a — empty citations or malformed model response. A first-class calm
 * outcome, not an error: we ran the check and the evidence didn't clear the bar. */
export function noCitationCopy(ctx: SlumpVerdictContext) {
  return {
    headline: 'No verdict. The evidence did not clear the bar.',
    body: `${ctx.ticker} is ${fmtPctSigned(ctx.stockRetPct / 100)} in USD since you bought it. Your real return is ${fmtPctSigned(ctx.yourRetPct / 100)}.\n\nWe ran the drawdown check and could not find dated, citable evidence of a structural break in the business. That is not the same as saying the business is fine. It means the case is unproven, and we will not manufacture one to fill the space.\n\nWhat we can say is what the number is a fact about. It is a fact about your position. It is not yet a fact about the company.`,
    footer: `Checked ${ctx.retrievalDate}.`,
  };
}

/** Spec §5b — either the search provider's or Gemini's free-tier quota was exhausted
 * for this call; either way, no fresh research happened. */
export function quotaCopy(ctx: SlumpVerdictContext, source: 'gemini' | 'search', retryEta?: string) {
  const exhausted = source === 'search' ? 'your Tavily free-tier search quota' : 'your Gemini free-tier quota';
  return {
    headline: `${ctx.ticker} is down ${fmtPctSigned(ctx.yourRetPct / 100)}. The business case is still open.`,
    body: `Your real return is ${fmtPctSigned(ctx.yourRetPct / 100)} against a stock that is ${fmtPctSigned(ctx.stockRetPct / 100)} in USD over the same window. The drawdown is real, not a tax or currency artifact.\n\nThe bear case for this name has not been refreshed yet, ${exhausted} is exhausted for the moment. Until it refreshes, hold the prior: a price move is a claim about sentiment until someone shows you a claim about earnings.`,
    retryEta,
  };
}

// ── ISO-week cache (client-side; BYOK means quota is already per-user via their own
// key, so this just stops the same user re-spending it on repeat opens this week) ──

function isoWeekKey(ticker: string): string {
  const now = new Date();
  return `${ticker}:${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
}

interface CacheEntry {
  result: SlumpVerdictResult;
  storedAt: string;
}

function readCache(): Record<string, CacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable — cache is a nice-to-have, not load-bearing.
  }
}

/** Only real (non-degraded, non-error) verdicts are cached — everything else should retry. */
export function getCachedVerdict(ticker: string): SlumpVerdictResult | null {
  const entry = readCache()[isoWeekKey(ticker)];
  if (!entry || entry.result.kind !== 'verdict') return null;
  return { ...entry.result, cached: true };
}

export function setCachedVerdict(ticker: string, result: SlumpVerdictResult): void {
  if (result.kind !== 'verdict') return;
  const cache = readCache();
  cache[isoWeekKey(ticker)] = { result, storedAt: new Date().toISOString() };
  writeCache(cache);
}

// ── Client-side call cooldown, independent of server-side quota — stops accidental
// double-spends from rapid re-taps on the AI button. ──

const cooldowns = new Map<string, number>();

export function isOnCooldown(ticker: string): boolean {
  const until = cooldowns.get(ticker);
  return !!until && Date.now() < until;
}

export function startCooldown(ticker: string): void {
  cooldowns.set(ticker, Date.now() + COOLDOWN_MS);
}
