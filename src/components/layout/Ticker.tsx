'use client';
import React, { useEffect, useState } from 'react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import { AssetLogo } from '@/components/common/AssetLogo';
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
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const initialNow = Date.now();
    setLastTickAt(initialNow);
    setNowMs(initialNow);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    if (typeof navigator !== 'undefined') setIsOnline(navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const clock = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(clock);
    };
  }, []);

  // Actualizar timestamp cada vez que entra un tick de Binance
  useEffect(() => {
    if (Object.keys(cryptoPrices).length > 0) {
      setLastTickAt(Date.now());
    }
  }, [cryptoPrices]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch('/api/fx')
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data?.rates) return;
          setFx(data.rates);
          setLastTickAt(Date.now());
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

  const cryptoItems: TickerItem[] = Object.values(cryptoPrices)
    .map((p) => {
      const price = parseFloat(p.c);
      const open = parseFloat(p.o);
      if (!Number.isFinite(price) || price <= 0) return null;
      const changePercent = open > 0 ? ((price - open) / open) * 100 : null;
      return {
        label: p.s.replace('USDT', ''),
        value: fmtPrice(price, '$'),
        change: changePercent != null ? fmtPct(changePercent) : undefined,
        up: price >= open,
      };
    })
    .filter(Boolean) as TickerItem[];

  const fxItems: TickerItem[] =
    fx && Object.values(fx).some((v) => v > 0)
      ? FX_META.filter((m) => fx[m.key] > 0).map((m) => ({
          label: m.label,
          value: fmtPrice(fx[m.key], m.prefix),
        }))
      : [];

  const items = [...cryptoItems, ...fxItems];

  // Semáforo de frescura de datos
  const minsAgo =
    nowMs != null && lastTickAt != null
      ? Math.max(0, Math.floor((nowMs - lastTickAt) / 60_000))
      : 0;
  const statusKind: 'live' | 'delayed' | 'offline' = !isOnline
    ? 'offline'
    : minsAgo >= 10
      ? 'delayed'
      : 'live';

  const statusBadge = {
    live: {
      dot: 'bg-teal animate-pulse',
      text: 'text-teal',
      label: minsAgo < 1 ? 'En vivo' : `En vivo · act. hace ${minsAgo}m`,
    },
    delayed: {
      dot: 'bg-gold',
      text: 'text-gold',
      label: `Demorado · hace ${minsAgo}m`,
    },
    offline: {
      dot: 'bg-red',
      text: 'text-red',
      label: 'Sin conexión',
    },
  }[statusKind];

  return (
    <div className="sticky top-0 z-30 bg-bg2 border-b border-line overflow-hidden whitespace-nowrap h-9 flex items-center justify-between">
      <div className="overflow-hidden flex-1 relative">
        {items.length === 0 ? (
          <div className="inline-flex items-center gap-4 px-4 py-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="inline-block h-4 w-28 animate-pulse rounded bg-white/10"
              />
            ))}
          </div>
        ) : (
          <div className="inline-flex animate-scroll py-2 hover:[animation-play-state:paused]">
            {[...items, ...items].map((d, i) => (
              <span
                key={`${d.label}-${i}`}
                className="inline-flex items-center gap-1.5 px-4 text-[12.5px] text-dim border-r border-line font-mono tabular-nums"
              >
                <AssetLogo symbol={d.label} size="xs" />
                <span>{d.label}</span>
                <b className="text-text font-semibold">{d.value}</b>
                {d.change && (
                  <i className={`not-italic ${d.up ? 'text-teal' : 'text-red'}`}> {d.change}</i>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Semáforo Global de Frescura + Buscador Global */}
      <div className="flex items-center h-full flex-shrink-0 z-10 bg-bg2 border-l border-line">
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 h-full text-[10.5px] font-mono border-r border-line"
          title="Estado de frescura y conexión de datos en tiempo real"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
          <span className={statusBadge.text}>{statusBadge.label}</span>
        </div>

        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex-shrink-0 flex items-center gap-2 px-3 h-full bg-card hover:bg-bg text-[11.5px] text-dim hover:text-text transition-colors shadow-sm cursor-pointer"
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
    </div>
  );
};
