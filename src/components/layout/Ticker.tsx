'use client';
import React, { useEffect, useState } from 'react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import { AssetIcon } from '@/components/common/AssetIcon';
import { fmtPct, fmtPrice } from '@/lib/format';
import { Search } from 'lucide-react';

const SYMBOLS = ['btcusdt', 'ethusdt', 'solusdt'];

interface FxRates {
  ARS: number;
  BRL: number;
  EUR: number;
  GBP: number;
  JPY: number;
  CNY: number;
}

interface TickerItem {
  label: string;
  value: string;
  change?: string;
  up?: boolean;
}

const FX_META: Array<{ key: keyof FxRates; label: string; prefix: string }> = [
  { key: 'ARS', label: 'USD/ARS', prefix: '$' },
  { key: 'BRL', label: 'USD/BRL', prefix: 'R$' },
  { key: 'EUR', label: 'USD/EUR', prefix: '€' },
  { key: 'GBP', label: 'USD/LIB', prefix: '£' },
  { key: 'JPY', label: 'USD/JPY', prefix: '¥' },
  { key: 'CNY', label: 'USD/CNY', prefix: '¥' },
];

export const Ticker = ({ onOpenSearch }: { onOpenSearch?: () => void }) => {
  const cryptoPrices = useBinanceWebSocket(SYMBOLS);
  const [fx, setFx] = useState<FxRates | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch('/api/fx')
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data?.rates) return;
          setFx(data.rates);
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const cryptoItems: TickerItem[] = Object.values(cryptoPrices).map((p) => {
    const price = parseFloat(p.c);
    const open = parseFloat(p.o);
    const changePercent = open > 0 ? ((price - open) / open) * 100 : null;
    return {
      label: p.s.replace('USDT', ''),
      value: fmtPrice(Number.isFinite(price) ? price : null, '$'),
      change: changePercent != null ? fmtPct(changePercent) : undefined,
      up: price >= open,
    };
  });

  const fxItems: TickerItem[] =
    fx && Object.values(fx).some((v) => v > 0)
      ? FX_META.filter((m) => fx[m.key] > 0).map((m) => ({
          label: m.label,
          value: fmtPrice(fx[m.key], m.prefix),
        }))
      : [];

  const items = [...cryptoItems, ...fxItems];

  if (items.length === 0) {
    return (
      <div className="sticky top-0 z-30 bg-bg2 border-b border-line p-2 text-center text-dim text-[12.5px] h-9 flex items-center justify-center">
        Conectando datos de mercado...
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-30 bg-bg2 border-b border-line overflow-hidden whitespace-nowrap h-9 flex items-center justify-between">
      <div className="overflow-hidden flex-1 relative">
        <div className="inline-flex animate-scroll py-2 hover:[animation-play-state:paused]">
          {[...items, ...items].map((d, i) => (
            <span
              key={`${d.label}-${i}`}
              className="inline-flex items-center gap-1.5 px-4 text-[12.5px] text-dim border-r border-line font-mono tabular-nums"
            >
              <AssetIcon symbol={d.label} size="xs" />
              <span>{d.label}</span>
              <b className="text-text font-semibold">{d.value}</b>
              {d.change && <i className={`not-italic ${d.up ? 'text-teal' : 'text-red'}`}> {d.change}</i>}
            </span>
          ))}
        </div>
      </div>

      {onOpenSearch && (
        <button
          onClick={onOpenSearch}
          className="flex-shrink-0 flex items-center gap-2 px-3 h-full bg-card hover:bg-bg border-l border-line text-[11.5px] text-dim hover:text-text transition-colors z-10 shadow-sm"
          title="Buscar cualquier activo (Ctrl + K)"
        >
          <Search size={13} className="text-gold" />
          <span className="hidden sm:inline">Buscar activo</span>
          <kbd className="hidden md:inline-block text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-bg2 border border-line text-dim">
            Ctrl K
          </kbd>
        </button>
      )}
    </div>
  );
};
