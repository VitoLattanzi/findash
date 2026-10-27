'use client';
import React from 'react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';

const MAIN = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'];
const MEME = ['dogeusdt', 'pepeusdt', 'shibusdt', 'trumpusdt', 'wifusdt', 'bonkusdt'];

const NAMES: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  BNBUSDT: 'BNB',
  SOLUSDT: 'SOL',
  DOGEUSDT: 'DOGE',
  PEPEUSDT: 'PEPE',
  SHIBUSDT: 'SHIB',
  TRUMPUSDT: 'TRUMP',
  WIFUSDT: 'WIF',
  BONKUSDT: 'BONK',
};

interface Row {
  name: string;
  price: number;
  change: number;
  vol: number;
}

function formatPrice(price: number): string {
  if (!isFinite(price)) return '—';
  if (price >= 1) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
}

function formatVol(vol: number): string {
  if (!isFinite(vol) || vol <= 0) return '—';
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

const CryptoTable = ({ title, symbols, prices }: {
  title: string;
  symbols: string[];
  prices: Record<string, { s: string; c: string; o: string; q?: string }>;
}) => {
  const rows: Row[] = symbols
    .map((s) => prices[s.toUpperCase()])
    .filter(Boolean)
    .map((p) => {
      const price = parseFloat(p.c);
      const open = parseFloat(p.o);
      return {
        name: NAMES[p.s] || p.s.replace('USDT', ''),
        price,
        change: open ? ((price - open) / open) * 100 : 0,
        vol: parseFloat(p.q || '0'),
      };
    });

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-[13.5px] text-dim font-medium mb-2.5">{title}</h3>
      {rows.length === 0 ? (
        <div className="text-dim text-[12.5px]">Conectando con Binance...</div>
      ) : (
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Activo</th>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Precio</th>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">24h%</th>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Vol 24h</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="hover:bg-[#1a2030]">
                <td className="p-[9px_10px] border-b border-line font-bold">{r.name}</td>
                <td className="p-[9px_10px] border-b border-line">${formatPrice(r.price)}</td>
                <td className={`p-[9px_10px] border-b border-line ${r.change >= 0 ? 'text-teal' : 'text-red'}`}>
                  {r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%
                </td>
                <td className="p-[9px_10px] border-b border-line text-dim">{formatVol(r.vol)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export const CryptoView = () => {
  const prices = useBinanceWebSocket([...MAIN, ...MEME]);

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Cripto</h2>
      </div>
      <div className="flex gap-5 items-start flex-wrap">
        <div className="flex-[2] min-w-[320px] bg-card border border-line rounded-[6px] p-4">
          <CryptoTable title="PRINCIPALES" symbols={MAIN} prices={prices} />
          <CryptoTable title="MEME COINS" symbols={MEME} prices={prices} />
        </div>
        <div className="flex-[1] min-w-[260px] bg-card border border-line rounded-[6px] p-4">
          <h3 className="text-[13.5px] text-dim font-medium mb-2.5">OPERACIONES DE BALLENAS</h3>
          <div className="block mt-2 bg-[#2a1c1c] text-[#f0b9a8] border border-[#5a2f2a] text-[11.5px] p-[7px_9px] rounded-[4px] mb-2">
            Detector de ballenas en espera de stream @aggTrade
          </div>
          <div className="text-dim text-[11.5px]">
            Se mostrarán alertas cuando se registren órdenes individuales mayores a USD 100.000.
          </div>
        </div>
      </div>
    </section>
  );
};
