'use client';
import React, { useEffect, useState } from 'react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';

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

const FX_META: Array<{ key: keyof FxRates; label: string; prefix: string; decimals: number }> = [
  { key: 'ARS', label: 'USD/ARS', prefix: '$', decimals: 2 },
  { key: 'BRL', label: 'USD/BRL', prefix: 'R$', decimals: 3 },
  { key: 'EUR', label: 'USD/EUR', prefix: '€', decimals: 3 },
  { key: 'GBP', label: 'USD/LIB', prefix: '£', decimals: 3 },
  { key: 'JPY', label: 'USD/JPY', prefix: '¥', decimals: 2 },
  { key: 'CNY', label: 'USD/CNY', prefix: '¥', decimals: 3 },
];

const nf = (decimals: number) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const Ticker = () => {
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
    const changePercent = ((price - open) / open) * 100;
    return {
      label: p.s.replace('USDT', ''),
      value: `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      up: price >= open,
    };
  });

  const fxItems: TickerItem[] =
    fx && Object.values(fx).some((v) => v > 0)
      ? FX_META.filter((m) => fx[m.key] > 0).map((m) => ({
          label: m.label,
          value: `${m.prefix}${nf(m.decimals).format(fx[m.key])}`,
        }))
      : [];

  const items = [...cryptoItems, ...fxItems];

  if (items.length === 0) {
    return (
      <div className="bg-bg2 border-b border-line p-2 text-center text-dim text-[12.5px]">
        Conectando datos de mercado...
      </div>
    );
  }

  return (
    <div className="bg-bg2 border-b border-line overflow-hidden whitespace-nowrap">
      <div className="inline-flex animate-scroll py-2">
        {[...items, ...items].map((d, i) => (
          <span key={`${d.label}-${i}`} className="px-5 text-[12.5px] text-dim border-r border-line">
            {d.label} <b className="text-text font-semibold">{d.value}</b>
            {d.change && <i className={d.up ? 'text-teal' : 'text-red'}> {d.change}</i>}
          </span>
        ))}
      </div>
    </div>
  );
};
