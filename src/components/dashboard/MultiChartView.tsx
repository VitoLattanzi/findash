'use client';
import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { PriceChart } from '@/components/common/PriceChart';
import { CATALOG } from '@/lib/catalog';
import { AssetType } from '@/types';
import { getTradingViewUrl } from '@/lib/tradingview';

const OPTIONS = CATALOG;

const ChartCell = ({ symbol, type }: { symbol: string; type: AssetType }) => {
  const [chartType, setChartType] = useState<'area' | 'velas'>('area');

  return (
    <div className="bg-card border border-line rounded-[6px] p-[12px]">
      <PriceChart symbol={symbol} type={type} chartType={chartType} height={150} />
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] font-mono font-medium text-text">{symbol}</span>
          <a
            href={getTradingViewUrl(symbol, type)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-dim hover:text-gold inline-flex items-center gap-0.5"
            title={`Abrir ${symbol} en TradingView`}
          >
            <span>TV</span>
            <ExternalLink size={9} />
          </a>
        </div>
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
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2">
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
      <div className={`grid gap-[12px] ${mode === 'g4' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
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
