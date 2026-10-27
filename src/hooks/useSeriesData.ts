import { useEffect, useState } from 'react';
import { AssetType, SeriesPoint } from '@/types';
import { CATALOG } from '@/lib/catalog';

export interface CandlePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SeriesState {
  points: SeriesPoint[];
  candles: CandlePoint[];
  loading: boolean;
  error: string | null;
}

const EMPTY: SeriesState = { points: [], candles: [], loading: false, error: null };

function resolveType(symbol: string, type?: AssetType): AssetType {
  if (type) return type;
  return CATALOG.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase())?.type ?? 'stock';
}

export function useSeriesData(symbol?: string, type?: AssetType): SeriesState {
  const [state, setState] = useState<SeriesState>(EMPTY);

  useEffect(() => {
    if (!symbol) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, loading: true });

    const resolvedType = resolveType(symbol, type);

    const load = async () => {
      try {
        if (resolvedType === 'crypto') {
          const pair = symbol.toUpperCase().endsWith('USDT')
            ? symbol.toUpperCase()
            : `${symbol.toUpperCase()}USDT`;
          const res = await fetch(`/api/klines?symbols=${pair}&interval=1d&limit=500`);
          const json = await res.json();
          const raw = Array.isArray(json?.[pair]) ? json[pair] : [];

          const candles: CandlePoint[] = raw
            .map((k: { time: number; open: number; high: number; low: number; close: number }) => ({
              time: new Date(k.time).toISOString().slice(0, 10),
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
            }))
            .filter((c: CandlePoint, i: number, arr: CandlePoint[]) => i === 0 || c.time !== arr[i - 1].time);

          if (cancelled) return;
          setState({
            candles,
            points: candles.map((c) => ({ time: c.time, value: c.close })),
            loading: false,
            error: candles.length === 0 ? 'Sin datos para este activo.' : null,
          });
          return;
        }

        const res = await fetch(`/api/market?tickers=${encodeURIComponent(symbol)}&spark=1`);
        const json = await res.json();
        const entry = Array.isArray(json) ? json[0] : null;
        const series: SeriesPoint[] = Array.isArray(entry?.series) ? entry.series : [];

        const candles: CandlePoint[] = series.map((p, i) => {
          const prev = i > 0 ? series[i - 1].value : p.value;
          return {
            time: p.time,
            open: prev,
            high: Math.max(prev, p.value),
            low: Math.min(prev, p.value),
            close: p.value,
          };
        });

        if (cancelled) return;
        setState({
          candles,
          points: series,
          loading: false,
          error: series.length === 0 ? 'Sin datos para este activo.' : null,
        });
      } catch {
        if (!cancelled) {
          setState({ points: [], candles: [], loading: false, error: 'No se pudo cargar el historial.' });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [symbol, type]);

  return state;
}

