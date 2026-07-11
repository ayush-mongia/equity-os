import { NextResponse } from 'next/server';
import { buildPrompt, buildSearchQuery, callGemini, normalizeUrl } from '@/lib/gemini';
import { isKnownAIModel } from '@/lib/ai-models';
import { searchTavily } from '@/lib/tavily';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 5 * 60 * 1000;
// Hard caps on free-text fields forwarded into search queries and the Gemini prompt —
// not for UX (the UI never lets these run long), but so a direct POST to this route
// can't pad the prompt/query into something absurdly expensive or malformed.
const MAX_FIELD_LEN = 120;

export interface SlumpVerdictApiRequest {
  apiKey: string;
  tavilyApiKey: string;
  model: string;
  ticker: string;
  companyName: string;
  sector: string;
  yourRetPct: number;
  stockRetPct: number;
  buyDateApprox: string;
}

// The route always responds 200 with a typed, discriminated body — every search/Gemini
// failure mode (bad key, quota, malformed JSON, no citations, timeout) is normalized
// here into a calm UI state rather than raw HTTP status juggling on the client. Non-200
// is reserved for our own request being malformed.
export async function POST(request: Request) {
  if (!rateLimit(`slump-verdict:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests. Try again in a few minutes.' }, { status: 429 });
  }

  let body: Partial<SlumpVerdictApiRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { apiKey, tavilyApiKey, model, ticker, companyName, sector, yourRetPct, stockRetPct, buyDateApprox } = body;

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 });
  }
  if (!tavilyApiKey || typeof tavilyApiKey !== 'string') {
    return NextResponse.json({ error: 'Missing tavilyApiKey' }, { status: 400 });
  }
  if (!model || !isKnownAIModel(model)) {
    return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
  }
  if (
    !ticker ||
    typeof ticker !== 'string' ||
    ticker.length > MAX_FIELD_LEN ||
    (companyName !== undefined && (typeof companyName !== 'string' || companyName.length > MAX_FIELD_LEN)) ||
    (sector !== undefined && (typeof sector !== 'string' || sector.length > MAX_FIELD_LEN)) ||
    typeof buyDateApprox !== 'string' ||
    !buyDateApprox ||
    typeof yourRetPct !== 'number' ||
    typeof stockRetPct !== 'number' ||
    !Number.isFinite(yourRetPct) ||
    !Number.isFinite(stockRetPct)
  ) {
    return NextResponse.json({ error: 'Missing or invalid stock context' }, { status: 400 });
  }

  // Strip control/newline characters before these free-text fields flow into the search
  // query and the Gemini prompt — nothing here needs a line break, and this closes off
  // the cheapest form of prompt/query injection (smuggling extra "instructions" in via
  // embedded newlines).
  const stripControlChars = (s: string) => s.replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ').trim();
  const resolvedCompany = stripControlChars(companyName || ticker);
  const resolvedSector = stripControlChars(sector || 'Unknown');
  const cleanTicker = stripControlChars(ticker);

  const searchOutcome = await searchTavily(
    tavilyApiKey,
    buildSearchQuery(cleanTicker, resolvedCompany, resolvedSector)
  );

  switch (searchOutcome.kind) {
    case 'invalid_key':
      return NextResponse.json({
        kind: 'error',
        reason: 'search_unavailable',
        message: 'Your Tavily API key looks invalid. Add a valid free key in AI Settings.',
      });
    case 'quota':
      return NextResponse.json({ kind: 'degraded_quota', source: 'search', retryEta: null });
    case 'timeout':
      return NextResponse.json({
        kind: 'error',
        reason: 'timeout',
        message: 'Web search took too long to respond.',
      });
    case 'network':
      return NextResponse.json({
        kind: 'error',
        reason: 'network',
        message: 'Could not reach the search provider. Check your connection and try again.',
      });
    case 'unknown':
      return NextResponse.json({ kind: 'error', reason: 'search_unavailable', message: searchOutcome.message });
  }

  // searchOutcome.kind === 'ok' below — no evidence at all means no verdict is possible,
  // so skip the Gemini call entirely rather than spend it on a prompt with an empty
  // SOURCES block.
  if (searchOutcome.results.length === 0) {
    return NextResponse.json({ kind: 'degraded_no_citation' });
  }

  const prompt = buildPrompt({
    ticker: cleanTicker,
    companyName: resolvedCompany,
    sector: resolvedSector,
    yourRetPct,
    stockRetPct,
    buyDateApprox,
    today: new Date().toISOString().slice(0, 10),
    sources: searchOutcome.results,
  });

  const sourceUrls = new Set(searchOutcome.results.map((r) => normalizeUrl(r.url)));
  const outcome = await callGemini(apiKey, model, prompt, sourceUrls);

  switch (outcome.kind) {
    case 'ok':
      return NextResponse.json({ kind: 'verdict', data: outcome.data });
    case 'no_citation':
    case 'malformed':
      return NextResponse.json({ kind: 'degraded_no_citation' });
    case 'quota':
      return NextResponse.json({ kind: 'degraded_quota', source: 'gemini', retryEta: outcome.retryEta ?? null });
    case 'invalid_key':
      return NextResponse.json({
        kind: 'error',
        reason: 'invalid_key',
        message: 'Your Gemini API key looks invalid, or lacks access to this model.',
      });
    case 'model_unavailable':
      return NextResponse.json({ kind: 'error', reason: 'model_unavailable', message: outcome.message });
    case 'timeout':
      return NextResponse.json({
        kind: 'error',
        reason: 'timeout',
        message: 'Gemini took too long to respond.',
      });
    case 'network':
      return NextResponse.json({
        kind: 'error',
        reason: 'network',
        message: 'Could not reach Gemini. Check your connection and try again.',
      });
    case 'unknown':
      return NextResponse.json({ kind: 'error', reason: 'unknown', message: outcome.message });
  }
}
