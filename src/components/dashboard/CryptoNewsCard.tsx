'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment?: 'positivo' | 'negativo' | 'neutral';
  isBinance?: boolean;
}

export const CryptoNewsCard = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterSource, setFilterSource] = useState<'todas' | 'binance' | 'medios'>('todas');

  const fetchNews = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/news?category=cripto');
      if (!res.ok) throw new Error('Error al cargar noticias');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNews(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Reciente';
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Ahora mismo';
      if (diffMins < 60) return `hace ${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `hace ${diffHours}h`;
      return `hace ${Math.floor(diffHours / 24)}d`;
    } catch {
      return 'Reciente';
    }
  };

  // Filtrado por fuente
  const filteredNews = useMemo(() => {
    if (filterSource === 'binance') {
      return news.filter(
        (n) => n.isBinance || n.source.toLowerCase().includes('binance')
      );
    }
    if (filterSource === 'medios') {
      return news.filter(
        (n) => !n.isBinance && !n.source.toLowerCase().includes('binance')
      );
    }
    return news;
  }, [news, filterSource]);

  const binanceCount = useMemo(
    () => news.filter((n) => n.isBinance || n.source.toLowerCase().includes('binance')).length,
    [news]
  );

  return (
    <div className="bg-card border border-line rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal/15 border border-teal/30 flex items-center justify-center text-teal">
            <Newspaper size={17} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text flex items-center gap-2">
              <span>Portal de Noticias Cripto</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg2 border border-line text-dim">
                Binance + Feeds
              </span>
            </h3>
            <p className="text-[11px] text-dim">
              Portal oficial de Binance, Cointelegraph y cobertura en vivo
            </p>
          </div>
        </div>

        <button
          onClick={fetchNews}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-bg2 hover:bg-line border border-line text-dim hover:text-text transition-colors disabled:opacity-50"
          title="Actualizar titulares"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-gold' : ''} />
        </button>
      </div>

      {/* Filtro de Pestañas: Todas / Binance Portal / Medios */}
      <div className="flex items-center gap-1.5 py-2.5 border-b border-line/60">
        <button
          onClick={() => setFilterSource('todas')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
            filterSource === 'todas'
              ? 'bg-gold text-bg font-semibold'
              : 'bg-bg2 text-dim hover:text-text border border-line'
          }`}
        >
          Todas ({news.length})
        </button>
        <button
          onClick={() => setFilterSource('binance')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
            filterSource === 'binance'
              ? 'bg-[#F0B90B] text-black font-semibold'
              : 'bg-bg2 text-[#F0B90B]/90 hover:text-[#F0B90B] border border-[#F0B90B]/30'
          }`}
        >
          <span>◆</span>
          <span>Binance Portal ({binanceCount})</span>
        </button>
        <button
          onClick={() => setFilterSource('medios')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
            filterSource === 'medios'
              ? 'bg-gold text-bg font-semibold'
              : 'bg-bg2 text-dim hover:text-text border border-line'
          }`}
        >
          Cointelegraph & Otros
        </button>
      </div>

      {/* Lista de Noticias */}
      <div className="flex-1 overflow-y-auto max-h-[350px] divide-y divide-line/40 pr-1 mt-1 space-y-2">
        {loading ? (
          <div className="py-16 text-center text-dim space-y-2.5">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[12.5px]">Sincronizando portal de Binance y feeds en tiempo real...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="py-12 text-center text-dim text-[12.5px]">
            No hay noticias disponibles para el filtro seleccionado.
          </div>
        ) : (
          filteredNews.slice(0, 10).map((item, idx) => {
            const isBinanceArticle =
              item.isBinance || item.source.toLowerCase().includes('binance');

            return (
              <div
                key={idx}
                className="py-2.5 px-2 hover:bg-bg2/50 rounded-lg transition-colors group flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-dim">
                  <div className="flex items-center gap-1.5">
                    {isBinanceArticle ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30 font-semibold text-[10.5px]">
                        <span>◆</span> Binance Portal
                      </span>
                    ) : (
                      <span className="font-medium text-gold truncate max-w-[180px]">
                        {item.source}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px]">
                    {formatTimeAgo(item.pubDate)}
                  </span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] text-text group-hover:text-gold transition-colors font-medium leading-snug line-clamp-2"
                >
                  {item.title}
                </a>

                <div className="flex items-center justify-between text-[11px] mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      item.sentiment === 'positivo'
                        ? 'bg-teal/10 text-teal border-teal/30'
                        : item.sentiment === 'negativo'
                        ? 'bg-red/10 text-red border-red/30'
                        : 'bg-bg2 text-dim border-line'
                    }`}
                  >
                    {item.sentiment === 'positivo' ? (
                      <>
                        <TrendingUp size={10} /> Alcista
                      </>
                    ) : item.sentiment === 'negativo' ? (
                      <>
                        <TrendingDown size={10} /> Bajista
                      </>
                    ) : (
                      <>
                        <Minus size={10} /> Neutral
                      </>
                    )}
                  </span>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10.5px] text-dim group-hover:text-gold hover:underline"
                  >
                    <span>Leer artículo</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2.5 mt-auto border-t border-line text-[10.5px] text-dim flex items-center justify-between">
        <span className="flex items-center gap-1 text-[#F0B90B]">
          <Sparkles size={11} />
          <span>Binance News & Announcements</span>
        </span>
        <span className="font-mono">{filteredNews.length} articulos</span>
      </div>
    </div>
  );
};
