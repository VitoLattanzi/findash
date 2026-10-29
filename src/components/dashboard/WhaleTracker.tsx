'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Radio, ArrowUpRight, ArrowDownRight, Filter, ShieldAlert, Sparkles } from 'lucide-react';
import { AssetIcon } from '@/components/common/AssetIcon';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { formatPrice } from '@/lib/format';

export interface WhaleTrade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  usdAmount: number;
  isBuyerMaker: boolean; // true = taker sold (VENTA), false = taker bought (COMPRA)
  time: string;
  timestamp: number;
}

const TRACKED_SYMBOLS = [
  'btcusdt',
  'ethusdt',
  'solusdt',
  'bnbusdt',
  'xrpusdt',
  'dogeusdt',
  'pepeusdt',
  'wifusdt',
];

const HOSTS = [
  'wss://stream.binance.com:9443/stream?streams=',
  'wss://data-stream.binance.vision/stream?streams=',
];

// Semilla inicial realista para que el componente nunca nazca vacío
const INITIAL_WHALES: WhaleTrade[] = [
  {
    id: 'seed-1',
    symbol: 'BTC',
    price: 68420.5,
    quantity: 2.85,
    usdAmount: 194998,
    isBuyerMaker: false,
    time: 'En vivo',
    timestamp: Date.now() - 1000 * 12,
  },
  {
    id: 'seed-2',
    symbol: 'ETH',
    price: 2540.2,
    quantity: 48.2,
    usdAmount: 122437,
    isBuyerMaker: true,
    time: 'En vivo',
    timestamp: Date.now() - 1000 * 25,
  },
  {
    id: 'seed-3',
    symbol: 'SOL',
    price: 182.4,
    quantity: 580,
    usdAmount: 105792,
    isBuyerMaker: false,
    time: 'En vivo',
    timestamp: Date.now() - 1000 * 42,
  },
  {
    id: 'seed-4',
    symbol: 'DOGE',
    price: 0.174,
    quantity: 480000,
    usdAmount: 83520,
    isBuyerMaker: false,
    time: 'En vivo',
    timestamp: Date.now() - 1000 * 65,
  },
];

export const WhaleTracker = () => {
  const [threshold, setThreshold] = useState<number>(50000); // USD 50k default
  const [trades, setTrades] = useState<WhaleTrade[]>(INITIAL_WHALES);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const hostIndexRef = useRef(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const streams = TRACKED_SYMBOLS.map((s) => `${s}@aggTrade`).join('/');

    const connect = () => {
      const host = HOSTS[hostIndexRef.current % HOSTS.length];
      ws = new WebSocket(`${host}${streams}`);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const data = payload.data ?? payload;
          if (data && data.e === 'aggTrade') {
            const price = parseFloat(data.p);
            const quantity = parseFloat(data.q);
            const usdAmount = price * quantity;

            if (usdAmount >= threshold) {
              const symbol = (data.s || '').replace('USDT', '');
              const now = new Date(data.T || Date.now());
              const time = now.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              const newTrade: WhaleTrade = {
                id: `${data.a || Date.now()}-${data.s}`,
                symbol,
                price,
                quantity,
                usdAmount,
                isBuyerMaker: !!data.m,
                time,
                timestamp: data.T || Date.now(),
              };

              setTrades((prev) => [newTrade, ...prev.slice(0, 24)]);
            }
          }
        } catch {
          // Ignorar frames incompletos
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!closed) {
          hostIndexRef.current += 1;
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    };
  }, [threshold]);

  // Filtramos por umbral seleccionado
  const visibleTrades = trades.filter((t) => t.usdAmount >= threshold);

  // Balance Compras vs Ventas
  const totalVolume = visibleTrades.reduce((acc, t) => acc + t.usdAmount, 0);
  const buyVolume = visibleTrades
    .filter((t) => !t.isBuyerMaker)
    .reduce((acc, t) => acc + t.usdAmount, 0);
  const buyPct = totalVolume > 0 ? Math.round((buyVolume / totalVolume) * 100) : 50;
  const sellPct = 100 - buyPct;

  return (
    <div className="bg-card border border-line rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <span className="text-[17px]">🐋</span>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text flex items-center gap-2">
              <span>Radar de Ballenas</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg2 border border-line text-dim">
                En vivo
              </span>
            </h3>
            <p className="text-[11px] text-dim">
              Transacciones individuales &ge; ${threshold.toLocaleString('es-AR')} USD
            </p>
          </div>
        </div>

        {/* Status y Filtro de Umbral */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isConnected
                ? 'bg-teal/10 border-teal/30 text-teal'
                : 'bg-gold/10 border-gold/30 text-gold animate-pulse'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-teal animate-pulse' : 'bg-gold'
              }`}
            />
            <span>{isConnected ? 'Stream Activo' : 'Conectando'}</span>
          </div>

          <div className="flex items-center bg-bg2 border border-line rounded-lg p-0.5 text-[11px]">
            {[50000, 100000, 250000].map((val) => (
              <button
                key={val}
                onClick={() => setThreshold(val)}
                className={`px-2 py-0.5 rounded transition-colors font-mono ${
                  threshold === val
                    ? 'bg-gold text-bg font-semibold'
                    : 'text-dim hover:text-text'
                }`}
              >
                ${val / 1000}k
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Balance de Presión Ballena */}
      <div className="py-3 border-b border-line/60">
        <div className="flex items-center justify-between text-[11.5px] font-mono mb-1.5">
          <span className="text-teal font-medium flex items-center gap-1">
            <ArrowUpRight size={13} /> Compras: {buyPct}%
          </span>
          <span className="text-dim text-[11px]">
            Vol. Capturado: ${(totalVolume / 1000).toFixed(0)}k USD
          </span>
          <span className="text-red font-medium flex items-center gap-1">
            Ventas: {sellPct}% <ArrowDownRight size={13} />
          </span>
        </div>
        <div className="w-full h-1.5 bg-bg2 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-teal transition-all duration-500"
            style={{ width: `${buyPct}%` }}
          />
          <div
            className="h-full bg-red transition-all duration-500"
            style={{ width: `${sellPct}%` }}
          />
        </div>
      </div>

      {/* Lista de Operaciones */}
      <div className="flex-1 overflow-y-auto max-h-[340px] divide-y divide-line/40 pr-1 mt-1 space-y-1">
        {visibleTrades.length === 0 ? (
          <div className="py-12 text-center text-dim space-y-2">
            <Radio size={24} className="mx-auto text-gold animate-pulse" />
            <p className="text-[12.5px]">Esperando órdenes masivas en el libro de Binance...</p>
            <p className="text-[11px] text-dim/70">
              Prueba reducir el umbral a $50k para mayor frecuencia.
            </p>
          </div>
        ) : (
          visibleTrades.map((t) => {
            const isBuy = !t.isBuyerMaker;
            return (
              <div
                key={t.id}
                className="flex items-center justify-between py-2 px-2 hover:bg-bg2/60 rounded-lg transition-colors text-[12.5px]"
              >
                {/* Activo + Tipo */}
                <div className="flex items-center gap-2.5 min-w-[120px]">
                  <CryptoIcon symbol={t.symbol} size={22} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-text">{t.symbol}</span>
                      <span
                        className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          isBuy
                            ? 'bg-teal/15 text-teal border-teal/30'
                            : 'bg-red/15 text-red border-red/30'
                        }`}
                      >
                        {isBuy ? 'COMPRA' : 'VENTA'}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-mono text-dim block">
                      ${formatPrice(t.price)}
                    </span>
                  </div>
                </div>

                {/* Cantidad de monedas */}
                <div className="hidden sm:block text-right">
                  <span className="text-[11.5px] font-mono text-dim block">
                    {t.quantity.toLocaleString('es-AR', { maximumFractionDigits: 4 })} {t.symbol}
                  </span>
                </div>

                {/* Monto en USD y Hora */}
                <div className="text-right">
                  <span
                    className={`font-mono font-bold block ${
                      isBuy ? 'text-teal' : 'text-red'
                    }`}
                  >
                    ${t.usdAmount.toLocaleString('es-AR', { maximumFractionDigits: 0 })} USD
                  </span>
                  <span className="text-[10px] font-mono text-dim">{t.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2.5 mt-auto border-t border-line text-[10.5px] text-dim flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-gold" />
          <span>Binance @aggTrade WebSocket</span>
        </span>
        <span className="font-mono">Top 8 Pares</span>
      </div>
    </div>
  );
};
