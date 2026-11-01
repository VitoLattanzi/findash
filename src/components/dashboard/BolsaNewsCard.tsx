'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Mic,
  BarChart3,
  Globe2,
  Sparkles,
} from 'lucide-react';

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
  speakerOrEntity?: string;
}

const SPEAKER_KEYWORDS: Array<{ match: string[]; label: string }> = [
  { match: ['powell', 'reserva federal', 'fed ', 'fomc'], label: 'Habló Powell / Fed' },
  { match: ['trump', 'casa blanca', 'aranceles'], label: 'Habló Trump / EE.UU.' },
  { match: ['musk', 'tesla'], label: 'Habló Elon Musk' },
  { match: ['jensen huang', 'nvidia'], label: 'Habló Nvidia / Huang' },
  { match: ['buffett', 'berkshire'], label: 'Habló Warren Buffett' },
  { match: ['caputo', 'bcra', 'milei', 'economía'], label: 'Habló Economía / Arg' },
  { match: ['lagarde', 'bce'], label: 'Habló BCE / Lagarde' },
  { match: ['ceo', ' dijo ', 'declaró', 'advirtió', 'anunció', 'discurso', 'conferencia'], label: 'Declaración Clave' },
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
  'nuevo',
  'ipo',
  'dividendo',
  'supera estimaciones',
  'wall street espera',
];

function classifyNewsItem(item: RawNewsItem): EnrichedNewsItem {
  const t = item.title.toLowerCase();

  for (const sp of SPEAKER_KEYWORDS) {
    if (sp.match.some((kw) => t.includes(kw))) {
      return {
        ...item,
        eventType: 'hablo',
        badgeLabel: sp.label,
      };
    }
  }

  if (BALANCE_KEYWORDS.some((kw) => t.includes(kw))) {
    const isLaunch = t.includes('lanza') || t.includes('lanzamiento') || t.includes('presenta') || t.includes('ipo');
    return {
      ...item,
      eventType: 'balances',
      badgeLabel: isLaunch ? '🚀 Lanzamiento / Evento' : '📊 Balance / Resultados',
    };
  }

  return {
    ...item,
    eventType: 'mercados',
    badgeLabel: '🌎 Pulso de Mercado',
  };
}

const FALLBACK_BOLSA_NEWS: RawNewsItem[] = [
  {
    title: 'Jerome Powell señala que la Reserva Federal evaluará datos de inflación antes de próximos recortes de tasas',
    link: 'https://www.federalreserve.gov',
    pubDate: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    source: 'Wall Street Wire',
    sentiment: 'neutral',
  },
  {
    title: 'Nvidia presenta nueva arquitectura de chips para centros de datos de IA y supera expectativas de ingresos',
    link: 'https://www.cnbc.com',
    pubDate: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    source: 'MarketWatch',
    sentiment: 'positivo',
  },
  {
    title: 'El S&P 500 y el Nasdaq operan con firmeza impulsados por balances del sector tecnológico y consumo',
    link: 'https://finance.yahoo.com',
    pubDate: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    source: 'Yahoo Finance',
    sentiment: 'positivo',
  },
  {
    title: 'Oro y petróleo registran alta volatilidad tras declaraciones sobre tasas del Tesoro de EE.UU. a 10 años',
    link: 'https://www.bloomberg.com',
    pubDate: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    source: 'Bloomberg',
    sentiment: 'neutral',
  },
];

export const BolsaNewsCard = () => {
  const [news, setNews] = useState<RawNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>('todo');

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
    } catch {
      setNews(FALLBACK_BOLSA_NEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBolsaNews();
  }, []);

  const enriched = useMemo(() => news.map(classifyNewsItem), [news]);

  const filteredNews = useMemo(() => {
    if (filter === 'todo') return enriched;
    return enriched.filter((item) => item.eventType === filter);
  }, [enriched, filter]);

  const counts = useMemo(() => {
    return {
      todo: enriched.length,
      hablo: enriched.filter((i) => i.eventType === 'hablo').length,
      balances: enriched.filter((i) => i.eventType === 'balances').length,
      mercados: enriched.filter((i) => i.eventType === 'mercados').length,
    };
  }, [enriched]);

  const formatTimeAgo = (pubDate: string) => {
    if (!pubDate) return 'Reciente';
    const diff = Date.now() - new Date(pubDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hace instantes';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  return (
    <div className="bg-card border border-line rounded-[6px] p-4 flex flex-col h-full shadow-sm">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3 border-b border-line gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <Newspaper size={16} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text flex items-center gap-2">
              <span>Noticias, Lanzamientos &amp; Voces</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                Wall St Live
              </span>
            </h3>
            <p className="text-[11px] text-dim">
              Habló la Fed / CEOs, balances trimestrales, lanzamientos y pulso global
            </p>
          </div>
        </div>

        <button
          onClick={fetchBolsaNews}
          disabled={loading}
          className="p-1.5 rounded-lg bg-bg2 hover:bg-line border border-line text-dim hover:text-text transition-colors"
          title="Actualizar noticias bursátiles"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-gold' : ''} />
        </button>
      </div>

      {/* Píldoras de Filtro: Todo | Habló X Persona | Balances / Lanzamientos | Mercados */}
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

      {/* Lista Scrolleable de Noticias / Eventos */}
      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-line/40 pr-1 mt-1">
        {loading ? (
          <div className="space-y-2.5 py-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-bg2/60 border border-line/40 animate-pulse p-3"
              />
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="py-12 text-center text-dim text-[12px] space-y-2">
            <p>No hay titulares en esta subcategoría ahora mismo.</p>
            <button
              type="button"
              onClick={() => setFilter('todo')}
              className="text-gold underline text-[11.5px] font-mono"
            >
              Ver todas las noticias ({counts.todo})
            </button>
          </div>
        ) : (
          filteredNews.map((item, idx) => {
            const isPos = item.sentiment === 'positivo';
            const isNeg = item.sentiment === 'negativo';
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
                    {/* Etiqueta de Categoría (Habló X Persona / Balance / Mercado) */}
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold border ${
                        isHablo
                          ? 'bg-gold/15 text-gold border-gold/35'
                          : isBalance
                            ? 'bg-teal/15 text-teal border-teal/35'
                            : 'bg-bg2 text-dim border-line'
                      }`}
                    >
                      {item.badgeLabel}
                    </span>
                    <span className="text-text/80">{item.source}</span>
                    <span className="text-dim">• {formatTimeAgo(item.pubDate)}</span>
                  </div>

                  {/* Badge de Sentimiento */}
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-semibold border ${
                      isPos
                        ? 'bg-teal/15 text-teal border-teal/30'
                        : isNeg
                          ? 'bg-red/15 text-red border-red/30'
                          : 'bg-bg2 text-dim border-line'
                    }`}
                  >
                    {isPos ? (
                      <>
                        <TrendingUp size={10} /> Alcista
                      </>
                    ) : isNeg ? (
                      <>
                        <TrendingDown size={10} /> Bajista
                      </>
                    ) : (
                      <>
                        <Minus size={10} /> Neutral
                      </>
                    )}
                  </span>
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 mt-auto border-t border-line text-[10.5px] text-dim flex items-center justify-between">
        <span className="font-mono">Fuentes: Wall St · Fed · Balances · Ámbito</span>
        <span className="font-mono text-gold">{counts.todo} eventos activos</span>
      </div>
    </div>
  );
};
