'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ARGENTINA_TICKERS, COMMODITY_TICKERS, DEFAULT_PINNED, PinnedAsset, SP500_TICKERS, labelFor } from '@/lib/catalog';
import { formatPercent, formatPrice } from '@/lib/format';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { AssetIcon } from '@/components/common/AssetIcon';
import { Asset } from '@/types';
import { SearchResultItem } from '@/app/api/search/route';
import { Search, Globe, Sparkles, Loader2, X } from 'lucide-react';

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  name: string | null;
}

type Tab = 'sp500' | 'argentina' | 'commodities';
type SortKey = 'symbol' | 'name' | 'price' | 'change';

const TAB_TICKERS: Record<Tab, string> = {
  sp500: SP500_TICKERS,
  argentina: ARGENTINA_TICKERS,
  commodities: COMMODITY_TICKERS,
};

const SortHeader = ({
  label,
  sortKey,
  align = 'left',
  sort,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: SortKey;
  align?: 'left' | 'right';
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (key: SortKey) => void;
  className?: string;
}) => (
  <th
    onClick={() => onSort(sortKey)}
    className={`p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px] cursor-pointer select-none hover:text-text ${
      align === 'right' ? 'text-right' : 'text-left'
    } ${sort.key === sortKey ? 'text-gold' : ''} ${className}`}
  >
    {label}
    <span className="ml-1 text-[9px]">{sort.key === sortKey ? (sort.dir === 1 ? '▲' : '▼') : '↕'}</span>
  </th>
);

export const BolsaView = () => {
  const [tab, setTab] = useState<Tab>('sp500');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'symbol', dir: 1 });
  const [pinned, setPinned] = useLocalStorage<PinnedAsset[]>('findash_pinned_v2', DEFAULT_PINNED);
  const [selected, setSelected] = useState<Asset | null>(null);

  // Búsqueda global en vivo vía API (para cualquier acción del mundo no limitada a las 100 fijas)
  const [globalResults, setGlobalResults] = useState<SearchResultItem[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // Carga inicial del universo de la solapa activa
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/market?tickers=${encodeURIComponent(TAB_TICKERS[tab])}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setQuotes(data);
        } else {
          setError(data?.error || 'No se pudo obtener la data de mercado');
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo obtener la data de mercado');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  // Búsqueda en vivo en todo el mercado (Yahoo Finance search) con debounce
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setGlobalResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    let cancelled = false;
    setIsSearchingGlobal(true);

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            // Filtrar los que ya están en la lista visible local para no duplicar
            const localSymbols = new Set(quotes.map((item) => item.symbol.toUpperCase()));
            const notInLocal = data.filter((item) => !localSymbols.has(item.symbol.toUpperCase()));
            setGlobalResults(notInLocal);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsSearchingGlobal(false);
        });
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, quotes]);

  // Filtrado y ordenamiento local
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? quotes.filter(
          (item) => item.symbol.toLowerCase().includes(q) || (item.name ?? '').toLowerCase().includes(q)
        )
      : [...quotes];

    const value = (item: Quote): number | string | null => {
      switch (sort.key) {
        case 'price':
          return item.price;
        case 'change':
          return item.change;
        case 'name':
          return item.name ?? item.symbol;
        default:
          return item.symbol;
      }
    };

    return base.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string' || typeof vb === 'string') {
        return String(va).localeCompare(String(vb), 'es') * sort.dir;
      }
      return (va - vb) * sort.dir;
    });
  }, [quotes, search, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const togglePin = (symbol: string) => {
    const isPinned = pinned.some((p) => p.symbol === symbol);
    if (isPinned) {
      setPinned(pinned.filter((p) => p.symbol !== symbol));
    } else {
      setPinned([...pinned, { symbol, label: labelFor(symbol), type: 'stock' }]);
    }
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2">
        <h2 className="text-[22px] font-display font-semibold">Bolsa &amp; Materias Primas</h2>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          {(
            [
              ['sp500', 'S&P 500 Líderes'],
              ['argentina', 'Argentina / ADRs'],
              ['commodities', 'Commodities'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setSearch('');
              }}
              className={`px-[14px] py-[7px] text-[12.5px] font-medium transition-colors ${
                tab === key ? 'bg-gold text-bg font-semibold' : 'bg-bg2 text-dim hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-line rounded-xl p-4 shadow-sm">
        {/* Barra superior con Buscador Universal ampliado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <span className="text-[12px] text-dim font-mono">
            {loading ? 'Cargando cotizaciones...' : `${filtered.length} activos en catálogo`}
            {search.length >= 2 && globalResults.length > 0 && ` + ${globalResults.length} resultados globales`}
          </span>

          {/* Input de búsqueda ampliado */}
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cualquier acción, ETF o bono mundial (ej: TSM, BABA, NVDA)..."
              className="bg-bg2 border border-line text-text pl-9 pr-8 py-1.5 rounded-lg text-[12.5px] w-full focus:outline-none focus:border-gold transition-colors placeholder-dim/60"
            />
            {isSearchingGlobal ? (
              <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold animate-spin" />
            ) : search ? (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-text text-[13px]"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-dim text-[13px]">
            <Loader2 size={24} className="mx-auto mb-2 text-gold animate-spin" />
            Cargando cotizaciones oficiales...
          </div>
        ) : error ? (
          <div className="text-red text-[13px] py-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr>
                  <SortHeader label="Ticker" sortKey="symbol" sort={sort} onSort={toggleSort} />
                  <SortHeader
                    label="Nombre"
                    sortKey="name"
                    sort={sort}
                    onSort={toggleSort}
                    className="hidden sm:table-cell"
                  />
                  <SortHeader label="Precio" sortKey="price" align="right" sort={sort} onSort={toggleSort} />
                  <SortHeader label="24h%" sortKey="change" align="right" sort={sort} onSort={toggleSort} />
                  <th className="p-[8px_10px] border-b border-line w-10 text-center">Fijar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => {
                  const isPinned = pinned.some((p) => p.symbol === q.symbol);
                  return (
                    <tr
                      key={q.symbol}
                      onClick={() =>
                        setSelected({
                          name: q.name || q.symbol,
                          symbol: q.symbol,
                          type: 'stock',
                          price: q.price ?? 0,
                          change: q.change ?? 0,
                          bars: [],
                        })
                      }
                      className="hover:bg-bg2/80 cursor-pointer transition-colors border-b border-line/40 group"
                    >
                      <td className="p-[9px_10px] font-bold">
                        <div className="flex items-center gap-2">
                          <AssetIcon symbol={q.symbol} name={q.name ?? undefined} type="stock" size="sm" />
                          <span className="font-mono">{q.symbol}</span>
                        </div>
                      </td>
                      <td className="p-[9px_10px] text-dim truncate max-w-[240px] hidden sm:table-cell">
                        {q.name || '—'}
                      </td>
                      <td className="p-[9px_10px] text-right font-mono font-medium">
                        ${formatPrice(q.price)}
                      </td>
                      <td
                        className={`p-[9px_10px] text-right font-mono font-medium ${
                          (q.change ?? 0) >= 0 ? 'text-teal' : 'text-red'
                        }`}
                      >
                        {formatPercent(q.change)}
                      </td>
                      <td className="p-[9px_10px] text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(q.symbol);
                          }}
                          title={isPinned ? 'Quitar del dashboard' : 'Fijar en dashboard'}
                          className={`text-[15px] transition-transform active:scale-125 ${
                            isPinned ? 'text-gold' : 'text-dim hover:text-text'
                          }`}
                        >
                          {isPinned ? '★' : '☆'}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* RESULTADOS GLOBALES DE MERCADO (FUERA DE LA LISTA BASE DE 100) */}
                {search.length >= 2 && globalResults.length > 0 && (
                  <>
                    <tr className="bg-bg/80 border-t-2 border-line">
                      <td colSpan={5} className="p-[8px_10px] text-[11px] font-mono text-gold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Globe size={12} />
                          Resultados de búsqueda global en todo el mercado (Yahoo Finance)
                        </span>
                      </td>
                    </tr>

                    {globalResults.map((r) => {
                      const isPinned = pinned.some((p) => p.symbol === r.symbol);
                      return (
                        <tr
                          key={r.symbol}
                          onClick={() =>
                            setSelected({
                              name: r.name || r.symbol,
                              symbol: r.symbol,
                              type: r.type === 'crypto' ? 'crypto' : 'stock',
                              price: r.price ?? 0,
                              change: r.change ?? 0,
                              bars: [],
                            })
                          }
                          className="hover:bg-bg2/90 cursor-pointer transition-colors border-b border-line/40 bg-card/40"
                        >
                          <td className="p-[9px_10px] font-bold">
                            <div className="flex items-center gap-2">
                              <AssetIcon symbol={r.symbol} name={r.name} type="stock" size="sm" />
                              <span className="font-mono">{r.symbol}</span>
                              {r.exchange && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg text-dim border border-line">
                                  {r.exchange}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-[9px_10px] text-dim truncate max-w-[240px] hidden sm:table-cell">
                            {r.name || '—'}
                          </td>
                          <td className="p-[9px_10px] text-right font-mono font-medium">
                            {r.price != null ? `$${formatPrice(r.price)}` : '—'}
                          </td>
                          <td
                            className={`p-[9px_10px] text-right font-mono font-medium ${
                              r.change != null
                                ? r.change >= 0
                                  ? 'text-teal'
                                  : 'text-red'
                                : 'text-dim'
                            }`}
                          >
                            {r.change != null ? formatPercent(r.change) : '—'}
                          </td>
                          <td className="p-[9px_10px] text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(r.symbol);
                              }}
                              title={isPinned ? 'Quitar del dashboard' : 'Fijar en dashboard'}
                              className={`text-[15px] transition-transform active:scale-125 ${
                                isPinned ? 'text-gold' : 'text-dim hover:text-text'
                              }`}
                            >
                              {isPinned ? '★' : '☆'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}

                {/* Si no hay resultados locales ni globales */}
                {filtered.length === 0 && globalResults.length === 0 && !isSearchingGlobal && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-dim">
                      No se encontraron activos para &quot;{search}&quot;. Prueba con otro ticker (ej: TSM, BABA, ARM, COIN).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailPanel asset={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
};
