import { NextResponse } from 'next/server';
import { searchStocks } from '@/lib/us-stocks';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_QUERY_LEN = 60;

export async function GET(request: Request) {
  if (!rateLimit(`search-ticker:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().slice(0, MAX_QUERY_LEN);
  const quotes = searchStocks(q, 8);
  return NextResponse.json({ quotes });
}
