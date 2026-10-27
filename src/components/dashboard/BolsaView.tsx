'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ARGENTINA_TICKERS, COMMODITY_TICKERS, DEFAULT_PINNED, PinnedAsset, SP500_TICKERS, labelFor } from '@/lib/catalog';
import { formatPercent, formatPrice } from '@/lib/format';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { Asset } from '@/types';

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  name: string | null;
}

type Tab = 'sp500' | 'argentina' | 'commodities';

const TAB_TICKERS: Record<Tab, string> = {
  sp500: SP500_TICKERS,
  argentina: ARGENTINA_TICKERS,
  commodities: COMMODITY_TICKERS,
};

export const BolsaView = () => {
  const [tab, setTab] = useState<Tab>('sp500');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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
    if (!q) return quotes;
    return quotes.filter(
      (item) => item.symbol.toLowerCase().includes(q) || (item.name ?? '').toLowerCase().includes(q)
    );
  }, [quotes, search]);

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
          <div className="max-h-[65vh] overflow-y-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="sticky top-0 bg-card">
                <tr>
                  <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Ticker</th>
                  <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Nombre</th>
                  <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px] text-right">Precio</th>
                  <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px] text-right">24h%</th>
                  <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]"></th>
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
                      <td className="p-[9px_10px] border-b border-line font-bold">{q.symbol}</td>
                      <td className="p-[9px_10px] border-b border-line text-dim truncate max-w-[220px]">
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
