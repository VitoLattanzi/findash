'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, ArrowRight, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { SearchResultItem } from '@/app/api/search/route';
import { AssetIcon } from '@/components/common/AssetIcon';
import { formatPercent, formatPrice } from '@/lib/format';
import { Asset } from '@/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
}

const POPULAR_SUGGESTIONS = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' as const },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' as const },
  { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock' as const },
  { symbol: 'MELI', name: 'MercadoLibre, Inc.', type: 'stock' as const },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' as const },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' as const },
  { symbol: 'AL30', name: 'Bono Bonar 2030', type: 'stock' as const },
  { symbol: '^GSPC', name: 'S&P 500 Index', type: 'stock' as const },
];

export const GlobalSearchModal = ({ isOpen, onClose, onSelectAsset }: GlobalSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automático al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Búsqueda con debounce en tiempo real
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            setResults(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Atajo Escape para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (item: { symbol: string; name: string; type: string; price?: number | null; change?: number | null }) => {
    onSelectAsset({
      symbol: item.symbol,
      name: item.name || item.symbol,
      type: item.type === 'crypto' ? 'crypto' : 'stock',
      price: item.price ?? 0,
      change: item.change ?? 0,
      bars: [],
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[90] transition-opacity"
        onClick={onClose}
      />

      {/* Spotlight / Command Palette Dialog */}
      <div className="fixed inset-0 z-[91] flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 pointer-events-none">
        <div
          className="pointer-events-auto bg-card border border-line rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Barra de entrada de búsqueda */}
          <div className="p-3 sm:p-4 border-b border-line bg-bg2/60 flex items-center gap-3">
            <Search size={18} className="text-gold flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cualquier acción, bono, ETF o cripto mundial..."
              className="w-full bg-transparent text-[15px] sm:text-[16px] text-text placeholder-dim/60 focus:outline-none"
            />
            {loading ? (
              <Loader2 size={16} className="text-gold animate-spin flex-shrink-0" />
            ) : query ? (
              <button
                onClick={() => setQuery('')}
                className="text-dim hover:text-text p-1 text-[13px]"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[10.5px] font-mono px-2 py-0.5 rounded bg-bg border border-line text-dim">
                ESC
              </kbd>
            )}
          </div>

          {/* Lista de resultados o sugerencias */}
          <div className="p-2 sm:p-3 overflow-y-auto space-y-1 flex-1">
            {query.trim().length === 0 ? (
              /* SUGERENCIAS POPULARES */
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-dim px-3 py-1.5 block">
                  Búsquedas populares
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                  {POPULAR_SUGGESTIONS.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-bg2/80 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <AssetIcon symbol={item.symbol} name={item.name} type={item.type} size="sm" />
                        <div className="truncate">
                          <span className="font-mono font-semibold text-[13px] text-text block">
                            {item.symbol}
                          </span>
                          <span className="text-[11px] text-dim truncate block">
                            {item.name}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-dim/40 group-hover:text-gold transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length > 0 ? (
              /* RESULTADOS EN VIVO DE YAHOO FINANCE */
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-dim px-3 py-1 block">
                  Resultados encontrados ({results.length})
                </span>
                {results.map((r) => (
                  <button
                    key={r.symbol}
                    onClick={() => handleSelect(r)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-bg2/90 border border-transparent hover:border-line transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AssetIcon
                        symbol={r.symbol}
                        name={r.name}
                        type={r.type === 'crypto' ? 'crypto' : 'stock'}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-[13.5px] text-text">
                            {r.symbol}
                          </span>
                          {r.exchange && (
                            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-bg text-dim border border-line">
                              {r.exchange}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-dim/70 capitalize">
                            · {r.type}
                          </span>
                        </div>
                        <span className="text-[11.5px] text-dim truncate block max-w-xs sm:max-w-md">
                          {r.name}
                        </span>
                      </div>
                    </div>

                    {/* Precio y variación si están disponibles */}
                    <div className="text-right flex-shrink-0 ml-3">
                      {r.price != null && (
                        <span className="font-mono font-semibold text-[13px] text-text block">
                          ${formatPrice(r.price)}
                        </span>
                      )}
                      {r.change != null && (
                        <span
                          className={`font-mono text-[11px] font-medium flex items-center justify-end gap-0.5 ${
                            r.change >= 0 ? 'text-teal' : 'text-red'
                          }`}
                        >
                          {r.change >= 0 ? '+' : ''}
                          {formatPercent(r.change)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : !loading ? (
              /* SIN RESULTADOS */
              <div className="py-12 text-center text-dim space-y-1">
                <p className="text-[13.5px] text-text font-medium">
                  No se encontraron activos para &quot;{query}&quot;
                </p>
                <p className="text-[11.5px]">
                  Intenta buscar por el ticker oficial (ej: TSM, AAPL, NVDA, AL30, BTC).
                </p>
              </div>
            ) : null}
          </div>

          {/* Pie de navegación */}
          <div className="p-2.5 px-4 bg-bg2/80 border-t border-line text-[11px] text-dim/70 flex items-center justify-between">
            <span>Búsqueda universal en todo el mercado global</span>
            <span className="font-mono text-[10px]">FinDash Spotlight</span>
          </div>
        </div>
      </div>
    </>
  );
};
