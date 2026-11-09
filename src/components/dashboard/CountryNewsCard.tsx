import React from 'react';

interface CountryNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface Props {
  title: string;
  items: CountryNewsItem[];
  color: 'teal' | 'red';
  isLoading: boolean;
}

export const CountryNewsCard = ({ title, items, color, isLoading }: Props) => {
  const textColor = color === 'teal' ? 'text-teal' : 'text-red';
  const hoverColor = color === 'teal' ? 'hover:text-teal' : 'hover:text-red';

  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wide ${textColor} mb-1.5`}>
        {title} {items.length ? `(${items.length})` : ''}
      </div>
      {isLoading ? (
        <div className="text-dim text-[11px]">Analizando titulares...</div>
      ) : items.length === 0 ? (
        <div className="text-dim text-[11px]">Sin novedades.</div>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 2).map((n, idx) => (
            <li key={`${n.link}-${idx}`}>
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`block text-[11.5px] leading-snug text-text/90 ${hoverColor} line-clamp-2`}
              >
                {n.title}
              </a>
              <span className="text-[9.5px] text-dim">
                {n.source}
                {n.pubDate ? ` · ${new Date(n.pubDate).toLocaleDateString('es-AR')}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
