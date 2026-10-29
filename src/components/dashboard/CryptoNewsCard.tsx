'use client';
import React, { useEffect, useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment?: 'positivo' | 'negativo' | 'neutral';
}

export const CryptoNewsCard = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchNews = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/news?category=cripto');
      if (!res.ok) throw new Error('Error al cargar noticias');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNews(data.slice(0, 8));
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

  return (
    <div className="bg-card border border-line rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal/15 border border-teal/30 flex items-center justify-center text-teal">
            <Newspaper size={17} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text flex items-center gap-2">
              <span>Noticias Criptomercado</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg2 border border-line text-dim">
                RSS Feed
              </span>
            </h3>
            <p className="text-[11px] text-dim">
              Cointelegraph, Ámbito Financiero y Medios Globales
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

      {/* Lista de Noticias */}
      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-line/40 pr-1 mt-2 space-y-2">
        {loading ? (
          <div className="py-16 text-center text-dim space-y-2.5">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[12.5px]">Sincronizando feeds cripto en tiempo real...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="py-12 text-center text-dim text-[12.5px]">
            No hay noticias cripto disponibles en este momento.
          </div>
        ) : (
          news.map((item, idx) => (
            <div
              key={idx}
              className="py-2.5 px-2 hover:bg-bg2/50 rounded-lg transition-colors group flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-[11px] text-dim">
                <span className="font-medium text-gold truncate max-w-[200px]">
                  {item.source}
                </span>
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
                  <span>Leer nota</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
