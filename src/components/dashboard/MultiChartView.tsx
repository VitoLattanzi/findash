'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries, IChartApi } from 'lightweight-charts';

const ASSETS = ["BTC", "ETH", "SOL", "NVDA", "AAPL", "MELI", "Oro", "Petróleo WTI"];

const ChartItem = ({ symbol }: { symbol: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#161b25' }, textColor: '#8d97a8' },
      width: 300,
      height: 130,
      grid: { vertLines: { color: '#262d3b' }, horzLines: { color: '#262d3b' } },
    });
    chartRef.current = chart;
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#4fc7bd',
      topColor: '#4fc7bd',
      bottomColor: 'rgba(79,199,189,0)',
    });
    areaSeries.setData([{ time: '2023-01-01', value: 100 }, { time: '2023-01-02', value: 120 }]);
    return () => chart.remove();
  }, [symbol]);

  return <div ref={chartContainerRef} className="h-[130px] w-full" />;
};

export const MultiChartView = () => {
  const [mode, setMode] = useState<'g2' | 'g4'>('g4');
  const [symbols, setSymbols] = useState<string[]>(['BTC', 'ETH', 'SOL', 'NVDA']);

  const updateSymbol = (index: number, newSymbol: string) => {
    const newSymbols = [...symbols];
    newSymbols[index] = newSymbol;
    setSymbols(newSymbols);
  };

  const count = mode === 'g4' ? 4 : 2;

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Multigráficos</h2>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          <button onClick={() => setMode('g2')} className={`px-[14px] py-[7px] text-[12.5px] ${mode === 'g2' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}>2 gráficos</button>
          <button onClick={() => setMode('g4')} className={`px-[14px] py-[7px] text-[12.5px] ${mode === 'g4' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}>4 gráficos</button>
        </div>
      </div>
      <div className={`grid gap-[12px] ${mode === 'g4' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {symbols.slice(0, count).map((symbol, i) => (
          <div key={i} className="bg-card border border-line rounded-[6px] p-[12px]">
            <select 
              value={symbol}
              onChange={(e) => updateSymbol(i, e.target.value)}
              className="w-full bg-bg2 border border-line text-text p-[6px_8px] rounded-[4px] mb-2 text-[12.5px]"
            >
              {ASSETS.map(a => <option key={a}>{a}</option>)}
            </select>
            <ChartItem symbol={symbol} />
          </div>
        ))}
      </div>
    </section>
  );
};
