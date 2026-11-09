'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Clock,
  Activity,
} from 'lucide-react';
import { fmtPct, fmtPrice } from '@/lib/format';

export type MarketStatus = 'open' | 'pre_post' | 'closed';

export interface MarketDef {
  id: string;
  name: string;
  shortName: string;
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

// Los 4 mercados clave fijos en la tira del Sidebar + Hong Kong y Cripto para el modal completo
const SIDEBAR_MARKETS: MarketDef[] = [
  {
    id: 'us',
    name: 'NYSE / NASDAQ',
    shortName: 'NYSE / NASDAQ',
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
    name: 'BYMA (Buenos Aires)',
    shortName: 'BYMA (Bs. As.)',
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
    name: 'LSE (Londres)',
    shortName: 'LSE (Londres)',
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
    name: 'TSE (Tokio)',
    shortName: 'TSE (Tokio)',
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
];

const EXTRA_MODAL_MARKETS: MarketDef[] = [
  {
    id: 'cn',
    name: 'Hong Kong / SSE',
    shortName: 'HKEX',
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
    shortName: 'Cripto 24/7',
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

const ALL_MARKETS: MarketDef[] = [...SIDEBAR_MARKETS, ...EXTRA_MODAL_MARKETS];

interface BenchmarkQuote {
  symbol: string;
  price: number | null;
  change: number | null;
  marketState?: string | null;
}

function resolveMarketState(
  now: Date,
  m: MarketDef,
  yahooMarketState?: string | null
): {
  status: MarketStatus;
  label: string;
  shortLabel: string;
  dotColor: string;
  textColor: string;
  timeStr: string;
} {
  const localStr = now.toLocaleTimeString('es-AR', {
    timeZone: m.timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  if (m.alwaysOpen) {
    return {
      status: 'open',
      label: 'Abierto 24/7',
      shortLabel: 'Abierto',
      dotColor: 'bg-teal animate-pulse',
      textColor: 'text-teal',
      timeStr: localStr,
    };
  }

  // Si Yahoo Finance devuelve un marketState explícito ('REGULAR', 'PRE', 'POST', 'PREPRE', 'POSTPOST', 'CLOSED'), lo priorizamos
  const stateUpper = (yahooMarketState || '').toUpperCase();
  if (stateUpper === 'REGULAR') {
    return {
      status: 'open',
      label: 'Abierto',
      shortLabel: 'Abierto',
      dotColor: 'bg-teal animate-pulse',
      textColor: 'text-teal',
      timeStr: localStr,
    };
  }
  if (stateUpper === 'PRE' || stateUpper === 'POST') {
    return {
      status: 'pre_post',
      label: stateUpper === 'PRE' ? 'Pre-Market' : 'Post-Market',
      shortLabel: 'Pre/Post',
      dotColor: 'bg-gold animate-pulse',
      textColor: 'text-gold',
      timeStr: localStr,
    };
  }

  // Fallback horario local por huso horario cuando aún no cargó la respuesta o para validar horarios
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: m.timeZone }));
  const day = tzDate.getDay();
  const isWeekend = day === 0 || day === 6;
  const currentMins = tzDate.getHours() * 60 + tzDate.getMinutes();
  const openMins = m.openHour * 60 + m.openMin;
  const closeMins = m.closeHour * 60 + m.closeMin;

  if (!isWeekend && currentMins >= openMins && currentMins < closeMins && stateUpper !== 'CLOSED') {
    return {
      status: 'open',
      label: 'Abierto',
      shortLabel: 'Abierto',
      dotColor: 'bg-teal animate-pulse',
      textColor: 'text-teal',
      timeStr: localStr,
    };
  }

  if (!isWeekend && ((currentMins >= openMins - 30 && currentMins < openMins) || (currentMins >= closeMins && currentMins < closeMins + 30))) {
    return {
      status: 'pre_post',
      label: currentMins < openMins ? 'Pre-Apertura' : 'Post-Cierre',
      shortLabel: 'Pre/Post',
      dotColor: 'bg-gold',
      textColor: 'text-gold',
      timeStr: localStr,
    };
  }

  return {
    status: 'closed',
    label: 'Cerrado',
    shortLabel: 'Cerrado',
    dotColor: 'bg-red',
    textColor: 'text-red',
    timeStr: localStr,
  };
}

export const MarketStatusWidget = () => {
  const [now, setNow] = useState<Date | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [benchmarks, setBenchmarks] = useState<Record<string, BenchmarkQuote>>({});
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const clockTimer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(clockTimer);
  }, []);

  // Fetch de índices representativos usando /api/quotes por lote + polling inteligente
  useEffect(() => {
    let cancelled = false;
    const traditionalSymbols = ALL_MARKETS.filter((m) => m.id !== 'crypto').map((m) => m.indexSymbol);
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

    const loadQuotes = (isInitial = false) => {
      if (isInitial) setLoadingBenchmarks(true);
      fetch(`/api/quotes?s=${encodeURIComponent(allSymbols)}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || !Array.isArray(data)) return;
          const map: Record<string, BenchmarkQuote> = {};
          for (const item of data) {
            if (item?.symbol) {
              const hasPrice = typeof item.price === 'number' && item.price > 0;
              // Evitar 0.0% falso cuando un índice (ej. ^MERV) no reporta variación válida
              const validChange =
                hasPrice &&
                typeof item.changePct === 'number' &&
                Number.isFinite(item.changePct) &&
                !(item.symbol === '^MERV' && item.changePct === 0 && item.marketState !== 'REGULAR')
                  ? item.changePct
                  : null;

              map[item.symbol] = {
                symbol: item.symbol,
                price: hasPrice ? item.price : null,
                change: validChange,
                marketState: item.marketState ?? null,
              };
            }
          }

          // Índice Top 10 Altcoins
          const altQuotes = topAltcoins
            .map((sym) => map[sym])
            .filter((q): q is BenchmarkQuote => !!q && typeof q.change === 'number');

          if (altQuotes.length > 0) {
            const avgChange =
              altQuotes.reduce((acc, q) => acc + (q.change ?? 0), 0) / altQuotes.length;
            map['ALT10-INDEX'] = {
              symbol: 'ALT10-INDEX',
              price: null,
              change: avgChange,
              marketState: 'REGULAR',
            };
          }

          setBenchmarks(map);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadingBenchmarks(false);
        });
    };

    loadQuotes(true);
    const interval = setInterval(() => loadQuotes(false), 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const sentimentSummary = useMemo(() => {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;

    for (const m of ALL_MARKETS) {
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
      <div className="mt-auto pt-3 border-t border-line space-y-1.5 px-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-7 rounded bg-card/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mt-auto pt-2.5 border-t border-line select-none">
        {/* Cabecera de la Tira Fija de 4 Mercados */}
        <div className="flex items-center justify-between px-1.5 mb-1.5">
          <span className="text-[10px] text-dim uppercase tracking-wider font-mono flex items-center gap-1">
            <Globe size={11} className="text-gold" />
            Mercados en Vivo
          </span>
          <button
            onClick={() => setIsOpenModal(true)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-dim hover:text-gold hover:bg-card border border-transparent hover:border-line transition-colors flex items-center gap-1 cursor-pointer"
            title="Abrir panel de sentimiento global"
          >
            <Activity size={11} />
            <span>Pulso</span>
          </button>
        </div>

        {/* Lista Compacta Fija con los 4 Mercados Clave en Simultáneo */}
        <div
          onClick={() => setIsOpenModal(true)}
          className="bg-bg/50 border border-line rounded-[6px] divide-y divide-line/50 overflow-hidden cursor-pointer hover:border-gold/40 transition-colors"
          title="Click para ver detalle de índices y sentimiento mundial"
        >
          {SIDEBAR_MARKETS.map((m) => {
            const q = benchmarks[m.indexSymbol];
            const state = resolveMarketState(now, m, q?.marketState);
            const hasChg = q && typeof q.change === 'number' && Number.isFinite(q.change);
            const isUp = hasChg && q.change! > 0;
            const isDown = hasChg && q.change! < 0;

            return (
              <div
                key={m.id}
                className="px-2 py-1.5 hover:bg-card/70 transition-colors flex items-center justify-between gap-1.5 text-[11px]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12px] leading-none flex-shrink-0">{m.flag}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-text truncate text-[11px] leading-tight">
                      {m.shortName}
                    </div>
                    <div className="text-[9.5px] font-mono text-dim flex items-center gap-1 leading-tight mt-0.5">
                      <span>{m.indexName}</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          isUp ? 'text-teal' : isDown ? 'text-red' : 'text-dim'
                        }`}
                      >
                        {loadingBenchmarks && !q ? '...' : fmtPct(q?.change ?? null)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${state.dotColor}`} />
                    <span className={`text-[10px] font-mono font-medium ${state.textColor}`}>
                      {state.shortLabel}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-dim tabular-nums leading-tight mt-0.5">
                    {state.timeStr} {m.tzAbbr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE MERCADOS Y SENTIMIENTO GLOBAL */}
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
                      Mercados Globales &amp; Sentimiento
                    </h3>
                    <p className="text-[11.5px] text-dim">
                      Estado en vivo (`marketState`) y tendencia diaria
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
                {ALL_MARKETS.map((m) => {
                  const q = benchmarks[m.indexSymbol];
                  const state = resolveMarketState(now, m, q?.marketState);
                  const hasData = q && typeof q.change === 'number' && Number.isFinite(q.change);
                  const isBullish = hasData && q.change! > 0;
                  const isBearish = hasData && q.change! < 0;

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg bg-bg2/70 border border-line hover:border-gold/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
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
                            <span className="text-dim font-medium">Índice: {m.indexName}</span>
                            {q?.price != null && (
                              <span className="font-mono text-text">
                                {fmtPrice(q.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-line/40">
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
                              <span>{fmtPct(q.change)}</span>
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-dim font-mono">
                              {loadingBenchmarks ? 'Cargando...' : '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-line text-[11px] text-dim flex items-center justify-between">
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
