'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChangeTimeframe } from '@/lib/timeframe';
import { getQuotes } from '@/lib/quotes';

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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
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
        const nextMap = await getQuotes(symbolsStr, { timeframe, withSpark });
        if (Object.keys(nextMap).length > 0) {
          setQuotesMap((prev) => (keepPreviousData ? { ...prev, ...nextMap } : nextMap));
          hasDataRef.current = true;
          setLastUpdatedAt(Date.now());
        } else if (!hasDataRef.current) {
          setError('No se pudo obtener la data de mercado');
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
    lastUpdatedAt,
    refetch: () => fetchBatch(true),
  };
}
