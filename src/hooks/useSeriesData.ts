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
    const upper = symbol.toUpperCase();
    const pair =
      resolvedType === 'crypto' && !upper.endsWith('USDT') ? `${upper}USDT` : upper;

    fetch(`/api/history?symbol=${encodeURIComponent(pair)}&type=${resolvedType}&years=10`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const candles: CandlePoint[] = Array.isArray(json?.candles) ? json.candles : [];
        const points: SeriesPoint[] = Array.isArray(json?.points) ? json.points : [];
        setState({
          candles,
          points,
          loading: false,
          error: candles.length === 0 ? 'Sin datos para este activo.' : null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ points: [], candles: [], loading: false, error: 'No se pudo cargar el historial.' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, type]);

  return state;
}
