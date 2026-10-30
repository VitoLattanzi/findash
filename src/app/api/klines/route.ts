import { NextRequest, NextResponse } from 'next/server';

export interface Candle {
  time: number; // epoch ms
  open: number;
  high: number;
  low: number;
  close: number;
}

const HOSTS = ['https://api.binance.com', 'https://data-api.binance.vision'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  const interval = searchParams.get('interval') || '1d';
  const limit = Math.min(parseInt(searchParams.get('limit') || '90', 10) || 90, 500);

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Parámetro "symbols" requerido' }, { status: 400 });
  }

  const symbols = Array.from(
    new Set(
      symbolsParam
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, 60);

  const result: Record<string, Candle[]> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      for (const host of HOSTS) {
        try {
          const url = `${host}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          const raw = (await res.json()) as unknown;
          if (!Array.isArray(raw)) continue;
          result[symbol] = raw
            .map((k) => {
              if (!Array.isArray(k)) return null;
              const candle: Candle = {
                time: Number(k[0]),
                open: parseFloat(k[1] as string),
                high: parseFloat(k[2] as string),
                low: parseFloat(k[3] as string),
                close: parseFloat(k[4] as string),
              };
              return Number.isFinite(candle.close) ? candle : null;
            })
            .filter((c): c is Candle => c !== null);
          return;
        } catch {
          // try next host
        }
      }
      result[symbol] = [];
    })
  );

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
