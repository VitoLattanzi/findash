'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { AssetList } from '@/components/dashboard/AssetList';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import { Asset } from '@/types';
import { CATALOG, CATALOG_GROUPS, DEFAULT_PINNED, PinnedAsset } from '@/lib/catalog';

interface QuoteResponse {
  symbol: string;
  price: number | null;
  change: number | null;
  bars: number[] | null;
}

interface DollarQuote {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
}

export const DashboardView = () => {
  const [pinned, setPinned] = useLocalStorage<PinnedAsset[]>('findash_pinned', DEFAULT_PINNED);
  const [view, setView] = useState<'list' | 'card'>('list');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quotes, setQuotes] = useState<Record<string, QuoteResponse>>({});
  const [klines, setKlines] = useState<Record<string, number[]>>({});
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [dollars, setDollars] = useState<DollarQuote[]>([]);
  const [risk, setRisk] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<string>('crypto');

  const cryptoPinned = useMemo(
    () => pinned.filter((p) => p.type === 'crypto').map((p) => `${p.symbol.toLowerCase()}usdt`),
    [pinned]
  );
  const stockPinned = useMemo(() => pinned.filter((p) => p.type === 'stock').map((p) => p.symbol), [pinned]);

  const liveCrypto = useBinanceWebSocket(cryptoPinned);

  useEffect(() => {
    if (stockPinned.length === 0) {
      setQuotes({});
      return;
    }
    let cancelled = false;
    setLoadingStocks(true);

    fetch(`/api/market?tickers=${encodeURIComponent(stockPinned.join(','))}&spark=1`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const map: Record<string, QuoteResponse> = {};
        for (const item of data) map[item.symbol] = item;
        setQuotes(map);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingStocks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stockPinned.join(',')]);

  useEffect(() => {
    if (cryptoPinned.length === 0) {
      setKlines({});
      return;
    }
    let cancelled = false;
    const pairs = cryptoPinned.map((c) => c.toUpperCase()).join(',');

    fetch(`/api/klines?symbols=${pairs}&interval=1h&limit=48`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data) return;
        const map: Record<string, number[]> = {};
        for (const key of Object.keys(data)) {
          const candles = data[key];
          if (Array.isArray(candles)) map[key] = candles.map((c: { close: number }) => c.close);
        }
        setKlines(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [cryptoPinned.join(',')]);

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDollars(data.filter((d: DollarQuote) => ['oficial', 'blue', 'bolsa', 'contadoconliqui'].includes(d.casa)));
        }
      })
      .catch(() => {});

    fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo')
      .then((res) => res.json())
      .then((data) => {
        const v = data?.valor;
        if (typeof v === 'number') setRisk(v);
      })
      .catch(() => {});
  }, []);

  const assets: Asset[] = useMemo(() => {
    return pinned.map((p) => {
      if (p.type === 'crypto') {
        const pair = `${p.symbol.toUpperCase()}USDT`;
        const t = liveCrypto[pair];
        const price = t ? parseFloat(t.c) : 0;
        const open = t ? parseFloat(t.o) : 0;
        const change = t && open ? ((price - open) / open) * 100 : 0;
        return {
          name: p.symbol,
          symbol: p.symbol,
          type: 'crypto' as const,
          price,
          change,
          bars: klines[pair] ?? [],
        };
      }
      const q = quotes[p.symbol];
      return {
        name: p.symbol,
        symbol: p.symbol,
        type: 'stock' as const,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        bars: q?.bars ?? [],
      };
    });
  }, [pinned, liveCrypto, klines, quotes]);

  const unpin = (symbol: string) => setPinned(pinned.filter((p) => p.symbol !== symbol));
  const pin = (item: (typeof CATALOG)[number]) =>
    setPinned([...pinned, { symbol: item.symbol, label: item.label, type: item.type }]);

  const catalogFiltered = CATALOG.filter(
    (c) => c.group === group && c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const dollarLabel: Record<string, string> = {
    oficial: 'Dólar Oficial',
    blue: 'Dólar Blue',
    bolsa: 'Dólar MEP',
    contadoconliqui: 'Dólar CCL',
  };

  return (
    <>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Dashboard</h2>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={`px-[14px] py-[7px] text-[12.5px] ${view === 'list' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setView('card')}
            className={`px-[14px] py-[7px] text-[12.5px] ${view === 'card' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            Cards
          </button>
        </div>
      </div>

      <div className="flex gap-5 items-start flex-wrap">
        <div className="flex-[2] min-w-[340px] flex flex-col gap-4">
          <div className="bg-card border border-line rounded-[6px] p-4">
            <h3 className="text-[13.5px] text-dim font-medium mb-2.5">ACTIVOS FIJADOS</h3>
            {pinned.length === 0 ? (
              <div className="text-dim text-[12.5px]">
                Todavía no fijaste ningún activo. Usá el catálogo de abajo para agregarlos.
              </div>
            ) : loadingStocks && assets.every((a) => a.type === 'stock') ? (
              <div className="text-dim text-[12.5px]">Cargando activos...</div>
            ) : (
              <AssetList
                assets={assets}
                view={view}
                onAssetClick={(a) => setSelectedAsset(a)}
                onRemove={(a) => unpin(a.symbol ?? a.name)}
              />
            )}
          </div>

          <div className="bg-card border border-line rounded-[6px] p-4">
            <div className="flex justify-between items-center mb-2.5 flex-wrap gap-2">
              <h3 className="text-[13.5px] text-dim font-medium">AGREGAR AL DASHBOARD</h3>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ticker..."
                className="bg-bg2 border border-line text-text px-2.5 py-1 rounded-[4px] text-[12px] w-[160px]"
              />
            </div>
            <div className="mb-3">
              {CATALOG_GROUPS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGroup(g.key)}
                  className={`inline-block bg-bg2 border border-line text-[11.5px] p-[3px_8px] rounded-[4px] mr-2 mb-1 ${
                    group === g.key ? 'text-gold border-gold' : 'text-dim'
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[190px] overflow-y-auto">
              {catalogFiltered.map((item) => {
                const isPinned = pinned.some((p) => p.symbol === item.symbol);
                return (
                  <button
                    key={item.symbol}
                    onClick={() => (isPinned ? unpin(item.symbol) : pin(item))}
                    title={item.label}
                    className={`text-[11.5px] px-2 py-1 rounded-[4px] border ${
                      isPinned
                        ? 'border-gold text-gold bg-bg2'
                        : 'border-line text-dim bg-bg2 hover:border-dim'
                    }`}
                  >
                    {isPinned ? '✓ ' : '+ '}
                    {item.symbol}
                  </button>
                );
              })}
              {catalogFiltered.length === 0 && (
                <span className="text-dim text-[12px]">Sin resultados.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-[1] min-w-[260px] flex flex-col gap-3.5">
          <div className="bg-card border border-line rounded-[6px] p-4">
            <h3 className="text-[13.5px] text-dim font-medium mb-2.5">INDICADORES ARGENTINA</h3>
            {dollars.length === 0 && risk === null ? (
              <div className="text-dim text-[12px]">Cargando indicadores...</div>
            ) : (
              <>
                {dollars.map((d) => (
                  <div key={d.casa} className="flex justify-between text-[12.5px] py-1.5 border-b border-line last:border-none">
                    <span>{dollarLabel[d.casa] ?? d.nombre}</span>
                    <b className="font-semibold">${d.venta?.toLocaleString('es-AR')}</b>
                  </div>
                ))}
                <div className="flex justify-between text-[12.5px] py-1.5">
                  <span>Riesgo País</span>
                  <b className="font-semibold">{risk !== null ? `${risk} pb` : '—'}</b>
                </div>
              </>
            )}
          </div>

          <div className="bg-card border border-line rounded-[6px] p-4">
            <h3 className="text-[13.5px] text-dim font-medium mb-2.5">RESUMEN DEL DÍA</h3>
            <div className="news-item py-[9px] border-b border-line text-[12.5px]">
              El Riesgo País cae por debajo de los 700 puntos.
              <span className="text-gold text-[11px] block mt-[2px]">Ámbito Financiero</span>
            </div>
            <div className="news-item py-[9px] border-b border-line text-[12.5px]">
              Bitcoin se mantiene firme sobre los $67.000.
              <span className="text-gold text-[11px] block mt-[2px]">Cointelegraph ES</span>
            </div>
            <div className="news-item py-[9px] text-[12.5px]">
              Nvidia lidera las subas del Nasdaq tras resultados.
              <span className="text-gold text-[11px] block mt-[2px]">Reuters</span>
            </div>
          </div>
        </div>
      </div>

      <DetailPanel asset={selectedAsset} isOpen={!!selectedAsset} onClose={() => setSelectedAsset(null)} />
    </>
  );
};
