// In-memory fixed-window rate limiter, per Node process. Render runs this app as a
// single persistent server (not horizontally-scaled serverless functions), so a
// process-local Map is a real, if not distributed, limit — good enough to stop casual
// abuse of a publicly reachable relay to paid-per-call APIs. If this ever moves to
// multiple instances, swap this for a shared store (Redis, etc.).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory: without this, a distributed scan with random IPs never gets cleaned up
// since expired entries only get pruned when that same key is looked up again.
const MAX_TRACKED_KEYS = 5000;

export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Returns true if the request should proceed, false if it's over the limit. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}
