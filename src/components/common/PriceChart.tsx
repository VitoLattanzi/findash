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
      timeScale: { borderColor: '#262d3b', rightOffset: 0 },
      crosshair: { mode: 0 },
    });

    const dataLength = chartType === 'area' ? points.length : candles.length;

    if (chartType === 'area') {
      const series = chart.addSeries(AreaSeries, {
        lineColor: '#4fc7bd',
        topColor: 'rgba(79,199,189,0.35)',
        bottomColor: 'rgba(79,199,189,0)',
        lineWidth: 2,
      });
      if (points.length > 0) {
        series.setData(points.map((p) => ({ time: p.time as Time, value: p.value })));
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
      }
    }

    if (dataLength > 0) chart.timeScale().fitContent();

    // Never let the newest data go past the middle of the visible chart
    let clamping = false;
    const lastIndex = Math.max(dataLength - 1, 0);
    const onRangeChange = (range: { from: number; to: number } | null) => {
      if (clamping || !range || dataLength === 0) return;
      const span = range.to - range.from;
      const maxTo = lastIndex + span / 2;
      if (range.to > maxTo) {
        clamping = true;
        chart.timeScale().setVisibleLogicalRange({ from: maxTo - span, to: maxTo });
        clamping = false;
      }
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

    // Drag-to-zoom: drag a selection box to zoom into that area
    let startX: number | null = null;
    let selecting = false;
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.bottom = '26px';
    overlay.style.background = 'rgba(79,199,189,0.15)';
    overlay.style.borderLeft = '1px solid #4fc7bd';
    overlay.style.borderRight = '1px solid #4fc7bd';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    overlay.style.zIndex = '5';
    el.appendChild(overlay);

    const plotWidth = () => el.clientWidth - chart.priceScale('right').width();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > plotWidth()) return;
      startX = x;
      selecting = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (startX == null) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(plotWidth(), e.clientX - rect.left));

      if (!selecting && Math.abs(x - startX) > 6) {
        selecting = true;
        chart.applyOptions({ handleScroll: false, handleScale: false });
      }
      if (selecting) {
        const left = Math.min(startX, x);
        const width = Math.abs(x - startX);
        overlay.style.left = `${left}px`;
        overlay.style.width = `${width}px`;
        overlay.style.display = 'block';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (startX == null) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(plotWidth(), e.clientX - rect.left));

      if (selecting) {
        chart.applyOptions({ handleScroll: true, handleScale: true });
        const ts = chart.timeScale();
        const a = ts.coordinateToLogical(Math.min(startX, x));
        const b = ts.coordinateToLogical(Math.max(startX, x));
        if (a != null && b != null && b - a >= 2) {
          ts.setVisibleLogicalRange({ from: a, to: b });
        }
      }

      overlay.style.display = 'none';
      startX = null;
      selecting = false;
    };

    const onDoubleClick = () => chart.timeScale().fitContent();

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('dblclick', onDoubleClick);

    const observer = new ResizeObserver(() => {
      if (el.clientWidth) chart.applyOptions({ width: el.clientWidth });
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('dblclick', onDoubleClick);
      overlay.remove();
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
      <div ref={containerRef} style={{ height }} className="w-full cursor-crosshair select-none" />
      <div className="text-[10px] text-dim mt-1">Arrastrá sobre el gráfico para ampliar · doble click para resetear</div>
    </div>
  );
};
