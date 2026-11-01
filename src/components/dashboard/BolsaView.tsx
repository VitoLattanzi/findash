'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_PINNED, PinnedAsset, SP500_TICKERS, labelFor } from '@/lib/catalog';
import { formatPercent, formatPrice } from '@/lib/format';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { BolsaNewsCard } from '@/components/dashboard/BolsaNewsCard';
import { TradingViewStockHeatmap } from '@/components/common/TradingViewStockHeatmap';
import { AssetIcon } from '@/components/common/AssetIcon';
import { Sparkline } from '@/components/common/Sparkline';
import { TimeframeControl } from '@/components/common/TimeframeHeader';
import { ChangeTimeframe } from '@/lib/timeframe';
import { Asset } from '@/types';
import { SearchResultItem } from '@/app/api/search/route';
import {
  Search,
  Globe,
  Loader2,
  X,
  Layers,
  Gem,
  Landmark,
  Flame,
} from 'lucide-react';

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  name: string | null;
  bars?: number[] | null;
  marketCap?: number | null;
  volume?: number | null;
}

type SortKey = 'symbol' | 'name' | 'price' | 'change' | 'volume';
type SectorGroup = 'all' | 'mag7' | 'finanzas' | 'consumo_salud' | 'energia_ind';

const SECTOR_GROUPS: Array<{
  key: SectorGroup;
  label: string;
  symbols: string[] | null; // null = todas las S&P 500
}> = [
  { key: 'all', label: 'Todas (S&P 500)', symbols: null },
  {
    key: 'mag7',
    label: 'Mag 7 & IA',
    symbols: [
      'NVDA',
      'AAPL',
      'MSFT',
      'AMZN',
      'GOOGL',
      'META',
      'TSLA',
      'AVGO',
      'AMD',
      'PLTR',
      'ORCL',
      'CRM',
      'NFLX',
      'ADBE',
      'MU',
      'PANW',
      'CRWD',
      'SNOW',
    ],
  },
  {
    key: 'finanzas',
    label: 'Finanzas',
    symbols: ['BRK-B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'SPGI', 'BLK', 'C', 'SCHW', 'CB', 'PGR'],
  },
  {
    key: 'consumo_salud',
    label: 'Consumo & Salud',
    symbols: [
      'LLY',
      'UNH',
      'JNJ',
      'ABBV',
      'WMT',
      'COST',
      'PG',
      'KO',
      'PEP',
      'HD',
      'MCD',
      'DIS',
      'MRK',
      'TMO',
      'ABT',
      'ISRG',
      'AMGN',
      'PFE',
      'SBUX',
      'BKNG',
      'TJX',
    ],
  },
  {
    key: 'energia_ind',
    label: 'Energía & Ind.',
    symbols: ['XOM', 'CVX', 'COP', 'CAT', 'GE', 'RTX', 'LMT', 'UNP', 'DE', 'BA', 'ETN', 'HON', 'LIN', 'NEE'],
  },
];

// 1. Columna "Mercado de Oro y eso" (Materias Primas / Commodities)
const COMMODITIES_ITEMS: Array<{ symbol: string; displayName: string; unit: string }> = [
  { symbol: 'GC=F', displayName: 'Oro (Gold Futures)', unit: 'oz' },
  { symbol: 'SI=F', displayName: 'Plata (Silver)', unit: 'oz' },
  { symbol: 'CL=F', displayName: 'Petróleo WTI', unit: 'bbl' },
  { symbol: 'BZ=F', displayName: 'Petróleo Brent', unit: 'bbl' },
  { symbol: 'NG=F', displayName: 'Gas Natural', unit: 'MMBtu' },
  { symbol: 'HG=F', displayName: 'Cobre (Copper)', unit: 'lb' },
  { symbol: 'ZS=F', displayName: 'Soja (Chicago)', unit: 'bu' },
  { symbol: 'ZW=F', displayName: 'Trigo (Wheat)', unit: 'bu' },
  { symbol: 'ZC=F', displayName: 'Maíz (Corn)', unit: 'bu' },
  { symbol: 'PL=F', displayName: 'Platino', unit: 'oz' },
];

// 2. Columna "Mercado Global" (Índices Mundiales, Tasas & Gigantes Internacionales)
const GLOBAL_MARKET_ITEMS: Array<{ symbol: string; displayName: string; region: string }> = [
  { symbol: '^GSPC', displayName: 'S&P 500 Index', region: 'EE.UU.' },
  { symbol: '^IXIC', displayName: 'Nasdaq Composite', region: 'EE.UU.' },
  { symbol: '^DJI', displayName: 'Dow Jones Ind.', region: 'EE.UU.' },
  { symbol: '^TNX', displayName: 'Bono Tesoro US 10Y', region: 'Tasa' },
  { symbol: '^VIX', displayName: 'Índice Volatilidad VIX', region: 'Riesgo' },
  { symbol: 'TSM', displayName: 'TSMC Semiconductores', region: 'Taiwán' },
  { symbol: 'ASML', displayName: 'ASML Holding', region: 'Europa' },
  { symbol: 'BABA', displayName: 'Alibaba Group', region: 'China' },
  { symbol: 'NVO', displayName: 'Novo Nordisk', region: 'Europa' },
  { symbol: 'NU', displayName: 'Nu Holdings (Nubank)', region: 'Brasil' },
  { symbol: 'SHEL', displayName: 'Shell plc', region: 'Reino Unido' },
  { symbol: 'TM', displayName: 'Toyota Motor', region: 'Japón' },
];

// 3. Columna "Argentina" (ADRs & Líderes Nacionales)
const ARGENTINA_MARKET_ITEMS: Array<{ symbol: string; displayName: string; sector: string }> = [
  { symbol: 'MELI', displayName: 'MercadoLibre', sector: 'E-Commerce & Fintech' },
  { symbol: 'YPF', displayName: 'YPF S.A.', sector: 'Petróleo & Vaca Muerta' },
  { symbol: 'GGAL', displayName: 'Grupo Fin. Galicia', sector: 'Bancos' },
  { symbol: 'VIST', displayName: 'Vista Energy', sector: 'Shale Oil & Gas' },
  { symbol: 'PAM', displayName: 'Pampa Energía', sector: 'Energía' },
  { symbol: 'BMA', displayName: 'Banco Macro', sector: 'Bancos' },
  { symbol: 'TGS', displayName: 'Transp. Gas del Sur', sector: 'Gasoductos' },
  { symbol: 'CEPU', displayName: 'Central Puerto', sector: 'Generación Eléctrica' },
  { symbol: 'LOMA', displayName: 'Loma Negra', sector: 'Construcción' },
  { symbol: 'EDN', displayName: 'Edenor', sector: 'Distribución Eléctrica' },
  { symbol: 'SUPV', displayName: 'Grupo Supervielle', sector: 'Bancos' },
  { symbol: 'TEO', displayName: 'Telecom Argentina', sector: 'Telecomunicaciones' },
  { symbol: 'CRESY', displayName: 'Cresud', sector: 'Agro & Real Estate' },
];

const formatVolumeCompact = (v?: number | null) => {
  if (v == null || v <= 0) return '—';
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

export const BolsaView = () => {
  const [sectorGroup, setSectorGroup] = useState<SectorGroup>('all');
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState<ChangeTimeframe>('24h');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'volume', dir: -1 });
  const [pinned, setPinned] = useLocalStorage<PinnedAsset[]>('findash_pinned_v2', DEFAULT_PINNED);
  const [selected, setSelected] = useState<Asset | null>(null);

  // Búsqueda global en vivo vía API (para cualquier acción del mundo no limitada al catálogo)
  const [globalResults, setGlobalResults] = useState<SearchResultItem[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // Lista unificada de todos los tickers que alimentan los paneles en simultáneo
  const allTickersString = useMemo(() => {
    const spList = SP500_TICKERS.split(',');
    const commList = COMMODITIES_ITEMS.map((i) => i.symbol);
    const globList = GLOBAL_MARKET_ITEMS.map((i) => i.symbol);
    const argList = ARGENTINA_MARKET_ITEMS.map((i) => i.symbol);
    return Array.from(new Set([...spList, ...commList, ...globList, ...argList])).join(',');
  }, []);

  // Carga unificada de cotizaciones según el rango temporal elegido (12h, 24h, 1sem, 1mes, 3meses)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/api/market?tickers=${encodeURIComponent(allTickersString)}&timeframe=${encodeURIComponent(timeframe)}&spark=1`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          const map: Record<string, Quote> = {};
          for (const item of data) {
            if (item?.symbol) map[item.symbol] = item;
          }
          setQuotesMap(map);
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
  }, [allTickersString, timeframe]);

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
            const localSymbols = new Set(Object.keys(quotesMap).map((s) => s.toUpperCase()));
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
  }, [search, quotesMap]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 1 ? -1 : 1 }
        : { key, dir: key === 'symbol' || key === 'name' ? 1 : -1 }
    );

  const sortArrow = (key: SortKey) =>
    sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕';

  const togglePin = (symbol: string, customLabel?: string) => {
    const isPinned = pinned.some((p) => p.symbol === symbol);
    if (isPinned) {
      setPinned(pinned.filter((p) => p.symbol !== symbol));
    } else {
      setPinned([...pinned, { symbol, label: customLabel || labelFor(symbol), type: 'stock' }]);
    }
  };

  // Filas para el Bloque 2 (Arriba a la Derecha: Principales Acciones & Conjuntos S&P 500)
  const sp500Rows = useMemo(() => {
    const activeGroupObj = SECTOR_GROUPS.find((g) => g.key === sectorGroup);
    const allowedSymbols = activeGroupObj?.symbols
      ? new Set(activeGroupObj.symbols)
      : new Set(SP500_TICKERS.split(','));

    const q = search.trim().toLowerCase();
    const list: Quote[] = [];

    for (const sym of allowedSymbols) {
      const item = quotesMap[sym];
      if (!item) continue;
      if (q) {
        const matchSym = item.symbol.toLowerCase().includes(q);
        const matchName = (item.name ?? '').toLowerCase().includes(q);
        if (!matchSym && !matchName) continue;
      }
      list.push(item);
    }

    return list.sort((a, b) => {
      if (sort.key === 'symbol') return a.symbol.localeCompare(b.symbol, 'es') * sort.dir;
      if (sort.key === 'name') {
        return (a.name ?? a.symbol).localeCompare(b.name ?? b.symbol, 'es') * sort.dir;
      }
      if (sort.key === 'price') return ((a.price ?? 0) - (b.price ?? 0)) * sort.dir;
      if (sort.key === 'volume') return ((a.volume ?? 0) - (b.volume ?? 0)) * sort.dir;
      return ((a.change ?? 0) - (b.change ?? 0)) * sort.dir;
    });
  }, [quotesMap, sectorGroup, search, sort]);

  // Helper para ordenar cualquiera de las 3 columnas del Bloque 3 (Oro y eso | Mercado Global | Argentina)
  const getSortedMiniColumn = <T extends { symbol: string; displayName: string }>(items: T[]) => {
    const q = search.trim().toLowerCase();
    const filtered = items
      .map((meta) => {
        const quote = quotesMap[meta.symbol];
        return {
          ...meta,
          price: quote?.price ?? null,
          change: quote?.change ?? null,
          bars: quote?.bars ?? [],
          volume: quote?.volume ?? null,
        };
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.symbol.toLowerCase().includes(q) ||
          row.displayName.toLowerCase().includes(q)
        );
      });

    return filtered.sort((a, b) => {
      if (sort.key === 'symbol' || sort.key === 'name') {
        return a.displayName.localeCompare(b.displayName, 'es') * sort.dir;
      }
      if (sort.key === 'price') {
        return ((a.price ?? 0) - (b.price ?? 0)) * sort.dir;
      }
      if (sort.key === 'volume') {
        return ((a.volume ?? 0) - (b.volume ?? 0)) * sort.dir;
      }
      return ((a.change ?? 0) - (b.change ?? 0)) * sort.dir;
    });
  };

  const commoditiesRows = useMemo(() => getSortedMiniColumn(COMMODITIES_ITEMS), [quotesMap, search, sort]);
  const globalRows = useMemo(() => getSortedMiniColumn(GLOBAL_MARKET_ITEMS), [quotesMap, search, sort]);
  const argentinaRows = useMemo(() => getSortedMiniColumn(ARGENTINA_MARKET_ITEMS), [quotesMap, search, sort]);

  return (
    <section className="space-y-5">
      {/* BARRA SUPERIOR: Título + Buscador Global Universal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-line rounded-[6px] p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[20px] font-display font-semibold text-text">
              Bolsa &amp; Materias Primas
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
              Wall St · Global · BYMA
            </span>
          </div>
          <p className="text-[12px] text-dim mt-0.5">
            Mapa de calor sectorial S&amp;P 500, conjuntos líderes, materias primas, índices globales, ADRs argentinos y noticias.
          </p>
        </div>

        {/* Input de búsqueda universal */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar o buscar cualquier acción mundial (ej: NVDA, TSM, YPF)..."
            className="bg-bg2 border border-line text-text pl-9 pr-8 py-1.5 rounded-lg text-[12.5px] w-full focus:outline-none focus:border-gold transition-colors placeholder-dim/60"
          />
          {isSearchingGlobal ? (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold animate-spin" />
          ) : search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-text"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {/* =====================================================================
          FILA SUPERIOR:
          Izquierda (53%): Bloque 1 — Mapa de Calor Bursátil (TradingView)
          Derecha  (47%): Bloque 2 — Principales Acciones o Conjuntos (S&P 500)
      ===================================================================== */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        {/* BLOQUE 1: Mapa de Calor de Acciones (53%) */}
        <div className="w-full xl:w-[53%] min-w-0">
          <TradingViewStockHeatmap />
        </div>

        {/* BLOQUE 2: Principales Acciones o Conjuntos al estilo S&P 500 (47%) */}
        <div className="w-full xl:w-[47%] min-w-0">
          <div className="bg-card border border-line rounded-[6px] p-3.5 flex flex-col h-[580px] shadow-sm">
            {/* Cabecera del Panel */}
            <div className="flex items-center justify-between pb-2.5 border-b border-line gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gold/15 text-gold border border-gold/30 flex items-center justify-center">
                  <Layers size={14} />
                </div>
                <h3 className="text-[13.5px] font-semibold text-text flex items-center gap-2">
                  <span>Principales Acciones &amp; Conjuntos</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg2 border border-line text-dim">
                    {loading ? '...' : `${sp500Rows.length} activos`}
                  </span>
                </h3>
              </div>

              {error && <span className="text-[11px] text-red font-mono">{error}</span>}
            </div>

            {/* Píldoras de Conjuntos (Todas | Mag 7 & IA | Finanzas | Consumo & Salud | Energía & Ind.) */}
            <div className="flex items-center gap-1.5 py-2 border-b border-line/60 overflow-x-auto no-scrollbar flex-shrink-0">
              {SECTOR_GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSectorGroup(g.key)}
                  className={`px-2.5 py-1 rounded-[5px] text-[11px] font-mono whitespace-nowrap border transition-colors cursor-pointer ${
                    sectorGroup === g.key
                      ? 'bg-gold text-bg border-gold font-semibold'
                      : 'bg-bg2 text-dim border-line hover:text-text'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Tabla Scrolleable de Principales Acciones */}
            <div className="flex-1 overflow-y-auto overflow-x-auto pr-0.5 min-h-0">
              {loading && Object.keys(quotesMap).length === 0 ? (
                <div className="py-16 text-center text-dim text-[12.5px]">
                  <Loader2 size={22} className="mx-auto mb-2 text-gold animate-spin" />
                  Cargando cotizaciones de Wall Street...
                </div>
              ) : (
                <table className="w-full text-left text-[12px] border-collapse min-w-[340px]">
                  <thead className="sticky top-0 bg-card z-20">
                    <tr className="border-b border-line text-dim font-medium text-[10.5px] uppercase tracking-wider">
                      <th
                        onClick={() => toggleSort('symbol')}
                        className={`py-2 px-2 cursor-pointer select-none hover:text-text ${
                          sort.key === 'symbol' ? 'text-gold' : ''
                        }`}
                      >
                        Activo <span className="text-[9px] ml-0.5">{sortArrow('symbol')}</span>
                      </th>
                      <th
                        onClick={() => toggleSort('price')}
                        className={`py-2 px-2 text-right cursor-pointer select-none hover:text-text ${
                          sort.key === 'price' ? 'text-gold' : ''
                        }`}
                      >
                        Precio <span className="text-[9px] ml-0.5">{sortArrow('price')}</span>
                      </th>
                      <th className="py-2 px-2 text-right">
                        <TimeframeControl
                          timeframe={timeframe}
                          onTimeframeChange={setTimeframe}
                          sortActive={sort.key === 'change'}
                          sortDir={sort.dir}
                          onSortClick={() => toggleSort('change')}
                          align="right"
                        />
                      </th>
                      <th
                        onClick={() => toggleSort('volume')}
                        className={`hidden sm:table-cell py-2 px-2 text-right cursor-pointer select-none hover:text-text ${
                          sort.key === 'volume' ? 'text-gold' : ''
                        }`}
                      >
                        Volumen <span className="text-[9px] ml-0.5">{sortArrow('volume')}</span>
                      </th>
                      <th className="hidden md:table-cell py-2 px-2 text-center">Gráfico</th>
                      <th className="py-2 px-1 text-center w-7">★</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    {sp500Rows.map((q) => {
                      const isPinned = pinned.some((p) => p.symbol === q.symbol);
                      const change = q.change ?? 0;
                      return (
                        <tr
                          key={q.symbol}
                          onClick={() =>
                            setSelected({
                              name: q.name || q.symbol,
                              symbol: q.symbol,
                              type: 'stock',
                              price: q.price ?? 0,
                              change,
                              bars: q.bars ?? [],
                            })
                          }
                          className="cursor-pointer hover:bg-bg2/70 transition-colors group"
                        >
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <AssetIcon
                                symbol={q.symbol}
                                name={q.name ?? undefined}
                                type="stock"
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="font-mono font-bold text-text group-hover:text-gold transition-colors leading-tight">
                                  {q.symbol}
                                </div>
                                <span className="text-[10px] text-dim block truncate max-w-[125px]">
                                  {q.name || '—'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-2 px-2 text-right font-mono font-medium text-text">
                            ${formatPrice(q.price)}
                          </td>

                          <td
                            className={`py-2 px-2 text-right font-mono font-semibold ${
                              change >= 0 ? 'text-teal' : 'text-red'
                            }`}
                          >
                            {formatPercent(q.change)}
                          </td>

                          <td className="hidden sm:table-cell py-2 px-2 text-right font-mono text-dim text-[11px]">
                            {formatVolumeCompact(q.volume)}
                          </td>

                          <td className="hidden md:table-cell py-2 px-2 text-center">
                            <div className="w-[64px] h-[20px] mx-auto">
                              <Sparkline data={q.bars ?? []} change={change} width={64} height={20} />
                            </div>
                          </td>

                          <td
                            className="py-2 px-1 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(q.symbol, q.name || q.symbol);
                            }}
                          >
                            <button
                              title={isPinned ? 'Quitar del dashboard' : 'Fijar en dashboard'}
                              className={`text-[14px] transition-transform active:scale-125 ${
                                isPinned ? 'text-gold' : 'text-dim hover:text-text'
                              }`}
                            >
                              {isPinned ? '★' : '☆'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Resultados Globales en Vivo cuando el usuario busca cualquier ticker fuera de la lista */}
                    {search.trim().length >= 2 && globalResults.length > 0 && (
                      <>
                        <tr className="bg-bg2/90 border-t border-line">
                          <td
                            colSpan={6}
                            className="py-1.5 px-2 text-[10px] font-mono text-gold uppercase tracking-wider"
                          >
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Globe size={11} />
                              Resultados globales en Yahoo Finance ({globalResults.length})
                            </span>
                          </td>
                        </tr>
                        {globalResults.map((r) => {
                          const isPinned = pinned.some((p) => p.symbol === r.symbol);
                          const chg = r.change ?? 0;
                          return (
                            <tr
                              key={r.symbol}
                              onClick={() =>
                                setSelected({
                                  name: r.name || r.symbol,
                                  symbol: r.symbol,
                                  type: r.type === 'crypto' ? 'crypto' : 'stock',
                                  price: r.price ?? 0,
                                  change: chg,
                                  bars: [],
                                })
                              }
                              className="cursor-pointer hover:bg-bg2/80 transition-colors bg-card/40"
                            >
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <AssetIcon symbol={r.symbol} name={r.name} type="stock" size="sm" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono font-bold text-text">{r.symbol}</span>
                                      {r.exchange && (
                                        <span className="text-[9px] font-mono px-1 rounded bg-bg border border-line text-dim">
                                          {r.exchange}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-dim block truncate max-w-[120px]">
                                      {r.name}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-medium">
                                {r.price != null ? `$${formatPrice(r.price)}` : '—'}
                              </td>
                              <td
                                className={`py-2 px-2 text-right font-mono font-semibold ${
                                  chg >= 0 ? 'text-teal' : 'text-red'
                                }`}
                              >
                                {r.change != null ? formatPercent(r.change) : '—'}
                              </td>
                              <td className="hidden sm:table-cell py-2 px-2 text-right text-dim">—</td>
                              <td className="hidden md:table-cell py-2 px-2 text-center text-dim">—</td>
                              <td
                                className="py-2 px-1 text-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(r.symbol, r.name || r.symbol);
                                }}
                              >
                                <button
                                  className={`text-[14px] ${
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
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FILA INFERIOR:
          Izquierda (53%): Bloque 3 — Panel Triple (Mercado de Oro y eso | Mercado Global | Argentina)
          Derecha  (47%): Bloque 4 — Noticias / Lanzamientos / Habló X Persona
      ===================================================================== */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        {/* BLOQUE 3: Panel Triple en Paralelo (53%) */}
        <div className="w-full xl:w-[53%] min-w-0">
          <div className="bg-card border border-line rounded-[6px] p-3.5 flex flex-col h-full shadow-sm">
            {/* Barra de control compartida para las 3 columnas */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-line gap-2 flex-wrap">
              <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-dim">
                <button
                  type="button"
                  onClick={() => toggleSort('name')}
                  className={`hover:text-text transition-colors cursor-pointer ${
                    sort.key === 'name' || sort.key === 'symbol' ? 'text-gold font-semibold' : ''
                  }`}
                >
                  Activo <span className="text-[9px] ml-0.5">{sortArrow('name')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('price')}
                  className={`hover:text-text transition-colors cursor-pointer ${
                    sort.key === 'price' ? 'text-gold font-semibold' : ''
                  }`}
                >
                  Precio <span className="text-[9px] ml-0.5">{sortArrow('price')}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono text-dim hidden sm:inline">Rango %:</span>
                <TimeframeControl
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  sortActive={sort.key === 'change'}
                  sortDir={sort.dir}
                  onSortClick={() => toggleSort('change')}
                  align="right"
                />
              </div>
            </div>

            {/* Grilla de 3 Columnas Verticales Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
              {/* COLUMNA 1: Mercado de Oro y Materias Primas */}
              <div className="bg-bg2/60 border border-line rounded-[6px] flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-bg2 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gem size={13} className="text-gold" />
                    <h4 className="text-[12px] font-semibold text-text">Oro &amp; Materias Primas</h4>
                  </div>
                  <span className="text-[9.5px] font-mono text-dim">{commoditiesRows.length}</span>
                </div>

                <div className="divide-y divide-line/40 overflow-y-auto max-h-[390px] px-1">
                  {commoditiesRows.map((item) => {
                    const chg = item.change ?? 0;
                    return (
                      <div
                        key={item.symbol}
                        onClick={() =>
                          setSelected({
                            name: item.displayName,
                            symbol: item.symbol,
                            type: 'stock',
                            price: item.price ?? 0,
                            change: chg,
                            bars: item.bars,
                          })
                        }
                        className="flex items-center justify-between py-2 px-2 hover:bg-card/80 rounded transition-colors cursor-pointer group gap-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AssetIcon symbol={item.symbol} name={item.displayName} type="stock" size="sm" />
                          <div className="min-w-0">
                            <div className="text-[11.5px] font-semibold text-text group-hover:text-gold transition-colors truncate">
                              {item.displayName}
                            </div>
                            <span className="text-[9.5px] font-mono text-dim block">
                              {item.symbol.replace('=F', '')} · {item.unit}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-[11.5px] font-mono font-medium text-text">
                            ${formatPrice(item.price)}
                          </div>
                          <div
                            className={`text-[10.5px] font-mono font-semibold ${
                              chg >= 0 ? 'text-teal' : 'text-red'
                            }`}
                          >
                            {formatPercent(item.change)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA 2: Mercado Global (Índices, Bonos & Internacionales) */}
              <div className="bg-bg2/60 border border-line rounded-[6px] flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-bg2 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} className="text-teal" />
                    <h4 className="text-[12px] font-semibold text-text">Mercado Global</h4>
                  </div>
                  <span className="text-[9.5px] font-mono text-dim">{globalRows.length}</span>
                </div>

                <div className="divide-y divide-line/40 overflow-y-auto max-h-[390px] px-1">
                  {globalRows.map((item) => {
                    const chg = item.change ?? 0;
                    return (
                      <div
                        key={item.symbol}
                        onClick={() =>
                          setSelected({
                            name: item.displayName,
                            symbol: item.symbol,
                            type: 'stock',
                            price: item.price ?? 0,
                            change: chg,
                            bars: item.bars,
                          })
                        }
                        className="flex items-center justify-between py-2 px-2 hover:bg-card/80 rounded transition-colors cursor-pointer group gap-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AssetIcon symbol={item.symbol} name={item.displayName} type="stock" size="sm" />
                          <div className="min-w-0">
                            <div className="text-[11.5px] font-semibold text-text group-hover:text-gold transition-colors truncate">
                              {item.displayName}
                            </div>
                            <span className="text-[9.5px] font-mono text-dim block">
                              {item.symbol} · <span className="text-gold/90">{item.region}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-[11.5px] font-mono font-medium text-text">
                            {item.symbol === '^TNX'
                              ? `${formatPrice(item.price)}%`
                              : `$${formatPrice(item.price)}`}
                          </div>
                          <div
                            className={`text-[10.5px] font-mono font-semibold ${
                              chg >= 0 ? 'text-teal' : 'text-red'
                            }`}
                          >
                            {formatPercent(item.change)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA 3: Argentina (ADRs & Acciones Líderes) */}
              <div className="bg-bg2/60 border border-line rounded-[6px] flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-bg2 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Landmark size={13} className="text-gold" />
                    <h4 className="text-[12px] font-semibold text-text">Argentina (ADRs)</h4>
                  </div>
                  <span className="text-[9.5px] font-mono text-dim">{argentinaRows.length}</span>
                </div>

                <div className="divide-y divide-line/40 overflow-y-auto max-h-[390px] px-1">
                  {argentinaRows.map((item) => {
                    const chg = item.change ?? 0;
                    return (
                      <div
                        key={item.symbol}
                        onClick={() =>
                          setSelected({
                            name: item.displayName,
                            symbol: item.symbol,
                            type: 'stock',
                            price: item.price ?? 0,
                            change: chg,
                            bars: item.bars,
                          })
                        }
                        className="flex items-center justify-between py-2 px-2 hover:bg-card/80 rounded transition-colors cursor-pointer group gap-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AssetIcon symbol={item.symbol} name={item.displayName} type="stock" size="sm" />
                          <div className="min-w-0">
                            <div className="text-[11.5px] font-semibold text-text group-hover:text-gold transition-colors truncate">
                              {item.symbol}{' '}
                              <span className="font-normal text-dim text-[10.5px]">
                                · {item.displayName}
                              </span>
                            </div>
                            <span className="text-[9.5px] font-mono text-dim block truncate">
                              {item.sector}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-[11.5px] font-mono font-medium text-text">
                            ${formatPrice(item.price)}
                          </div>
                          <div
                            className={`text-[10.5px] font-mono font-semibold ${
                              chg >= 0 ? 'text-teal' : 'text-red'
                            }`}
                          >
                            {formatPercent(item.change)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 4: Noticias / Lanzamientos / Habló X Persona (47%) */}
        <div className="w-full xl:w-[47%] min-w-0">
          <BolsaNewsCard />
        </div>
      </div>

      {/* Modal Central de Detalle al hacer clic en cualquier activo de cualquiera de los bloques */}
      <DetailPanel asset={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
};
