'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChangeTimeframe } from '@/lib/timeframe';

export interface UnifiedQuote {
  symbol: string;
  name: string | null;
  price: number | null;
  change: number | null;
  changePct: number | null;
  volume?: number | null;
  avgVolume?: number | null;
  marketCap?: number | null;
  marketState?: string | null;
  preMarketPrice?: number | null;
  preMarketChangePct?: number | null;
  postMarketPrice?: number | null;
  postMarketChangePct?: number | null;
  bars?: number[] | null;
  ts?: string | number | Date | null;
}

interface UseQuotesOptions {
  timeframe?: ChangeTimeframe;
  withSpark?: boolean;
  keepPreviousData?: boolean;
}

export function useQuotes(
  symbolsInput: string | string[],
  options: UseQuotesOptions = {}
) {
  const {
    timeframe = '24h',
    withSpark = false,
    keepPreviousData = true,
  } = options;

  const symbolsStr = Array.isArray(symbolsInput)
    ? Array.from(new Set(symbolsInput.map((s) => s.trim().toUpperCase()).filter(Boolean))).join(',')
    : symbolsInput.trim();

  const [quotesMap, setQuotesMap] = useState<Record<string, UnifiedQuote>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetchBatch = useCallback(
    async (isBackground = false) => {
      if (!symbolsStr) {
        setLoading(false);
        return;
      }

      if (!isBackground && (!keepPreviousData || !hasDataRef.current)) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        if (withSpark || timeframe !== '24h') {
          const res = await fetch(
            `/api/market?tickers=${encodeURIComponent(symbolsStr)}&timeframe=${encodeURIComponent(timeframe)}&spark=${withSpark ? '1' : '0'}`
          );
          const data = await res.json();
          if (Array.isArray(data)) {
            const nextMap: Record<string, UnifiedQuote> = {};
            for (const item of data) {
              if (!item?.symbol) continue;
              const chg = typeof item.change === 'number' ? item.change : null;
              nextMap[item.symbol] = {
                symbol: item.symbol,
                name: item.name ?? item.symbol,
                price: typeof item.price === 'number' ? item.price : null,
                change: chg,
                changePct: chg,
                volume: typeof item.volume === 'number' ? item.volume : null,
                avgVolume: typeof item.avgVolume === 'number' ? item.avgVolume : null,
                marketCap: typeof item.marketCap === 'number' ? item.marketCap : null,
                marketState: item.marketState ?? 'CLOSED',
                preMarketPrice: item.preMarketPrice ?? null,
                preMarketChangePct: item.preMarketChange ?? null,
                postMarketPrice: item.postMarketPrice ?? null,
                postMarketChangePct: item.postMarketChange ?? null,
                bars: item.bars ?? null,
              };
            }
            setQuotesMap((prev) => (keepPreviousData ? { ...prev, ...nextMap } : nextMap));
            hasDataRef.current = true;
          } else {
            setError(data?.error || 'No se pudo obtener la data de mercado');
          }
        } else {
          const res = await fetch(`/api/quotes?s=${encodeURIComponent(symbolsStr)}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            const nextMap: Record<string, UnifiedQuote> = {};
            for (const q of data) {
              if (!q?.symbol) continue;
              const chg = typeof q.changePct === 'number' ? q.changePct : null;
              nextMap[q.symbol] = {
                symbol: q.symbol,
                name: q.name ?? q.symbol,
                price: typeof q.price === 'number' ? q.price : null,
                change: chg,
                changePct: chg,
                volume: typeof q.volume === 'number' ? q.volume : null,
                avgVolume: typeof q.avgVolume === 'number' ? q.avgVolume : null,
                marketCap: typeof q.marketCap === 'number' ? q.marketCap : null,
                marketState: q.marketState ?? 'CLOSED',
                preMarketPrice: q.preMarketPrice ?? null,
                preMarketChangePct: q.preMarketChangePct ?? null,
                postMarketPrice: q.postMarketPrice ?? null,
                postMarketChangePct: q.postMarketChangePct ?? null,
                ts: q.ts ?? null,
              };
            }
            setQuotesMap((prev) => (keepPreviousData ? { ...prev, ...nextMap } : nextMap));
            hasDataRef.current = true;
          }
        }
      } catch {
        if (!isBackground) {
          setError('No se pudo obtener la data de mercado');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [symbolsStr, timeframe, withSpark, keepPreviousData]
  );

  // Carga inicial o cuando cambian símbolos / timeframe
  useEffect(() => {
    fetchBatch(false);
  }, [fetchBatch]);

  // Polling inteligente según marketState: 60s si REGULAR (abierto), 10 min (600_000ms) si cerrado
  useEffect(() => {
    if (!symbolsStr) return;
    const values = Object.values(quotesMap);
    const anyRegularOpen = values.some((q) => q.marketState === 'REGULAR');
    const intervalMs = anyRegularOpen ? 60_000 : 600_000;

    const timer = setInterval(() => {
      fetchBatch(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [symbolsStr, quotesMap, fetchBatch]);

  return {
    quotesMap,
    loading,
    refreshing,
    error,
    refetch: () => fetchBatch(true),
  };
}
