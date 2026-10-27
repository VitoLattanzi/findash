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
  name: string | null;
  currency: string | null;
  bars: number[] | null;
  series: SeriesPoint[] | null;
  error: string | null;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function historyFor(symbol: string): Promise<SeriesPoint[] | null> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 120);
    const chart: any = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: '1d',
    });
    const series: SeriesPoint[] = (chart?.quotes ?? [])
      .filter((q: any) => typeof q?.close === 'number' && Number.isFinite(q.close) && q?.date)
      .map((q: any) => ({
        time: toDateString(new Date(q.date)),
        value: q.close as number,
      }))
      .filter((p: SeriesPoint, i: number, arr: SeriesPoint[]) => i === 0 || p.time !== arr[i - 1].time);
    return series.length >= 2 ? series : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers');
  const withSpark = searchParams.get('spark') === '1';

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

    const results: MarketResult[] = await Promise.all(
      symbols.map(async (symbol) => {
        const q = bySymbol.get(symbol);
        if (!q) {
          return {
            symbol,
            price: null,
            change: null,
            name: null,
            currency: null,
            bars: null,
            series: null,
            error: `Sin datos para ${symbol}`,
          };
        }

        const series = withSpark ? await historyFor(symbol) : null;

        return {
          symbol,
          price: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : null,
          change: typeof q.regularMarketChangePercent === 'number' ? q.regularMarketChangePercent : null,
          name: q.displayName || q.shortName || q.longName || null,
          currency: q.currency || null,
          bars: series ? series.map((p) => p.value) : null,
          series,
          error: null,
        };
      })
    );

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno al consultar Yahoo Finance' }, { status: 500 });
  }
}
