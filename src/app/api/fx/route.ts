import { NextResponse } from 'next/server';

interface FxResponse {
  base: 'USD';
  rates: { ARS: number; BRL: number; EUR: number; GBP: number; JPY: number; CNY: number; MXN: number; INR: number };
  updatedAt: string | null;
}

const CURRENCIES = ['ARS', 'BRL', 'EUR', 'GBP', 'JPY', 'CNY', 'MXN', 'INR'] as const;

async function fromErApi(): Promise<{ rates: Record<string, number>; updatedAt: string | null } | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (json?.result !== 'success' || !json?.rates) return null;
    return { rates: json.rates, updatedAt: json.time_last_update_utc ?? null };
  } catch {
    return null;
  }
}

async function fromFrankfurter(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL,EUR,GBP,JPY,CNY,MXN,INR', {
      next: { revalidate: 600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    return json?.rates ?? null;
  } catch {
    return null;
  }
}

async function fromDolarApi(): Promise<number | null> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', {
      next: { revalidate: 600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const value = json?.venta ?? json?.compra;
    return typeof value === 'number' ? value : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const primary = await fromErApi();

  const rates: Record<string, number | null> = {};
  if (primary) {
    for (const c of CURRENCIES) {
      const v = primary.rates[c];
      rates[c] = typeof v === 'number' ? v : null;
    }
  }

  if (CURRENCIES.some((c) => rates[c] == null)) {
    const fallback = await fromFrankfurter();
    if (fallback) {
      for (const c of CURRENCIES) {
        if (rates[c] == null && typeof fallback[c] === 'number') rates[c] = fallback[c];
      }
    }
  }

  if (rates.ARS == null) {
    const blue = await fromDolarApi();
    if (blue != null) rates.ARS = blue;
  }

  const payload: FxResponse = {
    base: 'USD',
    rates: {
      ARS: rates.ARS ?? 0,
      BRL: rates.BRL ?? 0,
      EUR: rates.EUR ?? 0,
      GBP: rates.GBP ?? 0,
      JPY: rates.JPY ?? 0,
      CNY: rates.CNY ?? 0,
      MXN: rates.MXN ?? 0,
      INR: rates.INR ?? 0,
    },
    updatedAt: primary?.updatedAt ?? null,
  };

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
  });
}
