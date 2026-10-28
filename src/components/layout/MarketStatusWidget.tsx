'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Globe,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';

export type MarketStatus = 'open' | 'closing_soon' | 'opening_soon' | 'closed';

export interface MarketDef {
  id: string;
  name: string;
  flag: string;
  city: string;
  indexName: string;
  indexSymbol: string;
  timeZone: string;
  tzAbbr: string;
  alwaysOpen?: boolean;
  openHour: number;
  openMin: number;
  closeHour: number;
  closeMin: number;
}

const MARKETS: MarketDef[] = [
  {
    id: 'us',
    name: 'Wall Street',
    flag: '🇺🇸',
    city: 'Nueva York',
    indexName: 'S&P 500',
    indexSymbol: '^GSPC',
    timeZone: 'America/New_York',
    tzAbbr: 'ET',
    openHour: 9,
    openMin: 30,
    closeHour: 16,
    closeMin: 0,
  },
  {
    id: 'ar',
    name: 'BCBA / BYMA',
    flag: '🇦🇷',
    city: 'Buenos Aires',
    indexName: 'S&P Merval',
    indexSymbol: '^MERV',
    timeZone: 'America/Argentina/Buenos_Aires',
    tzAbbr: 'ART',
    openHour: 11,
    openMin: 0,
    closeHour: 17,
    closeMin: 0,
  },
  {
    id: 'uk',
    name: 'Londres (LSE)',
    flag: '🇬🇧',
    city: 'Londres',
    indexName: 'FTSE 100',
    indexSymbol: '^FTSE',
    timeZone: 'Europe/London',
    tzAbbr: 'GMT',
    openHour: 8,
    openMin: 0,
    closeHour: 16,
    closeMin: 30,
  },
  {
    id: 'jp',
    name: 'Tokio (TSE)',
    flag: '🇯🇵',
    city: 'Tokio',
    indexName: 'Nikkei 225',
    indexSymbol: '^N225',
    timeZone: 'Asia/Tokyo',
    tzAbbr: 'JST',
    openHour: 9,
    openMin: 0,
    closeHour: 15,
    closeMin: 30,
  },
  {
    id: 'cn',
    name: 'Hong Kong / SSE',
    flag: '🇭🇰',
    city: 'Hong Kong',
    indexName: 'Hang Seng',
    indexSymbol: '^HSI',
    timeZone: 'Asia/Hong_Kong',
    tzAbbr: 'HKT',
    openHour: 9,
    openMin: 30,
    closeHour: 16,
    closeMin: 0,
  },
  {
    id: 'crypto',
    name: 'Cripto 24/7',
    flag: '🌐',
    city: 'Global',
    indexName: 'Top 10 Altcoins',
    indexSymbol: 'ALT10-INDEX',
    timeZone: 'UTC',
    tzAbbr: 'UTC',
    alwaysOpen: true,
    openHour: 0,
    openMin: 0,
    closeHour: 24,
    closeMin: 0,
  },
];

function getMarketState(now: Date, m: MarketDef): {
  status: MarketStatus;
  label: string;
  dotColor: string;
  textColor: string;
  timeStr: string;
} {
  const localStr = now.toLocaleTimeString('es-AR', {
    timeZone: m.timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (m.alwaysOpen) {
    return {
      status: 'open',
      label: 'Abierto 24/7',
      dotColor: 'bg-teal animate-pulse',
      textColor: 'text-teal',
      timeStr: localStr,
    };
  }

  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: m.timeZone }));
  const day = tzDate.getDay();
  const isWeekend = day === 0 || day === 6;
  const currentMins = tzDate.getHours() * 60 + tzDate.getMinutes();
  const openMins = m.openHour * 60 + m.openMin;
  const closeMins = m.closeHour * 60 + m.closeMin;

  if (isWeekend) {
    return {
      status: 'closed',
      label: 'Cerrado (Finde)',
      dotColor: 'bg-red',
      textColor: 'text-red',
      timeStr: localStr,
    };
  }

  // 30 min antes de abrir: Azul
  if (currentMins >= openMins - 30 && currentMins < openMins) {
    const minsLeft = openMins - currentMins;
    return {
      status: 'opening_soon',
      label: `Abre en ${minsLeft}m`,
      dotColor: 'bg-blue-400 animate-pulse',
      textColor: 'text-blue-400',
      timeStr: localStr,
    };
  }

  // 30 min antes de cerrar: Amarillo
  if (currentMins >= closeMins - 30 && currentMins < closeMins) {
    const minsLeft = closeMins - currentMins;
    return {
      status: 'closing_soon',
      label: `Cierra en ${minsLeft}m`,
      dotColor: 'bg-gold animate-pulse',
      textColor: 'text-gold',
      timeStr: localStr,
    };
  }

  // Abierto: Verde
  if (currentMins >= openMins && currentMins < closeMins) {
    return {
      status: 'open',
      label: 'Abierto',
      dotColor: 'bg-teal animate-pulse',
      textColor: 'text-teal',
      timeStr: localStr,
    };
  }

  // Cerrado: Rojo
  return {
    status: 'closed',
    label: 'Cerrado',
    dotColor: 'bg-red',
    textColor: 'text-red',
    timeStr: localStr,
  };
}

interface BenchmarkQuote {
  symbol: string;
  price: number | null;
  change: number | null;
}

export const MarketStatusWidget = () => {
  const [now, setNow] = useState<Date | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [benchmarks, setBenchmarks] = useState<Record<string, BenchmarkQuote>>({});
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);

  // Reloj local por segundo
  useEffect(() => {
    setNow(new Date());
    const clockTimer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Fetch de índices representativos de cada mercado + Top 10 Altcoins
  useEffect(() => {
    let cancelled = false;
    const traditionalSymbols = MARKETS.filter((m) => m.id !== 'crypto').map((m) => m.indexSymbol);
    const topAltcoins = [
      'ETH-USD',
      'BNB-USD',
      'SOL-USD',
      'XRP-USD',
      'ADA-USD',
      'DOGE-USD',
      'AVAX-USD',
      'LINK-USD',
      'DOT-USD',
      'NEAR-USD',
    ];
    const allSymbols = [...traditionalSymbols, ...topAltcoins].join(',');

    setLoadingBenchmarks(true);
    fetch(`/api/market?tickers=${encodeURIComponent(allSymbols)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const map: Record<string, BenchmarkQuote> = {};
          for (const item of data) {
            if (item?.symbol) {
              map[item.symbol] = {
                symbol: item.symbol,
                price: item.price,
                change: item.change,
              };
            }
          }

          // Calcular el Índice de las 10 Altcoins de mayor capitalización
          const altQuotes = topAltcoins
            .map((sym) => map[sym])
            .filter((q): q is BenchmarkQuote => !!q && typeof q.change === 'number');

          if (altQuotes.length > 0) {
            const avgChange =
              altQuotes.reduce((acc, q) => acc + (q.change || 0), 0) / altQuotes.length;
            map['ALT10-INDEX'] = {
              symbol: 'ALT10-INDEX',
              price: null,
              change: avgChange,
            };
          }

          setBenchmarks(map);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingBenchmarks(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Rotador automático cada 4 segundos (se pausa con hover o modal abierto)
  useEffect(() => {
    if (isPaused || isOpenModal) return;
    const rotateTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MARKETS.length);
    }, 4000);
    return () => clearInterval(rotateTimer);
  }, [isPaused, isOpenModal]);

  // Resumen del sentimiento alcista/bajista global
  const sentimentSummary = useMemo(() => {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;

    for (const m of MARKETS) {
      const q = benchmarks[m.indexSymbol];
      if (q && typeof q.change === 'number') {
        if (q.change > 0) bullish++;
        else if (q.change < 0) bearish++;
        else neutral++;
      }
    }
    return { bullish, bearish, neutral, total: bullish + bearish + neutral };
  }, [benchmarks]);

  if (!now) {
    return (
      <div className="mt-auto pt-3 border-t border-line space-y-1 text-dim text-[11px] px-2.5">
        Cargando mercados...
      </div>
    );
  }

  const currentMarket = MARKETS[currentIndex];
  const currentState = getMarketState(now, currentMarket);
  const currentQuote = benchmarks[currentMarket.indexSymbol];

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((p) => (p - 1 + MARKETS.length) % MARKETS.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((p) => (p + 1) % MARKETS.length);
  };

  return (
    <>
      <div
        className="mt-auto pt-3 border-t border-line space-y-1 relative select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Cabecera del widget */}
        <div className="flex items-center justify-between px-2.5 mb-1">
          <span className="text-[10px] text-dim/70 uppercase tracking-wider font-mono flex items-center gap-1">
            <Globe size={11} className="text-dim/80" />
            Mercados
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsOpenModal(true)}
              className="p-1 rounded text-[10px] text-dim hover:text-gold hover:bg-bg transition-colors"
              title="Abrir panel desplegable de sentimiento y mercados"
              aria-label="Ver sentimiento de mercados"
            >
              <Activity size={12} />
            </button>
            <button
              onClick={prev}
              className="text-dim hover:text-text p-0.5"
              aria-label="Mercado anterior"
            >
              <ChevronLeft size={11} />
            </button>
            <button
              onClick={next}
              className="text-dim hover:text-text p-0.5"
              aria-label="Siguiente mercado"
            >
              <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Tarjeta de visualización interactiva: click abre el menú desplegable */}
        <div
          onClick={() => setIsOpenModal(true)}
          className="group bg-bg/40 hover:bg-bg/80 border border-line/60 hover:border-gold/50 rounded-[6px] p-2 transition-all cursor-pointer shadow-sm"
          title="Click para ver si cada mercado fue alcista o bajista"
        >
          <div className="flex items-center justify-between gap-1.5 text-[11.5px]">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <span className="text-[13px]">{currentMarket.flag}</span>
              <span className="truncate group-hover:text-text">{currentMarket.name}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${currentState.dotColor}`} />
              <span className={`text-[10.5px] font-medium ${currentState.textColor}`}>
                {currentState.label}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-dim font-mono mt-1 pt-1 border-t border-line/40">
            <span className="flex items-center gap-1">
              <span>{currentMarket.indexName}</span>
              {currentQuote && typeof currentQuote.change === 'number' && (
                <span
                  className={`text-[9.5px] font-medium flex items-center ${
                    currentQuote.change >= 0 ? 'text-teal' : 'text-red'
                  }`}
                >
                  {currentQuote.change >= 0 ? '+' : ''}
                  {currentQuote.change.toFixed(1)}%
                </span>
              )}
            </span>
            <span className="tabular-nums">
              {currentState.timeStr} {currentMarket.tzAbbr}
            </span>
          </div>

          {/* Indicadores de posición (puntos) */}
          <div className="flex items-center justify-center gap-1 mt-1.5">
            {MARKETS.map((m, idx) => {
              const state = getMarketState(now, m);
              const isActive = idx === currentIndex;
              return (
                <button
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1 rounded-full transition-all ${
                    isActive ? 'w-4 bg-gold' : 'w-1.5 bg-line hover:bg-dim/50'
                  }`}
                  title={`${m.name}: ${state.label}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* MENÚ DESPLEGABLE / MODAL DE MERCADOS Y SENTIMIENTO ALCISTA/BAJISTA */}
      {isOpenModal && (
        <>
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[70] transition-opacity"
            onClick={() => setIsOpenModal(false)}
          />
          <div className="fixed inset-0 z-[71] flex items-center justify-center p-3 sm:p-5 pointer-events-none">
            <div
              className="bg-card border border-line rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto p-4 sm:p-5 flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              {/* Encabezado del modal */}
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Globe className="text-gold" size={18} />
                  <div>
                    <h3 className="font-display font-semibold text-[16px] text-text">
                      Mercados Globales & Sentimiento
                    </h3>
                    <p className="text-[11.5px] text-dim">
                      Estado en vivo y tendencia diaria (alcista / bajista)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpenModal(false)}
                  className="text-dim hover:text-text p-1.5 rounded-md hover:bg-bg2 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Barra de Balance / Sentimiento Global */}
              {sentimentSummary.total > 0 && (
                <div className="my-3 p-3 bg-bg2 rounded-lg border border-line">
                  <div className="flex items-center justify-between text-[11.5px] mb-2 font-mono">
                    <span className="flex items-center gap-1 text-teal font-semibold">
                      <TrendingUp size={13} />
                      {sentimentSummary.bullish} Alcista{sentimentSummary.bullish !== 1 ? 's' : ''}
                    </span>
                    <span className="text-dim text-[10.5px]">Sentimiento Diario</span>
                    <span className="flex items-center gap-1 text-red font-semibold">
                      <TrendingDown size={13} />
                      {sentimentSummary.bearish} Bajista{sentimentSummary.bearish !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Barra visual bicolor */}
                  <div className="w-full h-2 bg-line rounded-full overflow-hidden flex">
                    <div
                      className="bg-teal transition-all duration-500"
                      style={{
                        width: `${(sentimentSummary.bullish / sentimentSummary.total) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-line"
                      style={{
                        width: `${(sentimentSummary.neutral / sentimentSummary.total) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red transition-all duration-500"
                      style={{
                        width: `${(sentimentSummary.bearish / sentimentSummary.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Lista detallada de cada mercado */}
              <div className="space-y-2 mt-1">
                {MARKETS.map((m) => {
                  const state = getMarketState(now, m);
                  const q = benchmarks[m.indexSymbol];
                  const hasData = q && typeof q.change === 'number';
                  const isBullish = hasData && q.change! > 0;
                  const isBearish = hasData && q.change! < 0;
                  const isNeutral = hasData && q.change === 0;

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg bg-bg2/70 border border-line hover:border-gold/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      {/* Información del Mercado e Índice */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-[22px] leading-none select-none">{m.flag}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13.5px] text-text truncate">
                              {m.name}
                            </span>
                            <span className="text-[11px] text-dim font-mono">({m.city})</span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-dim mt-0.5 flex-wrap">
                            <span className="text-dim/90 font-medium">Índice: {m.indexName}</span>
                            {m.id === 'crypto' && (
                              <span className="text-[10px] text-dim/70 font-mono">
                                (ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, LINK, DOT, NEAR)
                              </span>
                            )}
                            {q?.price != null && (
                              <span className="font-mono text-text">
                                ${formatPrice(q.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Estado y Badge Alcista / Bajista */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-line/40">
                        {/* Estado horario */}
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`w-1.5 h-1.5 rounded-full ${state.dotColor}`} />
                            <span className={`text-[11px] font-medium ${state.textColor}`}>
                              {state.label}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-dim tabular-nums mt-0.5">
                            {state.timeStr} {m.tzAbbr}
                          </div>
                        </div>

                        {/* Badge Alcista / Bajista */}
                        <div className="min-w-[96px] text-right">
                          {hasData ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
                                isBullish
                                  ? 'bg-teal/15 text-teal border-teal/30'
                                  : isBearish
                                  ? 'bg-red/15 text-red border-red/30'
                                  : 'bg-bg text-dim border-line'
                              }`}
                            >
                              {isBullish ? (
                                <TrendingUp size={12} />
                              ) : isBearish ? (
                                <TrendingDown size={12} />
                              ) : (
                                <Minus size={12} />
                              )}
                              <span>
                                {isBullish ? 'Alcista' : isBearish ? 'Bajista' : 'Plano'}
                              </span>
                              <span>
                                {q.change! >= 0 ? '+' : ''}
                                {q.change!.toFixed(2)}%
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-dim font-mono">
                              {loadingBenchmarks ? 'Cargando...' : 'Sin datos'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pie del modal informativo */}
              <div className="mt-4 pt-3 border-t border-line text-[11px] text-dim/70 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Actualización automática en segundo plano
                </span>
                <span className="text-[10px] font-mono">FinDash World Pulse</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
