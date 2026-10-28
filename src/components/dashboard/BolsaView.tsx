'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ARGENTINA_TICKERS, COMMODITY_TICKERS, DEFAULT_PINNED, PinnedAsset, SP500_TICKERS, labelFor } from '@/lib/catalog';
import { formatPercent, formatPrice } from '@/lib/format';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { AssetIcon } from '@/components/common/AssetIcon';
import { Asset } from '@/types';

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
        <h2 className="text-[22px]">Bolsa &amp; Materias Primas</h2>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          {(
            [
              ['sp500', 'S&P 500'],
              ['argentina', 'Argentina'],
              ['commodities', 'Commodities'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-[14px] py-[7px] text-[12.5px] ${tab === key ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-line rounded-[6px] p-4">
        <div className="flex justify-between items-center mb-3 gap-2">
          <span className="text-[11.5px] text-dim">
            {loading ? 'Cargando cotizaciones...' : `${filtered.length} activos`}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar..."
            className="bg-bg2 border border-line text-text px-2.5 py-1 rounded-[4px] text-[12px] w-[180px]"
          />
        </div>

        {loading ? (
          <div className="text-dim text-[12.5px]">Cargando cotizaciones...</div>
        ) : error ? (
          <div className="text-red text-[12.5px]">{error}</div>
        ) : (
          <div>
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
                  <th className="p-[8px_10px] border-b border-line"></th>
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
                      className="hover:bg-[#1a2030] cursor-pointer"
                    >
                      <td className="p-[9px_10px] border-b border-line font-bold">
                        <div className="flex items-center gap-2">
                          <AssetIcon symbol={q.symbol} name={q.name ?? undefined} type="stock" size="sm" />
                          <span>{q.symbol}</span>
                        </div>
                      </td>
                      <td className="p-[9px_10px] border-b border-line text-dim truncate max-w-[220px] hidden sm:table-cell">
                        {q.name || '—'}
                      </td>
                      <td className="p-[9px_10px] border-b border-line text-right">${formatPrice(q.price)}</td>
                      <td
                        className={`p-[9px_10px] border-b border-line text-right ${
                          (q.change ?? 0) >= 0 ? 'text-teal' : 'text-red'
                        }`}
                      >
                        {formatPercent(q.change)}
                      </td>
                      <td className="p-[9px_10px] border-b border-line text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(q.symbol);
                          }}
                          title={isPinned ? 'Quitar del dashboard' : 'Fijar en dashboard'}
                          className={`text-[14px] ${isPinned ? 'text-gold' : 'text-dim hover:text-text'}`}
                        >
                          {isPinned ? '★' : '☆'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailPanel asset={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
};
