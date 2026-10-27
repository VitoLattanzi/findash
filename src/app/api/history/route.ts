import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const BINANCE_HOSTS = ['https://api.binance.com', 'https://data-api.binance.vision'];

interface CandlePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SeriesPoint {
  time: string;
  value: number;
}

const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

async function cryptoHistory(pair: string, years: number): Promise<CandlePoint[]> {
  const target = years * 366;
  const startMs = Date.now() - years * 365 * 24 * 60 * 60 * 1000;
  const out: CandlePoint[] = [];
  let endTime = Date.now();

  while (out.length < target) {
    const remaining = Math.min(1000, target - out.length);
    let batch: unknown[] | null = null;

    for (const host of BINANCE_HOSTS) {
      try {
        const url = `${host}/api/v3/klines?symbol=${pair}&interval=1d&limit=${remaining}&endTime=${endTime}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const raw = await res.json();
        if (Array.isArray(raw)) {
          batch = raw;
          break;
        }
      } catch {
        // try next host
      }
    }

    if (!batch || batch.length === 0) break;

    const mapped = batch
      .map((k) => {
        if (!Array.isArray(k)) return null;
        const openMs = Number(k[0]);
        const candle: CandlePoint = {
          time: toDate(openMs),
          open: parseFloat(k[1] as string),
          high: parseFloat(k[2] as string),
          low: parseFloat(k[3] as string),
          close: parseFloat(k[4] as string),
        };
        return Number.isFinite(candle.close) ? { candle, openMs } : null;
      })
      .filter((c): c is { candle: CandlePoint; openMs: number } => c !== null);

    if (mapped.length === 0) break;

    out.unshift(...mapped.map((m) => m.candle));
    endTime = mapped[0].openMs - 1;
    if (endTime < startMs) break;
  }

  const seen = new Set<string>();
  return out.filter((c) => {
    if (seen.has(c.time)) return false;
    seen.add(c.time);
    return true;
  });
}

async function stockHistory(symbol: string, years: number): Promise<CandlePoint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - years * 365 * 24 * 60 * 60 * 1000);
  const chart: any = await yahooFinance.chart(symbol, {
    period1: start,
    period2: end,
    interval: '1d',
  });

  const quotes: any[] = chart?.quotes ?? [];
  const candles: CandlePoint[] = quotes
    .filter(
      (q) =>
        q?.date &&
        typeof q?.close === 'number' &&
        Number.isFinite(q.close) &&
        typeof q?.open === 'number'
    )
    .map((q) => ({
      time: toDate(new Date(q.date).getTime()),
      open: q.open as number,
      high: typeof q.high === 'number' ? (q.high as number) : (q.close as number),
      low: typeof q.low === 'number' ? (q.low as number) : (q.close as number),
      close: q.close as number,
    }));

  const seen = new Set<string>();
  return candles
    .filter((c) => {
      if (seen.has(c.time)) return false;
      seen.add(c.time);
      return true;
    })
    .sort((a, b) => (a.time < b.time ? -1 : 1));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') ?? '').trim().toUpperCase();
  const type = searchParams.get('type') === 'crypto' ? 'crypto' : 'stock';
  const years = Math.min(Math.max(parseInt(searchParams.get('years') ?? '10', 10) || 10, 1), 20);

  if (!symbol) {
    return NextResponse.json({ error: 'Parámetro "symbol" requerido' }, { status: 400 });
  }

  try {
    const candles =
      type === 'crypto'
        ? await cryptoHistory(symbol.endsWith('USDT') ? symbol : `${symbol}USDT`, years)
        : await stockHistory(symbol, years);

    const points: SeriesPoint[] = candles.map((c) => ({ time: c.time, value: c.close }));

    return NextResponse.json(
      { symbol, type, candles, points },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } }
    );
  } catch {
    return NextResponse.json({ error: `No se pudo obtener el historial de ${symbol}` }, { status: 500 });
  }
}
