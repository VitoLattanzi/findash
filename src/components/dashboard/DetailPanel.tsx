import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { X } from 'lucide-react';
import { Asset } from '@/types';

interface DetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DetailPanel = ({ asset, isOpen, onClose }: DetailPanelProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartType, setChartType] = useState<'area' | 'velas'>('velas');
  const [timeframe, setTimeframe] = useState('1D');

  useEffect(() => {
    if (!isOpen || !chartContainerRef.current || !asset) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#161b25' }, textColor: '#8d97a8' },
      width: 400,
      height: 300,
      grid: { vertLines: { color: '#262d3b' }, horzLines: { color: '#262d3b' } },
    });
    chartRef.current = chart;

    if (chartType === 'area') {
      const areaSeries = chart.addAreaSeries({ lineColor: '#4fc7bd', topColor: '#4fc7bd', bottomColor: 'rgba(79,199,189,0)' });
      areaSeries.setData([
        { time: '2023-01-01', value: 100 },
        { time: '2023-01-02', value: 125 },
      ]);
    } else {
      const candleSeries = chart.addCandlestickSeries();
      candleSeries.setData([
        { time: '2023-01-01', open: 100, high: 120, low: 90, close: 110 },
        { time: '2023-01-02', open: 110, high: 130, low: 105, close: 125 },
      ]);
    }

    return () => {
      chart.remove();
    };
  }, [isOpen, asset, chartType]);

  if (!isOpen || !asset) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-[420px] bg-card border-l border-line z-21 overflow-y-auto p-[22px] transition-transform">
        <button onClick={onClose} className="absolute top-4 right-4 text-dim"><X /></button>
        
        <div className="mb-4">
          <div className="text-[22px] font-display font-semibold">{asset.name}</div>
          <div className={`text-[13px] ${(asset.change || 0) >= 0 ? 'text-teal' : 'text-red'}`}>
            {(asset.change || 0) >= 0 ? '+' : ''}{(asset.change || 0).toFixed(2)}% hoy
          </div>
        </div>

        <div className="flex gap-1.5 mb-4">
          {(['area', 'velas'] as const).map((type) => (
            <button key={type} onClick={() => setChartType(type)} className={`px-[10px] py-1 text-[11.5px] rounded-full border border-line ${chartType === type ? 'bg-gold text-bg' : 'text-dim'}`}>
              {type === 'area' ? 'Área' : 'Velas'}
            </button>
          ))}
        </div>

        <div ref={chartContainerRef} className="h-[300px] mb-4" />

        <div className="flex gap-1 mb-4 flex-wrap">
          {['1D', '1S', '1M', '3M', '6M', '1A', '2A'].map((tf) => (
            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-[10px] py-1 text-[11.5px] rounded-full border border-line ${timeframe === tf ? 'bg-gold text-bg' : 'text-dim'}`}>
              {tf}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[12px] text-dim mb-4">
          <div>Apertura<b className="block text-text text-[13.5px]">$67.000</b></div>
          <div>Máximo<b className="block text-text text-[13.5px]">$68.000</b></div>
          <div>Mínimo<b className="block text-text text-[13.5px]">$65.000</b></div>
        </div>
      </aside>
    </>
  );
};

