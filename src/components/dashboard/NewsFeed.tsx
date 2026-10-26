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
  const [category, setCategory] = useState('todas');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?category=${category}`)
      .then(res => res.json())
      .then(data => { setNews(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [category]);

  return (
    <div className="bg-card border border-line rounded-[6px] p-4">
      <div className="mb-4">
        {['todas', 'macro', 'fintech', 'ia', 'cripto'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setCategory(cat)}
            className={`inline-block bg-bg2 border border-line text-[11.5px] p-[3px_8px] rounded-[4px] cursor-pointer mr-2 ${category === cat ? 'text-gold border-gold' : 'text-dim'}`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>
      {loading ? <div className="text-dim text-[12.5px]">Cargando noticias...</div> : (
        <div className="flex flex-col">
          {news.slice(0, 10).map((n, i) => (
            <div key={i} className="py-[9px] border-b border-line text-[12.5px] last:border-none">
              <a href={n.link} target="_blank" className="hover:text-gold block">{n.title}</a>
              <span className="text-gold text-[11px] block mt-[2px]">{n.source} · {new Date(n.pubDate).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
