'use client';
import React from 'react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';

const SYMBOLS = ['btcusdt', 'ethusdt', 'bnbusdt', 'bchusdt', 'solusdt'];
const NAMES: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  BNBUSDT: 'BNB',
  BCHUSDT: 'BCH',
  SOLUSDT: 'SOL',
};

export const CryptoView = () => {
  const prices = useBinanceWebSocket(SYMBOLS);
  const rows = SYMBOLS
    .map((s) => prices[s.toUpperCase()])
    .filter(Boolean)
    .map((p) => {
      const price = parseFloat(p.c);
      const open = parseFloat(p.o);
      const change = ((price - open) / open) * 100;
      return {
        name: NAMES[p.s] || p.s.replace('USDT', ''),
        price: price.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        change,
        vol: parseFloat(p.q || '0'),
      };
    });

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Cripto</h2>
      </div>
      <div className="flex gap-5 items-start flex-wrap">
        <div className="flex-[2] min-w-[320px] bg-card border border-line rounded-[6px] p-4">
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
                    <td className="p-[9px_10px] border-b border-line">${r.price}</td>
                    <td className={`p-[9px_10px] border-b border-line ${r.change >= 0 ? 'text-teal' : 'text-red'}`}>
                      {r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%
                    </td>
                    <td className="p-[9px_10px] border-b border-line text-dim">
                      ${(r.vol / 1_000_000).toFixed(0)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
