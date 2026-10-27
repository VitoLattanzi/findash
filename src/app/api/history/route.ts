import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const BINANCE_HOSTS = ['https://api.binance.com', 'https://data-api.binance.vision'];

interface CandlePoint {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SeriesPoint {
  time: string | number;
  value: number;
}

const dayString = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const stamp = (ms: number) => Math.floor(ms / 1000);

async function binanceKlines(
  pair: string,
  interval: string,
  limit: number,
  endTime: number
): Promise<unknown[] | null> {
  for (const host of BINANCE_HOSTS) {
    try {
      const url = `${host}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}&endTime=${endTime}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const raw = await res.json();
      if (Array.isArray(raw)) return raw;
    } catch {
      // try next host
    }
  }
  return null;
}

function mapBinance(raw: unknown[], intraday: boolean): CandlePoint[] {
  return raw
    .map((k) => {
      if (!Array.isArray(k)) return null;
      const openMs = Number(k[0]);
      const candle: CandlePoint = {
        time: intraday ? stamp(openMs) : dayString(openMs),
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
      };
      return Number.isFinite(candle.close) ? candle : null;
    })
    .filter((c): c is CandlePoint => c !== null);
}

async function cryptoHistory(pair: string, years: number): Promise<CandlePoint[]> {
  const target = years * 366;
  const startMs = Date.now() - years * 365 * 24 * 60 * 60 * 1000;
  const out: CandlePoint[] = [];
  let endTime = Date.now();

  while (out.length < target) {
    const remaining = Math.min(1000, target - out.length);
    const batch = await binanceKlines(pair, '1d', remaining, endTime);
    if (!batch || batch.length === 0) break;

    const mapped = mapBinance(batch, false);
    if (mapped.length === 0) break;

    const firstMs = Number((batch[0] as unknown[])[0]);
    out.unshift(...mapped);
    endTime = firstMs - 1;
    if (endTime < startMs) break;
  }

  const seen = new Set<string | number>();
  return out.filter((c) => {
    if (seen.has(c.time)) return false;
    seen.add(c.time);
    return true;
  });
}

async function cryptoIntraday(pair: string, hours: number): Promise<CandlePoint[]> {
  const limit = Math.min(hours * 12 + 12, 1000);
  const batch = await binanceKlines(pair, '5m', limit, Date.now());
  return batch ? mapBinance(batch, true) : [];
}

function mapYahoo(quotes: any[], intraday: boolean): CandlePoint[] {
  const candles: CandlePoint[] = quotes
    .filter(
      (q) =>
        q?.date &&
        typeof q?.close === 'number' &&
        Number.isFinite(q.close) &&
        typeof q?.open === 'number'
    )
    .map((q) => ({
      time: intraday ? stamp(new Date(q.date).getTime()) : dayString(new Date(q.date).getTime()),
      open: q.open as number,
      high: typeof q.high === 'number' ? (q.high as number) : (q.close as number),
      low: typeof q.low === 'number' ? (q.low as number) : (q.close as number),
      close: q.close as number,
    }));

  const seen = new Set<string | number>();
  return candles
    .filter((c) => {
      if (seen.has(c.time)) return false;
      seen.add(c.time);
      return true;
    })
    .sort((a, b) => (a.time > b.time ? 1 : -1));
}

async function stockHistory(symbol: string, years: number): Promise<CandlePoint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - years * 365 * 24 * 60 * 60 * 1000);
  const chart: any = await yahooFinance.chart(symbol, {
    period1: start,
    period2: end,
    interval: '1d',
  });
  return mapYahoo(chart?.quotes ?? [], false);
}

async function stockIntraday(symbol: string, hours: number): Promise<CandlePoint[]> {
  const end = new Date();
  const days = Math.min(Math.ceil(hours / 24) + 3, 59);
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const chart: any = await yahooFinance.chart(symbol, {
    period1: start,
    period2: end,
    interval: '5m',
  });
  return mapYahoo(chart?.quotes ?? [], true);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') ?? '').trim().toUpperCase();
  const type = searchParams.get('type') === 'crypto' ? 'crypto' : 'stock';
  const intraday = searchParams.get('interval') === '5m';
  const years = Math.min(Math.max(parseInt(searchParams.get('years') ?? '10', 10) || 10, 1), 20);
  const hours = Math.min(Math.max(parseInt(searchParams.get('hours') ?? '24', 10) || 24, 1), 240);

  if (!symbol) {
    return NextResponse.json({ error: 'Parámetro "symbol" requerido' }, { status: 400 });
  }

  try {
    let candles: CandlePoint[];

    if (type === 'crypto') {
      const pair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
      candles = intraday ? await cryptoIntraday(pair, hours) : await cryptoHistory(pair, years);
    } else {
      candles = intraday ? await stockIntraday(symbol, hours) : await stockHistory(symbol, years);
    }

    const points: SeriesPoint[] = candles.map((c) => ({ time: c.time, value: c.close }));

    return NextResponse.json(
      { symbol, type, interval: intraday ? '5m' : '1d', candles, points },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch {
    return NextResponse.json({ error: `No se pudo obtener el historial de ${symbol}` }, { status: 500 });
  }
}
