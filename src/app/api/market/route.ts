import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export interface SeriesPoint {
  time: string;
  value: number;
}

interface MarketResult {
  symbol: string;
  price: number | null;
  change: number | null;
  volume?: number | null;
  name: string | null;
  currency: string | null;
  bars: number[] | null;
  series: SeriesPoint[] | null;
  error: string | null;
  marketCap?: number | null;
  marketState?: string | null;
  preMarketPrice?: number | null;
  preMarketChange?: number | null;
  postMarketPrice?: number | null;
  postMarketChange?: number | null;
}

interface HistoryData {
  series: SeriesPoint[];
  bars: number[];
  changePct: number | null;
}

const historyCache = new Map<string, { ts: number; data: HistoryData | null }>();
const CACHE_TTL_MS = 120_000;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function historyFor(symbol: string, timeframe: string): Promise<HistoryData | null> {
  const cacheKey = `${symbol}:${timeframe}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const end = new Date();
    let daysBack = 30;
    let interval: '15m' | '30m' | '1h' | '1d' = '1d';
    let sliceCount: number | null = null;

    switch (timeframe) {
      case '12h':
        daysBack = 5;
        interval = '15m';
        sliceCount = 16; // Última media jornada / ventana intradiaria
        break;
      case '24h':
        daysBack = 5;
        interval = '30m';
        sliceCount = 16; // Última rueda completa
        break;
      case '1sem':
        daysBack = 8;
        interval = '1h';
        break;
      case '1mes':
        daysBack = 32;
        interval = '1d';
        break;
      case '3meses':
        daysBack = 93;
        interval = '1d';
        break;
      default:
        daysBack = 32;
        interval = '1d';
        break;
    }

    const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * daysBack);
    const chart: any = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval,
    });

    const rawQuotes = (chart?.quotes ?? []).filter(
      (q: any) => typeof q?.close === 'number' && Number.isFinite(q.close) && q?.date
    );

    const sliced = sliceCount ? rawQuotes.slice(-sliceCount) : rawQuotes;
    if (sliced.length < 2) {
      historyCache.set(cacheKey, { ts: Date.now(), data: null });
      return null;
    }

    const series: SeriesPoint[] = sliced.map((q: any) => ({
      time:
        interval === '1d'
          ? toDateString(new Date(q.date))
          : new Date(q.date).toISOString(),
      value: q.close as number,
    }));

    const bars = series.map((p) => p.value);
    const firstOpen =
      typeof sliced[0].open === 'number' && sliced[0].open > 0
        ? (sliced[0].open as number)
        : bars[0];
    const lastClose = bars[bars.length - 1];
    const changePct =
      firstOpen > 0 ? ((lastClose - firstOpen) / firstOpen) * 100 : null;

    const result: HistoryData = { series, bars, changePct };
    historyCache.set(cacheKey, { ts: Date.now(), data: result });
    return result;
  } catch {
    historyCache.set(cacheKey, { ts: Date.now(), data: null });
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers');
  const timeframe = searchParams.get('timeframe') || '24h';
  const withSpark = searchParams.get('spark') === '1' || timeframe !== '24h';

  if (!tickers) {
    return NextResponse.json(
      { error: 'El parámetro "tickers" es requerido (ej: ?tickers=AAPL,NVDA)' },
      { status: 400 }
    );
  }

  const symbols = Array.from(
    new Set(
      tickers
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );

  if (symbols.length === 0) {
    return NextResponse.json({ error: 'No se recibieron tickers válidos' }, { status: 400 });
  }

  try {
    const quotes: any[] = [];
    for (const group of chunk(symbols, 50)) {
      try {
        const res: any = await yahooFinance.quote(group);
        quotes.push(...(Array.isArray(res) ? res : [res]));
      } catch {
        for (const sym of group) {
          try {
            const q: any = await yahooFinance.quote(sym);
            quotes.push(q);
          } catch {
            // ignore individual failure
          }
        }
      }
    }

    const bySymbol = new Map<string, any>();
    for (const q of quotes) {
      if (q?.symbol) bySymbol.set(q.symbol, q);
    }

    const historyBySymbol = new Map<string, HistoryData | null>();
    if (withSpark) {
      for (const batch of chunk(symbols, 15)) {
        await Promise.all(
          batch.map(async (sym) => {
            if (!bySymbol.has(sym)) return;
            const h = await historyFor(sym, timeframe);
            historyBySymbol.set(sym, h);
          })
        );
      }
    }

    const results: MarketResult[] = symbols.map((symbol) => {
      const q = bySymbol.get(symbol);
      if (!q) {
        return {
          symbol,
          price: null,
          change: null,
          volume: null,
          name: null,
          currency: null,
          bars: null,
          series: null,
          error: `Sin datos para ${symbol}`,
        };
      }

      const hist = historyBySymbol.get(symbol) ?? null;
      const regularChange =
        typeof q.regularMarketChangePercent === 'number' ? q.regularMarketChangePercent : null;

      // En '24h' priorizamos la variación oficial de la sesión de Yahoo Finance;
      // en otros rangos ('12h', '1sem', '1mes', '3meses') usamos el cálculo del período.
      const computedChange =
        timeframe === '24h'
          ? regularChange ?? hist?.changePct ?? null
          : hist?.changePct ?? regularChange;

      return {
        symbol,
        price: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : null,
        change: computedChange,
        volume: typeof q.regularMarketVolume === 'number' ? q.regularMarketVolume : null,
        name: q.displayName || q.shortName || q.longName || null,
        currency: q.currency || null,
        bars: hist ? hist.bars : null,
        series: hist ? hist.series : null,
        error: null,
        marketCap:
          typeof q.marketCap === 'number'
            ? q.marketCap
            : typeof q.netAssets === 'number'
              ? q.netAssets
              : typeof q.totalAssets === 'number'
                ? q.totalAssets
                : null,
        marketState: q.marketState || null,
        preMarketPrice: typeof q.preMarketPrice === 'number' ? q.preMarketPrice : null,
        preMarketChange: typeof q.preMarketChangePercent === 'number' ? q.preMarketChangePercent : null,
        postMarketPrice: typeof q.postMarketPrice === 'number' ? q.postMarketPrice : null,
        postMarketChange: typeof q.postMarketChangePercent === 'number' ? q.postMarketChangePercent : null,
      };
    });

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno al consultar Yahoo Finance' }, { status: 500 });
  }
}
