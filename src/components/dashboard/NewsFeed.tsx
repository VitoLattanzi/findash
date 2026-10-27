'use client';
import React, { useState, useEffect } from 'react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

export const NewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('todas');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/news?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setNews(data);
        } else {
          setNews([]);
          setError(data?.error || 'No se pudieron cargar las noticias.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setNews([]);
        setError('No se pudieron cargar las noticias.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Noticias &amp; Calendario</h2>
      </div>
      <div className="bg-card border border-line rounded-[6px] p-4">
        <div className="mb-4">
          {['todas', 'macro', 'fintech', 'ia', 'cripto'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`inline-block bg-bg2 border border-line text-[11.5px] p-[3px_8px] rounded-[4px] cursor-pointer mr-2 mb-1.5 ${
                category === cat ? 'text-gold border-gold' : 'text-dim'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-dim text-[12.5px]">Cargando noticias...</div>
        ) : error ? (
          <div className="text-red text-[12.5px]">{error}</div>
        ) : news.length === 0 ? (
          <div className="text-dim text-[12.5px]">Sin noticias en esta categoría.</div>
        ) : (
          <div className="flex flex-col">
            {news.slice(0, 12).map((n, i) => (
              <div key={`${n.link}-${i}`} className="py-[9px] border-b border-line text-[12.5px] last:border-none">
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="hover:text-gold block">
                  {n.title}
                </a>
                <span className="text-gold text-[11px] block mt-[2px]">
                  {n.source}
                  {n.pubDate ? ` · ${new Date(n.pubDate).toLocaleDateString('es-AR')}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
