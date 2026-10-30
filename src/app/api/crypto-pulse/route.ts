import { NextResponse } from 'next/server';

export interface TopTraderPosition {
  symbol: string;
  longAccount: number; // % (0-100)
  shortAccount: number; // % (0-100)
  longShortRatio: number;
}

export interface CryptoPulseResponse {
  positions: Record<'BTC' | 'ETH' | 'SOL', TopTraderPosition>;
  takerBuySell: {
    buySellRatio: number;
    buyVol: number;
    sellVol: number;
  };
  fundingRatePct: number; // Ej: 0.0100 para 0.01%
  markPrice: number | null;
  fearAndGreed: {
    value: number;
    classification: string;
  };
  criticalReading: {
    tone: 'warning' | 'bullish' | 'neutral';
    message: string;
  };
  updatedAt: number;
}

let cachedPulse: { data: CryptoPulseResponse; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchJsonWithTimeout(url: string, timeoutMs = 4500): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

async function fetchTopTraderRatio(symbol: 'BTC' | 'ETH' | 'SOL', fallbackLong: number): Promise<TopTraderPosition> {
  const pair = `${symbol}USDT`;
  const data = await fetchJsonWithTimeout(
    `https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${pair}&period=1h&limit=1`
  );
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (row) {
    const longPct = Math.round(parseFloat(row.longAccount) * 1000) / 10;
    const shortPct = Math.round(parseFloat(row.shortAccount) * 1000) / 10;
    const ratio = parseFloat(row.longShortRatio) || longPct / Math.max(shortPct, 1);
    if (Number.isFinite(longPct) && Number.isFinite(shortPct) && longPct > 0) {
      return {
        symbol,
        longAccount: longPct,
        shortAccount: shortPct,
        longShortRatio: Number(ratio.toFixed(2)),
      };
    }
  }
  const shortFallback = Number((100 - fallbackLong).toFixed(1));
  return {
    symbol,
    longAccount: fallbackLong,
    shortAccount: shortFallback,
    longShortRatio: Number((fallbackLong / shortFallback).toFixed(2)),
  };
}

export async function GET() {
  const now = Date.now();
  if (cachedPulse && now - cachedPulse.ts < CACHE_TTL_MS) {
    return NextResponse.json(cachedPulse.data);
  }

  const [btcPos, ethPos, solPos, takerData, premiumData, fngData] = await Promise.all([
    fetchTopTraderRatio('BTC', 62.4),
    fetchTopTraderRatio('ETH', 58.7),
    fetchTopTraderRatio('SOL', 64.1),
    fetchJsonWithTimeout(
      'https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=1'
    ),
    fetchJsonWithTimeout('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT'),
    fetchJsonWithTimeout('https://api.alternative.me/fng/?limit=1'),
  ]);

  // Taker Buy/Sell Volume Ratio
  const takerRow = Array.isArray(takerData) && takerData.length > 0 ? takerData[0] : null;
  const buySellRatio = takerRow ? parseFloat(takerRow.buySellRatio) || 1.04 : 1.04;
  const buyVol = takerRow ? parseFloat(takerRow.buyVol) || 0 : 0;
  const sellVol = takerRow ? parseFloat(takerRow.sellVol) || 0 : 0;

  // Funding Rate (Binance devuelve decimal, ej. "0.00010000" = 0.01%)
  const rawFunding = premiumData?.lastFundingRate ? parseFloat(premiumData.lastFundingRate) : 0.0001;
  const fundingRatePct = Number((rawFunding * 100).toFixed(4));
  const markPrice = premiumData?.markPrice ? parseFloat(premiumData.markPrice) : null;

  // Fear & Greed Index
  const fngEntry = Array.isArray(fngData?.data) && fngData.data.length > 0 ? fngData.data[0] : null;
  const fngValue = fngEntry ? Number(fngEntry.value) || 55 : 55;
  const fngClass = fngEntry?.value_classification ?? 'Neutral';

  // Lectura crítica automática combinando Sentimiento + Funding Rate
  let criticalReading: CryptoPulseResponse['criticalReading'] = {
    tone: 'neutral',
    message: '⚖️ Mercado equilibrado sin excesos de apalancamiento',
  };

  if (fngValue > 75 || fundingRatePct > 0.03) {
    criticalReading = {
      tone: 'warning',
      message: '⚠️ Euforia minorista: Riesgo de toma de ganancias de ballenas',
    };
  } else if (fngValue < 30 || fundingRatePct < 0) {
    criticalReading = {
      tone: 'bullish',
      message: '🟢 Miedo en el mercado: Zona histórica de acumulación institucional',
    };
  }

  const response: CryptoPulseResponse = {
    positions: {
      BTC: btcPos,
      ETH: ethPos,
      SOL: solPos,
    },
    takerBuySell: {
      buySellRatio: Number(buySellRatio.toFixed(2)),
      buyVol,
      sellVol,
    },
    fundingRatePct,
    markPrice,
    fearAndGreed: {
      value: fngValue,
      classification: fngClass,
    },
    criticalReading,
    updatedAt: now,
  };

  cachedPulse = { data: response, ts: now };
  return NextResponse.json(response);
}
