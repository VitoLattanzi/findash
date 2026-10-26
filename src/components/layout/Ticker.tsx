'use client';
import React from 'react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';

const SYMBOLS = ['btcusdt', 'ethusdt', 'solusdt'];

export const Ticker = () => {
  const cryptoPrices = useBinanceWebSocket(SYMBOLS);

  // Mapeamos los datos de Binance al formato del Ticker
  const tickerItems = Object.values(cryptoPrices).map(p => {
    const price = parseFloat(p.c);
    const open = parseFloat(p.o);
    const changePercent = ((price - open) / open) * 100;
    
    return {
      t: p.s.replace('USDT', ''),
      p: `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      c: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      up: price >= open
    };
  });

  // Si no hay datos aún, mostramos un estado de carga o vacío temporal
  if (tickerItems.length === 0) return <div className="bg-bg2 border-b border-line p-2 text-center text-dim text-[12.5px]">Conectando a Binance...</div>;

  return (
    <div className="bg-bg2 border-b border-line overflow-hidden whitespace-nowrap">
      <div className="inline-flex animate-scroll py-2">
        {[...tickerItems, ...tickerItems].map((d, i) => (
          <span key={i} className="px-5 text-[12.5px] text-dim border-r border-line">
            {d.t} <b className="text-text font-semibold">{d.p}</b> 
            <i className={d.up ? "text-teal" : "text-red"}> {d.c}</i>
          </span>
        ))}
      </div>
    </div>
  );
};
