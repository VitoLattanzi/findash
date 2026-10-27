'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries, CandlestickSeries, IChartApi, Time } from 'lightweight-charts';
import { useSeriesData } from '@/hooks/useSeriesData';
import { CATALOG } from '@/lib/catalog';
import { AssetType } from '@/types';

const OPTIONS = CATALOG.filter((c) => c.group !== 'commodities');

const ChartCell = ({ symbol, type }: { symbol: string; type: AssetType }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartType, setChartType] = useState<'area' | 'velas'>('area');
  const { points, candles, loading, error } = useSeriesData(symbol, type);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: '#161b25' }, textColor: '#8d97a8' },
      width: el.clientWidth || 300,
      height: 150,
      grid: { vertLines: { color: '#202632' }, horzLines: { color: '#202632' } },
      rightPriceScale: { borderColor: '#262d3b' },
      timeScale: { borderColor: '#262d3b', timeVisible: false },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    if (chartType === 'area') {
      const area = chart.addSeries(AreaSeries, {
        lineColor: '#4fc7bd',
        topColor: 'rgba(79,199,189,0.35)',
        bottomColor: 'rgba(79,199,189,0)',
        lineWidth: 2,
      });
      area.setData(points.map((p) => ({ time: p.time as Time, value: p.value })));
    } else {
      const candlestick = chart.addSeries(CandlestickSeries, {
        upColor: '#4fc7bd',
        downColor: '#d9685f',
        borderVisible: false,
        wickUpColor: '#4fc7bd',
        wickDownColor: '#d9685f',
      });
      candlestick.setData(
        candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
    }

    chart.timeScale().fitContent();

    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    const observer = new ResizeObserver(onResize);
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartType, points, candles]);

  return (
    <div className="bg-card border border-line rounded-[6px] p-[12px]">
      <div ref={chartContainerRef} className="h-[150px] w-full relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-dim text-[11.5px]">Cargando...</div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center text-dim text-[11.5px]">{error}</div>
        )}
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[11.5px] text-dim">{symbol}</span>
        <div className="flex border border-line rounded-[4px] overflow-hidden">
          <button
            onClick={() => setChartType('area')}
            className={`px-2 py-0.5 text-[10.5px] ${chartType === 'area' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            Área
          </button>
          <button
            onClick={() => setChartType('velas')}
            className={`px-2 py-0.5 text-[10.5px] ${chartType === 'velas' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            Velas
          </button>
        </div>
      </div>
    </div>
  );
};

export const MultiChartView = () => {
  const [mode, setMode] = useState<'g2' | 'g4'>('g4');
  const [slots, setSlots] = useState<Array<{ symbol: string; type: AssetType }>>([
    { symbol: 'BTC', type: 'crypto' },
    { symbol: 'ETH', type: 'crypto' },
    { symbol: 'NVDA', type: 'stock' },
    { symbol: 'MELI', type: 'stock' },
  ]);

  const count = mode === 'g4' ? 4 : 2;

  const updateSlot = (index: number, symbol: string) => {
    const found = OPTIONS.find((c) => c.symbol === symbol);
    if (!found) return;
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { symbol: found.symbol, type: found.type };
      return next;
    });
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Multigráficos</h2>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          <button
            onClick={() => setMode('g2')}
            className={`px-[14px] py-[7px] text-[12.5px] ${mode === 'g2' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            2 gráficos
          </button>
          <button
            onClick={() => setMode('g4')}
            className={`px-[14px] py-[7px] text-[12.5px] ${mode === 'g4' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            4 gráficos
          </button>
        </div>
      </div>
      <div className={`grid gap-[12px] ${mode === 'g4' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {slots.slice(0, count).map((slot, i) => (
          <div key={i}>
            <select
              value={slot.symbol}
              onChange={(e) => updateSlot(i, e.target.value)}
              className="w-full bg-bg2 border border-line text-text p-[6px_8px] rounded-[4px] mb-2 text-[12.5px]"
            >
              {OPTIONS.map((o) => (
                <option key={`${o.group}-${o.symbol}`} value={o.symbol}>
                  {o.symbol} — {o.label}
                </option>
              ))}
            </select>
            <ChartCell symbol={slot.symbol} type={slot.type} />
          </div>
        ))}
      </div>
    </section>
  );
};
