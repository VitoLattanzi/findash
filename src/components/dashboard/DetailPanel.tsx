'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, CandlestickSeries, IChartApi, Time } from 'lightweight-charts';
import { X } from 'lucide-react';
import { Asset } from '@/types';
import { useSeriesData } from '@/hooks/useSeriesData';
import { formatPrice } from '@/lib/format';

interface DetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIMEFRAMES = ['1D', '1S', '1M', '3M', '6M', '1A', '2A'];

export const DetailPanel = ({ asset, isOpen, onClose }: DetailPanelProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartType, setChartType] = useState<'area' | 'velas'>('area');
  const [timeframe, setTimeframe] = useState('1M');

  const symbol = asset?.symbol ?? asset?.name;
  const { points, candles, loading, error } = useSeriesData(
    isOpen ? symbol : undefined,
    asset?.type
  );

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!isOpen || !el) return;

    const chart = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: '#161b25' }, textColor: '#8d97a8' },
      width: el.clientWidth || 376,
      height: 280,
      grid: { vertLines: { color: '#202632' }, horzLines: { color: '#202632' } },
      rightPriceScale: { borderColor: '#262d3b' },
      timeScale: { borderColor: '#262d3b' },
    });
    chartRef.current = chart;

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
      chartRef.current = null;
    };
  }, [isOpen, symbol, chartType, points, candles]);

  if (!isOpen || !asset) return null;

  const last = candles[candles.length - 1];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-[420px] max-w-[92vw] bg-card border-l border-line z-[21] overflow-y-auto p-[22px]">
        <button onClick={onClose} className="absolute top-4 right-4 text-dim hover:text-text" aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="mb-4 pr-8">
          <div className="text-[22px] font-display font-semibold">{asset.name}</div>
          <div className="text-[20px] font-display font-semibold mt-1">${formatPrice(asset.price)}</div>
          <div className={`text-[13px] ${asset.change >= 0 ? 'text-teal' : 'text-red'}`}>
            {asset.change >= 0 ? '+' : ''}
            {asset.change.toFixed(2)}% hoy
          </div>
        </div>

        <div className="flex gap-1.5 mb-3">
          {(['area', 'velas'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-[10px] py-1 text-[11.5px] rounded-full border border-line ${
                chartType === type ? 'bg-gold text-bg' : 'text-dim'
              }`}
            >
              {type === 'area' ? 'Área' : 'Velas'}
            </button>
          ))}
        </div>

        <div className="relative">
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
          <div ref={chartContainerRef} className="h-[280px] mb-3 w-full" />
        </div>

        <div className="flex gap-1 mb-4 flex-wrap">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-[10px] py-1 text-[11.5px] rounded-full border border-line ${
                timeframe === tf ? 'bg-gold text-bg' : 'text-dim'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[12px] text-dim mb-4">
          <div>
            Apertura
            <b className="block text-text text-[13.5px]">${formatPrice(last?.open)}</b>
          </div>
          <div>
            Máximo
            <b className="block text-text text-[13.5px]">${formatPrice(last?.high)}</b>
          </div>
          <div>
            Mínimo
            <b className="block text-text text-[13.5px]">${formatPrice(last?.low)}</b>
          </div>
        </div>

        <div className="bg-bg2 border border-dashed border-line rounded-[5px] p-[12px_14px] text-[12.5px] mb-4">
          <b className="text-red">Análisis</b> — espacio reservado para la lógica de análisis crítico
          (¿caro o barato según su contexto?).
        </div>

        <div className="bg-card border border-line rounded-[6px] p-4">
          <h3 className="text-[13.5px] text-dim font-medium mb-2.5">NOTICIAS DEL ACTIVO</h3>
          <div className="text-dim text-[12px]">
            Próximamente: titulares filtrados por activo desde el feed RSS.
          </div>
        </div>
      </aside>
    </>
  );
};
