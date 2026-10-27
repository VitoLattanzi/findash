'use client';
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries, CandlestickSeries, IChartApi, Time } from 'lightweight-charts';
import { useSeriesData, CandlePoint } from '@/hooks/useSeriesData';
import { AssetType, SeriesPoint } from '@/types';

interface PriceChartProps {
  symbol?: string;
  type?: AssetType;
  chartType: 'area' | 'velas';
  height?: number;
  className?: string;
  points?: SeriesPoint[];
  candles?: CandlePoint[];
  loading?: boolean;
  error?: string | null;
}

export const PriceChart = ({
  symbol,
  type,
  chartType,
  height = 280,
  className,
  points: pointsProp,
  candles: candlesProp,
  loading: loadingProp,
  error: errorProp,
}: PriceChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const useExternal = Array.isArray(pointsProp) && Array.isArray(candlesProp);
  const fetched = useSeriesData(useExternal ? undefined : symbol, type);

  const points = useExternal ? (pointsProp as SeriesPoint[]) : fetched.points;
  const candles = useExternal ? (candlesProp as CandlePoint[]) : fetched.candles;
  const loading = useExternal ? !!loadingProp : fetched.loading;
  const error = useExternal ? (errorProp ?? null) : fetched.error;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart: IChartApi = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: '#161b25' }, textColor: '#8d97a8' },
      width: el.clientWidth || 360,
      height,
      grid: { vertLines: { color: '#202632' }, horzLines: { color: '#202632' } },
      rightPriceScale: { borderColor: '#262d3b' },
      timeScale: { borderColor: '#262d3b' },
    });

    if (chartType === 'area') {
      const series = chart.addSeries(AreaSeries, {
        lineColor: '#4fc7bd',
        topColor: 'rgba(79,199,189,0.35)',
        bottomColor: 'rgba(79,199,189,0)',
        lineWidth: 2,
      });
      if (points.length > 0) {
        series.setData(points.map((p) => ({ time: p.time as Time, value: p.value })));
        chart.timeScale().fitContent();
      }
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#4fc7bd',
        downColor: '#d9685f',
        borderVisible: false,
        wickUpColor: '#4fc7bd',
        wickDownColor: '#d9685f',
      });
      if (candles.length > 0) {
        series.setData(
          candles.map((c) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
        chart.timeScale().fitContent();
      }
    }

    const observer = new ResizeObserver(() => {
      if (el.clientWidth) chart.applyOptions({ width: el.clientWidth });
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [chartType, points, candles, height]);

  return (
    <div className={`relative ${className ?? ''}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-dim text-[12px] z-10">
          Cargando gráfico...
        </div>
      )}
      {!loading && error && (
        <div className="absolute inset-0 flex items-center justify-center text-dim text-[12px] z-10">
          {error}
        </div>
      )}
      <div ref={containerRef} style={{ height }} className="w-full" />
    </div>
  );
};
