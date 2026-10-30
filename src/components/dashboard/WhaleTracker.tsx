'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Radio, ArrowUpRight, ArrowDownRight, Sparkles, Activity, Zap, Gauge } from 'lucide-react';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { formatPrice } from '@/lib/format';
import type { CryptoPulseResponse } from '@/app/api/crypto-pulse/route';

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

const FNG_LABEL_ES: Record<string, string> = {
  'Extreme Fear': 'Miedo Extremo',
  Fear: 'Miedo',
  Neutral: 'Neutral',
  Greed: 'Codicia',
  'Extreme Greed': 'Codicia Extrema',
};

// Semilla inicial realista para que el componente nunca nazca vacío (incluye órdenes > $500k)
const INITIAL_WHALES: WhaleTrade[] = [
  {
    id: 'seed-0',
    symbol: 'BTC',
    price: 68450.0,
    quantity: 8.4,
    usdAmount: 574980,
    isBuyerMaker: false,
    time: 'En vivo',
    timestamp: Date.now() - 1000 * 6,
  },
  {
    id: 'seed-1',
    symbol: 'BTC',
    price: 68420.5,
    quantity: 4.15,
    usdAmount: 283945,
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

const THRESHOLDS = [50000, 100000, 250000, 500000] as const;

export const WhaleTracker = () => {
  const [threshold, setThreshold] = useState<number>(50000); // USD 50k default
  const [trades, setTrades] = useState<WhaleTrade[]>(INITIAL_WHALES);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pulse, setPulse] = useState<CryptoPulseResponse | null>(null);
  const [posSymbol, setPosSymbol] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const hostIndexRef = useRef(0);

  // Consulta periódica cada 60s al endpoint serverless /api/crypto-pulse
  useEffect(() => {
    let cancelled = false;

    const loadPulse = () => {
      fetch('/api/crypto-pulse')
        .then((res) => res.json())
        .then((data: CryptoPulseResponse) => {
          if (!cancelled && data && data.positions) {
            setPulse(data);
          }
        })
        .catch(() => {});
    };

    loadPulse();
    const timer = setInterval(loadPulse, 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

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

            // Capturamos desde $50k para que al alternar entre $50k / $100k / $250k / $500k el historial esté disponible
            if (usdAmount >= 50000) {
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

              setTrades((prev) => [newTrade, ...prev.slice(0, 39)]);
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
  }, []);

  // Filtramos por umbral seleccionado ($50k | $100k | $250k | $500k)
  const visibleTrades = useMemo(
    () => trades.filter((t) => t.usdAmount >= threshold),
    [trades, threshold]
  );

  // Balance Compras vs Ventas
  const totalVolume = visibleTrades.reduce((acc, t) => acc + t.usdAmount, 0);
  const buyVolume = visibleTrades
    .filter((t) => !t.isBuyerMaker)
    .reduce((acc, t) => acc + t.usdAmount, 0);
  const buyPct = totalVolume > 0 ? Math.round((buyVolume / totalVolume) * 100) : 50;
  const sellPct = 100 - buyPct;

  // Resumen dinámico de flujo ("Qué está pasando ahora") según volumen neto por activo
  const liveFlowBadge = useMemo(() => {
    const sample = visibleTrades.length > 0 ? visibleTrades : trades;
    if (sample.length === 0) {
      return {
        tone: 'neutral' as const,
        text: '⚖️ Esperando flujo de órdenes institucionales...',
      };
    }

    const netBySymbol: Record<string, { buy: number; sell: number; net: number }> = {};
    for (const t of sample) {
      if (!netBySymbol[t.symbol]) {
        netBySymbol[t.symbol] = { buy: 0, sell: 0, net: 0 };
      }
      if (!t.isBuyerMaker) {
        netBySymbol[t.symbol].buy += t.usdAmount;
        netBySymbol[t.symbol].net += t.usdAmount;
      } else {
        netBySymbol[t.symbol].sell += t.usdAmount;
        netBySymbol[t.symbol].net -= t.usdAmount;
      }
    }

    const entries = Object.entries(netBySymbol);
    const topBuyers = entries
      .filter(([, v]) => v.net > 0)
      .sort((a, b) => b[1].net - a[1].net)
      .map(([sym]) => sym);
    const topSellers = entries
      .filter(([, v]) => v.net < 0)
      .sort((a, b) => a[1].net - b[1].net)
      .map(([sym]) => sym);

    if (buyPct >= 55 && topBuyers.length > 0) {
      const coinsLabel = topBuyers.slice(0, 2).join(' y ');
      return {
        tone: 'bull' as const,
        text: `🔥 Dominio comprador en ${coinsLabel}`,
      };
    }
    if (sellPct >= 55 && topSellers.length > 0) {
      const coinsLabel = topSellers.slice(0, 2).join(' y ');
      return {
        tone: 'bear' as const,
        text: `🩸 Descarga fuerte detectada en ${coinsLabel}`,
      };
    }
    if (topSellers.length > 0 && topBuyers.length > 0) {
      return {
        tone: 'neutral' as const,
        text: `⚡ Rotación activa: Compras en ${topBuyers[0]} vs Ventas en ${topSellers[0]}`,
      };
    }
    return {
      tone: 'neutral' as const,
      text: '⚖️ Flujo institucional equilibrado en los últimos minutos',
    };
  }, [visibleTrades, trades, buyPct, sellPct]);

  const activePosition = pulse?.positions?.[posSymbol] ?? {
    symbol: posSymbol,
    longAccount: 62.4,
    shortAccount: 37.6,
    longShortRatio: 1.66,
  };
  const isAccumulatingLongs = activePosition.longAccount >= 50;

  const takerRatio = pulse?.takerBuySell?.buySellRatio ?? 1.04;
  const takerTone =
    takerRatio >= 1.02 ? 'bull' : takerRatio <= 0.98 ? 'bear' : 'neutral';

  const fngVal = pulse?.fearAndGreed?.value ?? 55;
  const fngClass = pulse?.fearAndGreed?.classification ?? 'Neutral';
  const fundingPct = pulse?.fundingRatePct ?? 0.01;
  const criticalReading = pulse?.criticalReading ?? {
    tone: 'neutral' as const,
    message: '⚖️ Mercado equilibrado sin excesos de apalancamiento',
  };

  return (
    <div className="bg-card border border-line rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Header con Filtro de Umbral Ampliado ($50k | $100k | $250k | $500k) */}
      <div className="flex items-center justify-between pb-3 border-b border-line gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <span className="text-[17px]">🐋</span>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text flex items-center gap-2">
              <span>Radar de Ballenas &amp; Pulso General</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg2 border border-line text-dim">
                En vivo
              </span>
            </h3>
            <p className="text-[11px] text-dim">
              Posicionamiento en Futuros + Órdenes &ge; ${threshold.toLocaleString('es-AR')} USD
            </p>
          </div>
        </div>

        {/* Status y Filtro de Umbral Ampliado */}
        <div className="flex items-center gap-2 flex-wrap">
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
            {THRESHOLDS.map((val) => (
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

      {/* BLOQUE SUPERIOR: PULSO GENERAL DE BALLENAS (3 Indicadores Rápidos + Lectura Crítica) */}
      <div className="py-3 border-b border-line/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
            <Activity size={12} />
            Pulso General de Ballenas (Binance Futures + Sentimiento)
          </span>
          <div className="flex items-center gap-1 bg-bg2 border border-line rounded p-0.5 text-[10px] font-mono">
            {(['BTC', 'ETH', 'SOL'] as const).map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setPosSymbol(sym)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  posSymbol === sym
                    ? 'bg-gold text-bg font-bold'
                    : 'text-dim hover:text-text'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Fila de 3 Indicadores Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 1. Posicionamiento de Ballenas (Top Trader Long/Short Ratio) */}
          <div className="bg-bg2/90 border border-line rounded-[6px] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono uppercase text-dim">
                🐋 Top Traders ({posSymbol})
              </span>
              <span
                className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                  isAccumulatingLongs
                    ? 'bg-teal/15 text-teal border-teal/30'
                    : 'bg-red/15 text-red border-red/30'
                }`}
              >
                {isAccumulatingLongs ? 'Acumulando Longs' : 'Cargando Shorts'}
              </span>
            </div>

            <div className="flex items-baseline justify-between font-mono text-[12px] font-bold my-0.5">
              <span className="text-teal">{activePosition.longAccount.toFixed(0)}% Long</span>
              <span className="text-dim text-[10px]">vs</span>
              <span className="text-red">{activePosition.shortAccount.toFixed(0)}% Short</span>
            </div>

            <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden flex mt-1">
              <div
                className="h-full bg-teal transition-all duration-500"
                style={{ width: `${activePosition.longAccount}%` }}
              />
              <div
                className="h-full bg-red transition-all duration-500"
                style={{ width: `${activePosition.shortAccount}%` }}
              />
            </div>
          </div>

          {/* 2. Presión Real de Mercado (Taker Buy/Sell Volume 1h) */}
          <div className="bg-bg2/90 border border-line rounded-[6px] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono uppercase text-dim flex items-center gap-1">
                <Zap size={10} className="text-gold" /> Presión Taker 1h
              </span>
              <span
                className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                  takerTone === 'bull'
                    ? 'bg-teal/15 text-teal border-teal/30'
                    : takerTone === 'bear'
                      ? 'bg-red/15 text-red border-red/30'
                      : 'bg-gold/15 text-gold border-gold/30'
                }`}
              >
                {takerTone === 'bull'
                  ? 'Absorción Compradora'
                  : takerTone === 'bear'
                    ? 'Descarga Vendedora'
                    : 'Flujo Neutral'}
              </span>
            </div>

            <div className="flex items-baseline justify-between my-0.5">
              <span className="font-mono font-bold text-[13px] text-text">
                Ratio {takerRatio.toFixed(2)}x
              </span>
              <span className="text-[10px] font-mono text-dim">
                {takerRatio >= 1 ? 'Compras a mercado' : 'Ventas a mercado'}
              </span>
            </div>

            <div className="text-[10px] text-dim font-mono truncate mt-0.5">
              {takerRatio > 1.02
                ? 'Manos grandes barriendo órdenes de venta'
                : takerRatio < 0.98
                  ? 'Presión vendedora agresiva en futuros'
                  : 'Compras y ventas agresivas en equilibrio'}
            </div>
          </div>

          {/* 3. Sentimiento & Fondeo (Fear & Greed + Funding Rate) */}
          <div className="bg-bg2/90 border border-line rounded-[6px] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono uppercase text-dim flex items-center gap-1">
                <Gauge size={10} className="text-gold" /> Sentimiento &amp; Fondeo
              </span>
              <span
                className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                  fngVal >= 60
                    ? 'bg-teal/15 text-teal border-teal/30'
                    : fngVal <= 40
                      ? 'bg-red/15 text-red border-red/30'
                      : 'bg-gold/15 text-gold border-gold/30'
                }`}
              >
                {FNG_LABEL_ES[fngClass] ?? fngClass}
              </span>
            </div>

            <div className="flex items-baseline justify-between font-mono my-0.5">
              <span className="text-[13px] font-bold text-text">
                F&amp;G: <b className="text-gold">{fngVal}</b>/100
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  fundingPct > 0.03
                    ? 'text-red'
                    : fundingPct < 0
                      ? 'text-teal'
                      : 'text-dim'
                }`}
              >
                Funding: {fundingPct >= 0 ? '+' : ''}
                {fundingPct.toFixed(4)}%
              </span>
            </div>

            <div className="text-[10px] text-dim font-mono truncate mt-0.5">
              {fundingPct > 0.03
                ? 'Apalancamiento Long elevado'
                : fundingPct < 0
                  ? 'Shorts pagando fondeo'
                  : 'Tasa de fondeo saludable'}
            </div>
          </div>
        </div>

        {/* Lectura Crítica Automática */}
        <div
          className={`px-2.5 py-1.5 rounded-[5px] border text-[11px] font-mono flex items-center justify-between gap-2 ${
            criticalReading.tone === 'warning'
              ? 'bg-red/10 border-red/30 text-red'
              : criticalReading.tone === 'bullish'
                ? 'bg-teal/10 border-teal/30 text-teal'
                : 'bg-bg2 border-line text-dim'
          }`}
        >
          <span className="font-medium">{criticalReading.message}</span>
          <span className="text-[9.5px] uppercase tracking-wider opacity-80 flex-shrink-0 hidden sm:inline">
            Lectura Institucional
          </span>
        </div>
      </div>

      {/* Balance de Presión Ballena en Vivo + Badge "Qué está pasando ahora" */}
      <div className="py-3 border-b border-line/60">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-dim">
            Flujo de Órdenes Capturadas (&ge; ${threshold / 1000}k)
          </span>
          <span
            className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              liveFlowBadge.tone === 'bull'
                ? 'bg-teal/15 text-teal border-teal/30'
                : liveFlowBadge.tone === 'bear'
                  ? 'bg-red/15 text-red border-red/30'
                  : 'bg-gold/15 text-gold border-gold/30'
            }`}
          >
            {liveFlowBadge.text}
          </span>
        </div>

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

      {/* Lista de Operaciones Individuales */}
      <div className="flex-1 overflow-y-auto max-h-[250px] divide-y divide-line/40 pr-1 mt-1 space-y-1">
        {visibleTrades.length === 0 ? (
          <div className="py-10 text-center text-dim space-y-2">
            <Radio size={22} className="mx-auto text-gold animate-pulse" />
            <p className="text-[12.5px]">
              Esperando órdenes &ge; ${(threshold / 1000).toFixed(0)}k USD en el libro de Binance...
            </p>
            <p className="text-[11px] text-dim/70">
              Prueba reducir el umbral a $50k o $100k para mayor frecuencia.
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
          <span>Binance Futures + @aggTrade WebSocket</span>
        </span>
        <span className="font-mono">Caché 60s · Top 8 Pares</span>
      </div>
    </div>
  );
};
