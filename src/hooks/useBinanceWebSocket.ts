import { useState, useEffect } from 'react';
import { BinanceMiniTicker } from '@/types';

export function useBinanceWebSocket(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, BinanceMiniTicker>>({});

  useEffect(() => {
    // Binance stream URL: /ws/<symbol>@miniTicker
    const streams = symbols.map(s => `${s.toLowerCase()}@miniTicker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    ws.onmessage = (event) => {
      const data: BinanceMiniTicker = JSON.parse(event.data);
      setPrices((prev) => ({
        ...prev,
        [data.s]: data,
      }));
    };

    ws.onerror = (error) => {
      console.error('Binance WebSocket Error:', error);
    };

    return () => {
      ws.close();
    };
  }, [symbols]);

  return prices;
}
