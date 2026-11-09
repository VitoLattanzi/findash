import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const MAX = 120;
const SYMBOL_RE = /^[A-Z0-9.\-=^]{1,15}$/;

export interface BatchQuoteItem {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  preMarketPrice: number | null;
  preMarketChangePct: number | null;
  postMarketPrice: number | null;
  postMarketChangePct: number | null;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  marketState: string;
  ts: string | number | Date | null;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET(req: NextRequest) {
  const symbols = Array.from(
    new Set(
      (req.nextUrl.searchParams.get('s') ?? '')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => SYMBOL_RE.test(s))
    )
  ).slice(0, MAX);

  if (!symbols.length) return NextResponse.json([], { status: 400 });

  try {
    const rawList: any[] = [];
    for (const group of chunk(symbols, 50)) {
      try {
        const raw = await yahooFinance.quote(group);
        rawList.push(...(Array.isArray(raw) ? raw : [raw]));
      } catch {
        for (const sym of group) {
          try {
            const single = await yahooFinance.quote(sym);
            if (single) rawList.push(single);
          } catch {
            // ignore individual ticker failure
          }
        }
      }
    }

    const data: BatchQuoteItem[] = rawList
      .filter((q) => q && q.symbol)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.displayName ?? q.shortName ?? q.longName ?? q.symbol,
        price: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : null,
        changePct:
          typeof q.regularMarketChangePercent === 'number'
            ? q.regularMarketChangePercent
            : null,
        preMarketPrice: typeof q.preMarketPrice === 'number' ? q.preMarketPrice : null,
        preMarketChangePct:
          typeof q.preMarketChangePercent === 'number' ? q.preMarketChangePercent : null,
        postMarketPrice: typeof q.postMarketPrice === 'number' ? q.postMarketPrice : null,
        postMarketChangePct:
          typeof q.postMarketChangePercent === 'number' ? q.postMarketChangePercent : null,
        volume: typeof q.regularMarketVolume === 'number' ? q.regularMarketVolume : null,
        avgVolume:
          typeof q.averageDailyVolume3Month === 'number'
            ? q.averageDailyVolume3Month
            : null,
        marketCap:
          typeof q.marketCap === 'number'
            ? q.marketCap
            : typeof q.netAssets === 'number'
              ? q.netAssets
              : null,
        marketState: q.marketState ?? 'CLOSED',
        ts: q.regularMarketTime ?? null,
      }));

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
