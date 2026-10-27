import { useState, useEffect, useRef } from 'react';
import { BinanceMiniTicker } from '@/types';

const HOSTS = [
  'wss://stream.binance.com:9443/stream?streams=',
  'wss://data-stream.binance.vision/stream?streams=',
];

export function useBinanceWebSocket(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, BinanceMiniTicker>>({});
  const symbolsKey = symbols.join(',');
  const retryRef = useRef(0);
  const hostRef = useRef(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const streams = symbolsKey
      .split(',')
      .filter(Boolean)
      .map((s) => `${s.toLowerCase()}@miniTicker`)
      .join('/');

    if (!streams) return;

    const connect = () => {
      const base = HOSTS[hostRef.current % HOSTS.length];
      let opened = false;

      ws = new WebSocket(`${base}${streams}`);

      ws.onopen = () => {
        opened = true;
        retryRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const data: BinanceMiniTicker = payload.data ?? payload;
          if (!data?.s) return;
          setPrices((prev) => ({ ...prev, [data.s]: data }));
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        if (closed) return;
        if (!opened) hostRef.current += 1;
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    };
  }, [symbolsKey]);

  return prices;
}
