'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Mic,
  BarChart3,
  Globe2,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SentimentChip, classifyFinancialSentiment } from '@/components/common/SentimentChip';
import { AssetIcon } from '@/components/common/AssetIcon';

interface RawNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment?: 'positivo' | 'negativo' | 'neutral';
}

type EventFilter = 'todo' | 'hablo' | 'balances' | 'mercados';

interface EnrichedNewsItem extends RawNewsItem {
  eventType: 'hablo' | 'balances' | 'mercados';
  badgeLabel: string;
  cleanSource: string;
}

export interface UpcomingEarningsEvent {
  symbol: string;
  name: string;
  quarter: string;
  dateLabel: string;
  timing: 'Premarket' | 'After-hours';
  epsEst: string;
  revEst: string;
}

export interface LatestEarningsEvent {
  symbol: string;
  name: string;
  quarter: string;
  dateLabel: string;
  epsActual: number;
  epsEst: number;
  beat: boolean;
  guidanceSummary: string;
}

// Calendario de Próximos Balances & Eventos (Inspiración Quartr)
const UPCOMING_EARNINGS: UpcomingEarningsEvent[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    quarter: 'Q3 FY26',
    dateLabel: '20 Nov · 18:20 ET',
    timing: 'After-hours',
    epsEst: '$0,84',
    revEst: '$33,1B',
  },
  {
    symbol: 'WMT',
    name: 'Walmart Inc.',
    quarter: 'Q3 FY26',
    dateLabel: '19 Nov · 07:00 ET',
    timing: 'Premarket',
    epsEst: '$0,53',
    revEst: '$167,7B',
  },
  {
    symbol: 'CRM',
    name: 'Salesforce Inc.',
    quarter: 'Q3 FY26',
    dateLabel: '03 Dic · 16:05 ET',
    timing: 'After-hours',
    epsEst: '$2,44',
    revEst: '$9,35B',
  },
  {
    symbol: 'PANW',
    name: 'Palo Alto Networks',
    quarter: 'Q1 FY26',
    dateLabel: '20 Nov · 16:15 ET',
    timing: 'After-hours',
    epsEst: '$1,48',
    revEst: '$2,12B',
  },
  {
    symbol: 'HD',
    name: 'Home Depot',
    quarter: 'Q3 2026',
    dateLabel: '12 Nov · 06:00 ET',
    timing: 'Premarket',
    epsEst: '$3,64',
    revEst: '$39,2B',
  },
  {
    symbol: 'DIS',
    name: 'Walt Disney Co.',
    quarter: 'Q4 FY26',
    dateLabel: '14 Nov · 06:30 ET',
    timing: 'Premarket',
    epsEst: '$1,10',
    revEst: '$22,5B',
  },
];

// Resultados Recién Publicados (EPS Real vs Estimado + Guidance 1 línea)
const LATEST_EARNINGS: LatestEarningsEvent[] = [
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    quarter: 'Q3 2026',
    dateLabel: 'Reciente',
    epsActual: 0.1,
    epsEst: 0.09,
    beat: true,
    guidanceSummary:
      'Eleva guía anual de ingresos a $2,81B impulsado por adopción acelerada de AIP en EE.UU.',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    quarter: 'Q3 2026',
    dateLabel: 'Reciente',
    epsActual: 1.43,
    epsEst: 1.14,
    beat: true,
    guidanceSummary:
      'Margen operativo récord en AWS (+19% YoY) y proyección sólida para temporada festiva Q4.',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms',
    quarter: 'Q3 2026',
    dateLabel: 'Reciente',
    epsActual: 6.03,
    epsEst: 5.25,
    beat: true,
    guidanceSummary:
      'Ingresos publicitarios superan consenso; anuncia aumento en CAPEX de infraestructura IA para 2026.',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quarter: 'Q4 FY26',
    dateLabel: 'Reciente',
    epsActual: 1.64,
    epsEst: 1.6,
    beat: true,
    guidanceSummary:
      'Récord histórico de ingresos en Servicios ($25B) y crecimiento de un dígito medio proyectado.',
  },
  {
    symbol: 'MELI',
    name: 'MercadoLibre Inc.',
    quarter: 'Q3 2026',
    dateLabel: 'Reciente',
    epsActual: 7.83,
    epsEst: 9.85,
    beat: false,
    guidanceSummary:
      'Fuerte expansión de cartera de crédito en Brasil y Argentina comprime margen operativo de corto plazo.',
  },
];

const SPEAKER_KEYWORDS: Array<{ match: string[]; label: string }> = [
  { match: ['powell', 'reserva federal', 'fed ', 'fomc'], label: '🎙️ Habló Powell / Fed' },
  { match: ['trump', 'casa blanca', 'aranceles'], label: '🎙️ Habló Trump / EE.UU.' },
  { match: ['musk', 'tesla'], label: '🎙️ Habló Elon Musk' },
  { match: ['jensen huang', 'nvidia'], label: '🎙️ Habló Nvidia / Huang' },
  { match: ['buffett', 'berkshire'], label: '🎙️ Habló Warren Buffett' },
  { match: ['caputo', 'bcra', 'milei', 'ministro de economía'], label: '🎙️ Habló Economía / Arg' },
  { match: ['lagarde', 'bce'], label: '🎙️ Habló BCE / Lagarde' },
  { match: ['ceo', ' dijo ', 'declaró', 'advirtió', 'anunció', 'discurso', 'conferencia'], label: '🎙️ Declaración Clave' },
];

const BALANCE_KEYWORDS = [
  'balance',
  'trimestral',
  'resultados',
  'ganancias',
  'ingresos',
  'beneficio',
  'facturación',
  'lanza',
  'lanzamiento',
  'presenta',
  'ipo',
  'dividendo',
  'supera estimaciones',
  'wall street espera',
  'guidance',
  'bpa',
  'eps',
];

function cleanSourceLabel(raw: string): string {
  const s = (raw || '').trim();
  const lower = s.toLowerCase();
  if (lower === 'finanzas' || lower === 'economía' || lower === 'economia' || lower.includes('ambito')) {
    return 'Ámbito';
  }
  const parts = s.split(/[·•|-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
    return parts[0];
  }
  return s || 'Mercados';
}

function classifyNewsItem(item: RawNewsItem): EnrichedNewsItem {
  const t = item.title.toLowerCase();
  const cleanSource = cleanSourceLabel(item.source);
  const sentiment = classifyFinancialSentiment(item.title);

  for (const sp of SPEAKER_KEYWORDS) {
    if (sp.match.some((kw) => t.includes(kw))) {
      return {
        ...item,
        sentiment,
        cleanSource,
        eventType: 'hablo',
        badgeLabel: sp.label,
      };
    }
  }

  if (BALANCE_KEYWORDS.some((kw) => t.includes(kw))) {
    const isLaunch =
      t.includes('lanza') || t.includes('lanzamiento') || t.includes('presenta') || t.includes('ipo');
    return {
      ...item,
      sentiment,
      cleanSource,
      eventType: 'balances',
      badgeLabel: isLaunch ? '🚀 Lanzamiento / Evento' : '📊 Balance / Resultados',
    };
  }

  return {
    ...item,
    sentiment,
    cleanSource,
    eventType: 'mercados',
    badgeLabel: 'Pulso de Mercado',
  };
}

const FALLBACK_BOLSA_NEWS: RawNewsItem[] = [
  {
    title: 'Jerome Powell señala que la Reserva Federal evaluará datos de inflación antes de próximos recortes de tasas',
    link: 'https://www.federalreserve.gov',
    pubDate: '',
    source: 'Wall Street Wire',
    sentiment: 'neutral',
  },
  {
    title: 'Nvidia presenta nueva arquitectura de chips para centros de datos de IA y supera expectativas de ingresos',
    link: 'https://www.cnbc.com',
    pubDate: '',
    source: 'MarketWatch',
    sentiment: 'positivo',
  },
  {
    title: 'El S&P 500 y el Nasdaq operan con firmeza impulsados por balances del sector tecnológico y consumo',
    link: 'https://finance.yahoo.com',
    pubDate: '',
    source: 'Yahoo Finance',
    sentiment: 'positivo',
  },
  {
    title: 'Oro y petróleo registran alta volatilidad tras declaraciones sobre tasas del Tesoro de EE.UU. a 10 años',
    link: 'https://www.bloomberg.com',
    pubDate: '',
    source: 'Bloomberg',
    sentiment: 'neutral',
  },
];

interface BolsaNewsCardProps {
  onSelectTicker?: (symbol: string, name: string) => void;
}

export const BolsaNewsCard = ({ onSelectTicker }: BolsaNewsCardProps) => {
  const [news, setNews] = useState<RawNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>('todo');
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number | null>(null);

  const fetchBolsaNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news?category=bolsa');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setNews(data.slice(0, 24));
        } else {
          setNews(FALLBACK_BOLSA_NEWS);
        }
      } else {
        setNews(FALLBACK_BOLSA_NEWS);
      }
      const now = Date.now();
      setLastFetchedAt(now);
      setNowTick(now);
    } catch {
      setNews(FALLBACK_BOLSA_NEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialNow = Date.now();
    setLastFetchedAt(initialNow);
    setNowTick(initialNow);
    fetchBolsaNews();
    const timer = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const enriched = useMemo(() => news.map(classifyNewsItem), [news]);

  const filteredNews = useMemo(() => {
    if (filter === 'todo') return enriched;
    return enriched.filter((item) => item.eventType === filter);
  }, [enriched, filter]);

  const calendarCount = UPCOMING_EARNINGS.length + LATEST_EARNINGS.length;

  const counts = useMemo(() => {
    const liveBalances = enriched.filter((i) => i.eventType === 'balances').length;
    return {
      todo: enriched.length,
      hablo: enriched.filter((i) => i.eventType === 'hablo').length,
      balances: calendarCount + liveBalances, // Prohibido dejar en 0: suma Calendario Quartr + notas de balances
      mercados: enriched.filter((i) => i.eventType === 'mercados').length,
    };
  }, [enriched, calendarCount]);

  const updatedMinutesAgo =
    nowTick != null && lastFetchedAt != null
      ? Math.max(0, Math.floor((nowTick - lastFetchedAt) / 60000))
      : 0;
  const updatedLabel =
    updatedMinutesAgo < 1 ? 'Actualizado recién' : `Actualizado hace ${updatedMinutesAgo} min`;

  const formatTimeAgo = (pubDate: string) => {
    if (!pubDate || nowTick == null) return 'Reciente';
    const diff = nowTick - new Date(pubDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hace instantes';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  return (
    <div className="bg-card border border-line rounded-[6px] p-4 flex flex-col w-full h-full shadow-sm">
      {/* Cabecera */}
      <div className="draggable-handle flex items-center justify-between pb-3 border-b border-line gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold flex-shrink-0">
            <Newspaper size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-text flex items-center gap-2 flex-wrap">
              <span>Noticias, Balances &amp; Voces</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-bg2 text-dim border border-line">
                <Clock size={10} className="text-gold" />
                {updatedLabel}
              </span>
            </h3>
            <p className="text-[11px] text-dim truncate">
              Habló la Fed / CEOs, calendario de balances trimestrales (Quartr) y pulso global
            </p>
          </div>
        </div>

        <button
          onClick={fetchBolsaNews}
          disabled={loading}
          className="p-1.5 rounded-lg bg-bg2 hover:bg-line border border-line text-dim hover:text-text transition-colors flex-shrink-0"
          title="Actualizar noticias bursátiles"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-gold' : ''} />
        </button>
      </div>

      {/* Píldoras de Filtro: Todo | Habló Fed / Líderes | Balances & Lanzamientos | Mercados */}
      <div className="flex items-center gap-1.5 py-2.5 border-b border-line/60 overflow-x-auto no-scrollbar">
        {(
          [
            { key: 'todo', label: 'Todo', icon: <Sparkles size={11} /> },
            { key: 'hablo', label: 'Habló Fed / Líderes', icon: <Mic size={11} /> },
            { key: 'balances', label: 'Balances & Lanzamientos', icon: <BarChart3 size={11} /> },
            { key: 'mercados', label: 'Mercados', icon: <Globe2 size={11} /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[11px] font-mono whitespace-nowrap border transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-gold text-bg border-gold font-semibold'
                : 'bg-bg2 text-dim border-line hover:text-text'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`text-[9.5px] px-1 rounded ${
                filter === tab.key ? 'bg-bg/20 text-bg' : 'bg-card text-dim'
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Contenido Dinámico según el Tab seleccionado */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 mt-2">
        {filter === 'balances' ? (
          /* =================================================================
             VISTA ESTILO QUARTR: CALENDARIO DE EVENTOS & BALANCES
          ================================================================= */
          <div className="space-y-4 pb-2">
            {/* Sección 1: Próximos Eventos (Upcoming Events) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                  <Calendar size={12} />
                  Próximos Eventos (Upcoming Earnings)
                </span>
                <span className="text-[10px] font-mono text-dim">BPA / Ingresos Est.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {UPCOMING_EARNINGS.map((ev) => (
                  <div
                    key={ev.symbol}
                    onClick={() => onSelectTicker?.(ev.symbol, ev.name)}
                    className="p-2.5 rounded-[6px] bg-bg2/80 border border-line hover:border-gold/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AssetIcon symbol={ev.symbol} name={ev.name} type="stock" size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[12px] text-text group-hover:text-gold transition-colors">
                              {ev.symbol}
                            </span>
                            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-card border border-line text-gold">
                              {ev.quarter}
                            </span>
                          </div>
                          <span className="text-[10.5px] text-dim block truncate">{ev.name}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${
                          ev.timing === 'After-hours'
                            ? 'bg-gold/10 text-gold border-gold/25'
                            : 'bg-teal/10 text-teal border-teal/25'
                        }`}
                      >
                        {ev.timing}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-line/50 text-[10.5px] font-mono">
                      <span className="text-dim">{ev.dateLabel}</span>
                      <span className="text-text">
                        BPA Est: <b className="text-gold">{ev.epsEst}</b> · <span className="text-dim">{ev.revEst}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección 2: Eventos Recientes (Latest Events - Beat / Miss + Guidance) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1 pt-1 border-t border-line/60">
                <span className="text-[11px] font-mono uppercase tracking-wider text-teal font-semibold flex items-center gap-1.5">
                  <BarChart3 size={12} />
                  Eventos Recientes (EPS Real vs. Estimado)
                </span>
                <span className="text-[10px] font-mono text-dim">Surprise &amp; Guidance</span>
              </div>

              <div className="space-y-2">
                {LATEST_EARNINGS.map((ev) => {
                  const surprisePct = ((ev.epsActual - ev.epsEst) / Math.abs(ev.epsEst)) * 100;
                  const fmtEps = (v: number) =>
                    `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  return (
                    <div
                      key={ev.symbol}
                      onClick={() => onSelectTicker?.(ev.symbol, ev.name)}
                      className="p-2.5 rounded-[6px] bg-bg2/60 border border-line hover:border-gold/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <AssetIcon symbol={ev.symbol} name={ev.name} type="stock" size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[12px] text-text group-hover:text-gold transition-colors">
                                {ev.symbol}
                              </span>
                              <span className="text-[11px] text-dim">{ev.name}</span>
                              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-card border border-line text-dim">
                                {ev.quarter}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[10.5px]">
                          <span className="text-dim">
                            BPA: <b className="text-text">{fmtEps(ev.epsActual)}</b> vs {fmtEps(ev.epsEst)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                              ev.beat
                                ? 'bg-teal/15 text-teal border-teal/30'
                                : 'bg-red/15 text-red border-red/30'
                            }`}
                          >
                            {ev.beat ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                            {ev.beat ? 'BEAT' : 'MISS'} ({surprisePct >= 0 ? '+' : ''}
                            {surprisePct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <p className="text-[11.5px] text-dim mt-1.5 leading-snug pl-0.5">
                        {ev.guidanceSummary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Si además hay cables de prensa sobre balances en el feed RSS, los mostramos abajo */}
            {filteredNews.length > 0 && (
              <div className="pt-2 border-t border-line/60">
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-dim block mb-1.5 px-1">
                  Cobertura de Prensa en Vivo ({filteredNews.length})
                </span>
                <div className="divide-y divide-line/40">
                  {filteredNews.map((item, idx) => (
                    <a
                      key={`${item.link}-${idx}`}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block py-2 px-2 hover:bg-bg2/60 rounded-lg transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-medium text-text group-hover:text-gold transition-colors leading-snug">
                          {item.title}
                        </p>
                        <ExternalLink size={12} className="text-dim flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-dim">
                        <span>
                          {item.cleanSource} · {formatTimeAgo(item.pubDate)}
                        </span>
                        <SentimentChip sentiment={item.sentiment} title={item.title} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="space-y-2.5 py-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-bg2/60 border border-line/40 animate-pulse p-3"
              />
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="py-12 text-center text-dim text-[12px] space-y-2">
            <p>No hay titulares recientes en esta categoría.</p>
            <button
              type="button"
              onClick={() => setFilter('todo')}
              className="text-gold underline text-[11.5px] font-mono"
            >
              Ver todas las noticias ({counts.todo})
            </button>
          </div>
        ) : (
          <div className="divide-y divide-line/40">
            {filteredNews.map((item, idx) => {
              const isHablo = item.eventType === 'hablo';
              const isBalance = item.eventType === 'balances';

              return (
                <a
                  key={`${item.link}-${idx}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2.5 px-2 hover:bg-bg2/60 rounded-lg transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <p className="text-[12.5px] font-medium text-text group-hover:text-gold transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </p>
                    <ExternalLink
                      size={13}
                      className="text-dim group-hover:text-gold flex-shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[10.5px] font-mono gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Etiqueta de Categoría: menor opacidad para Pulso de Mercado para no saturar */}
                      <span
                        className={`px-1.5 py-0.2 rounded border ${
                          isHablo
                            ? 'bg-gold/15 text-gold border-gold/35 font-semibold'
                            : isBalance
                              ? 'bg-teal/15 text-teal border-teal/35 font-semibold'
                              : 'bg-bg2/50 text-dim/75 border-line/60 font-normal text-[10px]'
                        }`}
                      >
                        {item.badgeLabel}
                      </span>
                      <span className="text-text/85 font-medium">{item.cleanSource}</span>
                      <span className="text-dim">· {formatTimeAgo(item.pubDate)}</span>
                    </div>

                    {/* Chip de Sentimiento Confiable (solo se muestra si es inequívocamente Alcista o Bajista) */}
                    <SentimentChip sentiment={item.sentiment} title={item.title} />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 mt-auto border-t border-line text-[10.5px] text-dim flex items-center justify-between">
        <span className="font-mono">Fuentes: Wall St · Fed · Quartr Calendar · Ámbito</span>
        <span className="font-mono text-gold">
          {filter === 'balances' ? `${counts.balances} balances` : `${counts.todo} notas filtradas`}
        </span>
      </div>
    </div>
  );
};
