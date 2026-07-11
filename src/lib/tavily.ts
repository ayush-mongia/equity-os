const TIMEOUT_MS = 20000;

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
}

export type TavilyOutcome =
  | { kind: 'ok'; results: TavilySearchResult[] }
  | { kind: 'invalid_key' }
  | { kind: 'quota' }
  | { kind: 'network' }
  | { kind: 'timeout' }
  | { kind: 'unknown'; message: string };

/** Tavily's error body nests the message under `detail.error` (verified against the
 * live API reference), not `error.message` like Gemini's — don't assume Google's shape. */
async function parseTavilyError(res: Response): Promise<string | undefined> {
  try {
    const body = await res.json();
    const message = body?.detail?.error;
    return typeof message === 'string' ? message : undefined;
  } catch {
    return undefined;
  }
}

export async function searchTavily(apiKey: string, query: string): Promise<TavilyOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        topic: 'news',
        max_results: 8,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    return err instanceof Error && err.name === 'AbortError' ? { kind: 'timeout' } : { kind: 'network' };
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) return { kind: 'invalid_key' };
  // 429 is Tavily's abuse-rate throttle, 432/433 are the real free-tier/PAYG limits —
  // all three mean "can't search right now," so fold them into one outcome.
  if (res.status === 429 || res.status === 432 || res.status === 433) return { kind: 'quota' };
  if (!res.ok) {
    const message = await parseTavilyError(res);
    return { kind: 'unknown', message: message ?? `Tavily search returned HTTP ${res.status}` };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { kind: 'unknown', message: 'Tavily returned a malformed response.' };
  }

  const rawResults = (body as { results?: unknown[] })?.results;
  if (!Array.isArray(rawResults)) return { kind: 'unknown', message: 'Tavily returned no results.' };

  const results = rawResults
    .map((r) => {
      const item = r as Record<string, unknown>;
      return {
        title: typeof item.title === 'string' ? item.title : '',
        url: typeof item.url === 'string' ? item.url : '',
        content: typeof item.content === 'string' ? item.content : '',
      };
    })
    .filter((r) => r.url.length > 0);

  return { kind: 'ok', results };
}
