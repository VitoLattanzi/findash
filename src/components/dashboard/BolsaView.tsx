'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useQuotes } from '@/hooks/useQuotes';
import { DEFAULT_PINNED, PinnedAsset, SP500_TICKERS, labelFor } from '@/lib/catalog';
import { fmtCompact, fmtPct, fmtPrice } from '@/lib/format';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type SortKey = 'symbol' | 'name' | 'price' | 'change' | 'volume';
type SectorGroup = 'all' | 'mag7' | 'finanzas' | 'consumo_salud' | 'energia_ind';
type PerformanceFilter = 'all' | 'gainers' | 'losers' | 'active' | 'favorites';

const DEFAULT_FAV_STOCKS = ['NVDA', 'AAPL', 'MSFT', 'MELI', 'AMZN', 'GOOGL'];
const INITIAL_CARD_ROWS = 7;

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

// 1. Columna "Oro & Materias Primas" (Commodities)
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

interface ArgMacroState {
  riesgoPais: number | null;
  mep: number | null;
  ccl: number | null;
  brechaPct: number | null;
}

export const BolsaView = () => {
  const [sectorGroup, setSectorGroup] = useState<SectorGroup>('all');
  const [perfFilter, setPerfFilter] = useState<PerformanceFilter>('all');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState<ChangeTimeframe>('24h');
  // Orden por defecto: Variación % (changePct descendente) en lugar de Volumen nominal
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'change', dir: -1 });
  const [favStocks, setFavStocks] = useLocalStorage<string[]>('findash_fav_stocks', DEFAULT_FAV_STOCKS);
  const [pinned, setPinned] = useLocalStorage<PinnedAsset[]>('findash_pinned_v2', DEFAULT_PINNED);
  const [selected, setSelected] = useState<Asset | null>(null);

  // Estados de expansión para las 3 tarjetas inferiores (elimina la trampa de 5 scrolls anidados)
  const [expandCommodities, setExpandCommodities] = useState(false);
  const [expandGlobal, setExpandGlobal] = useState(false);
  const [expandArgentina, setExpandArgentina] = useState(false);

  // Header Macro para la tarjeta Argentina (Riesgo País, Dólar MEP, Dólar CCL, Brecha %)
  const [argMacro, setArgMacro] = useState<ArgMacroState>({
    riesgoPais: null,
    mep: null,
    ccl: null,
    brechaPct: null,
  });

  // Búsqueda global en vivo vía API
  const [globalResults, setGlobalResults] = useState<SearchResultItem[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // Lista unificada de todos los tickers que alimentan los paneles en simultáneo
  const allTickersList = useMemo(() => {
    const spList = SP500_TICKERS.split(',');
    const commList = COMMODITIES_ITEMS.map((i) => i.symbol);
    const globList = GLOBAL_MARKET_ITEMS.map((i) => i.symbol);
    const argList = ARGENTINA_MARKET_ITEMS.map((i) => i.symbol);
    return Array.from(new Set([...spList, ...commList, ...globList, ...argList]));
  }, []);

  // Polling inteligente según marketState (60s en REGULAR, 10m cerrado) con keepPreviousData
  const { quotesMap, loading, error } = useQuotes(allTickersList, {
    timeframe,
    withSpark: true,
    keepPreviousData: true,
  });

  // Carga de indicadores Macro de Argentina para el Header de la tarjeta Argentina (ADRs)
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      fetch('https://dolarapi.com/v1/dolares').then((r) => r.json()),
      fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo').then((r) => r.json()),
    ]).then(([dolaresRes, riesgoRes]) => {
      if (cancelled) return;

      let mep: number | null = null;
      let ccl: number | null = null;
      let oficial: number | null = null;
      let riesgoPais: number | null = null;

      if (dolaresRes.status === 'fulfilled' && Array.isArray(dolaresRes.value)) {
        for (const d of dolaresRes.value) {
          if (d?.casa === 'bolsa' && typeof d.venta === 'number' && d.venta > 0) mep = d.venta;
          if (d?.casa === 'contadoconliqui' && typeof d.venta === 'number' && d.venta > 0) ccl = d.venta;
          if (d?.casa === 'oficial' && typeof d.venta === 'number' && d.venta > 0) oficial = d.venta;
        }
      }

      if (riesgoRes.status === 'fulfilled' && typeof riesgoRes.value?.valor === 'number') {
        riesgoPais = riesgoRes.value.valor;
      }

      const brechaPct =
        ccl != null && oficial != null && oficial > 0
          ? ((ccl - oficial) / oficial) * 100
          : null;

      setArgMacro({ riesgoPais, mep, ccl, brechaPct });
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handlePerfFilterChange = (next: PerformanceFilter) => {
    setPerfFilter(next);
    if (next === 'gainers') {
      setSort({ key: 'change', dir: -1 });
    } else if (next === 'losers') {
      setSort({ key: 'change', dir: 1 });
    } else if (next === 'active') {
      setSort({ key: 'volume', dir: -1 });
    }
  };

  const toggleFavorite = (symbol: string, customLabel?: string) => {
    const existsFav = favStocks.includes(symbol);
    if (existsFav) {
      setFavStocks(favStocks.filter((s) => s !== symbol));
    } else {
      setFavStocks([...favStocks, symbol]);
    }

    // También sincronizamos con el pin del Dashboard principal
    const isPinned = pinned.some((p) => p.symbol === symbol);
    if (existsFav && isPinned) {
      setPinned(pinned.filter((p) => p.symbol !== symbol));
    } else if (!existsFav && !isPinned) {
      setPinned([...pinned, { symbol, label: customLabel || labelFor(symbol), type: 'stock' }]);
    }
  };

  // Filas para el Bloque 2 (Arriba a la Derecha: Principales Acciones & Conjuntos S&P 500)
  const sp500Rows = useMemo(() => {
    const activeGroupObj = SECTOR_GROUPS.find((g) => g.key === sectorGroup);
    const allowedSymbols = activeGroupObj?.symbols
      ? new Set(activeGroupObj.symbols)
      : new Set(SP500_TICKERS.split(','));

    const favSet = new Set(favStocks);
    const q = search.trim().toLowerCase();
    const list = [];

    for (const sym of allowedSymbols) {
      const item = quotesMap[sym];
      if (!item) continue;

      if (perfFilter === 'favorites' && !favSet.has(sym)) continue;
      if (perfFilter === 'gainers' && (item.change == null || item.change <= 0)) continue;
      if (perfFilter === 'losers' && (item.change == null || item.change >= 0)) continue;

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
      if (sort.key === 'price') {
        if (a.price == null && b.price == null) return 0;
        if (a.price == null) return 1;
        if (b.price == null) return -1;
        return (a.price - b.price) * sort.dir;
      }
      if (sort.key === 'volume') {
        if (a.volume == null && b.volume == null) return 0;
        if (a.volume == null) return 1;
        if (b.volume == null) return -1;
        return (a.volume - b.volume) * sort.dir;
      }
      if (a.change == null && b.change == null) return 0;
      if (a.change == null) return 1;
      if (b.change == null) return -1;
      return (a.change - b.change) * sort.dir;
    });
  }, [quotesMap, sectorGroup, perfFilter, favStocks, search, sort]);

  // Helper para ordenar cualquiera de las 3 columnas del Bloque 3
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
          marketCap: quote?.marketCap ?? null,
          marketState: quote?.marketState ?? null,
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
        if (a.price == null && b.price == null) return 0;
        if (a.price == null) return 1;
        if (b.price == null) return -1;
        return (a.price - b.price) * sort.dir;
      }
      if (sort.key === 'volume') {
        if (a.volume == null && b.volume == null) return 0;
        if (a.volume == null) return 1;
        if (b.volume == null) return -1;
        return (a.volume - b.volume) * sort.dir;
      }
      if (a.change == null && b.change == null) return 0;
      if (a.change == null) return 1;
      if (b.change == null) return -1;
      return (a.change - b.change) * sort.dir;
    });
  };

  const commoditiesRows = useMemo(() => getSortedMiniColumn(COMMODITIES_ITEMS), [quotesMap, search, sort]);
  const globalRows = useMemo(() => getSortedMiniColumn(GLOBAL_MARKET_ITEMS), [quotesMap, search, sort]);
  const argentinaRows = useMemo(() => getSortedMiniColumn(ARGENTINA_MARKET_ITEMS), [quotesMap, search, sort]);

  const visibleCommodities = expandCommodities ? commoditiesRows : commoditiesRows.slice(0, INITIAL_CARD_ROWS);
  const visibleGlobal = expandGlobal ? globalRows : globalRows.slice(0, INITIAL_CARD_ROWS);
  const visibleArgentina = expandArgentina ? argentinaRows : argentinaRows.slice(0, INITIAL_CARD_ROWS);

  const isInitialLoading = loading && Object.keys(quotesMap).length === 0;

  const openTickerInDetail = (symbol: string, name: string) => {
    const q = quotesMap[symbol];
    setSelected({
      name: q?.name || name || symbol,
      symbol,
      type: 'stock',
      price: q?.price ?? 0,
      change: q?.change ?? 0,
      bars: q?.bars ?? [],
    });
  };

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
            Mapa de calor sectorial S&amp;P 500, conjuntos líderes, materias primas, índices globales, ADRs argentinos y calendario Quartr.
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
          FILA SUPERIOR (Altura 640px):
          Izquierda (53%): Bloque 1 — Mapa de Calor Bursátil (TradingView)
          Derecha  (47%): Bloque 2 — Principales Acciones & Conjuntos (S&P 500)
      ===================================================================== */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        {/* BLOQUE 1: Mapa de Calor de Acciones (53%, 640px) */}
        <div className="w-full xl:w-[53%] min-w-0">
          <TradingViewStockHeatmap />
        </div>

        {/* BLOQUE 2: Principales Acciones & Conjuntos al estilo S&P 500 (47%, 640px) */}
        <div className="w-full xl:w-[47%] min-w-0">
          <div className="bg-card border border-line rounded-[6px] p-3.5 flex flex-col h-[640px] shadow-sm">
            {/* Cabecera del Panel */}
            <div className="flex items-center justify-between pb-2 border-b border-line gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gold/15 text-gold border border-gold/30 flex items-center justify-center">
                  <Layers size={14} />
                </div>
                <h3 className="text-[13.5px] font-semibold text-text flex items-center gap-2">
                  <span>Principales Acciones &amp; Conjuntos</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg2 border border-line text-dim">
                    {isInitialLoading ? '...' : `${sp500Rows.length} activos`}
                  </span>
                </h3>
              </div>

              {error && <span className="text-[11px] text-red font-mono">{error}</span>}
            </div>

            {/* Píldoras de Sectores (Todas | Mag 7 & IA | Finanzas | Consumo & Salud | Energía & Ind.) */}
            <div className="flex items-center gap-1.5 pt-2 pb-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
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

            {/* Sub-tabs de Rendimiento: Todas | 🔥 Top Ganadoras | 🩸 Top Perdedoras | ⚡ Más Activas | ⭐ Mis Favoritas */}
            <div className="flex items-center gap-1.5 pb-2 border-b border-line/60 overflow-x-auto no-scrollbar flex-shrink-0">
              {(
                [
                  { key: 'all', label: 'Todas' },
                  { key: 'gainers', label: '🔥 Top Ganadoras' },
                  { key: 'losers', label: '🩸 Top Perdedoras' },
                  { key: 'active', label: '⚡ Más Activas' },
                  { key: 'favorites', label: `⭐ Mis Favoritas (${favStocks.length})` },
                ] as const
              ).map((pf) => (
                <button
                  key={pf.key}
                  type="button"
                  onClick={() => handlePerfFilterChange(pf.key)}
                  className={`px-2 py-0.5 rounded-[4px] text-[10.5px] font-mono whitespace-nowrap border transition-colors cursor-pointer ${
                    perfFilter === pf.key
                      ? 'bg-teal/15 text-teal border-teal/40 font-semibold'
                      : 'bg-bg/60 text-dim border-line/70 hover:text-text'
                  }`}
                >
                  {pf.label}
                </button>
              ))}
            </div>

            {/* Tabla Scrolleable de Principales Acciones */}
            <div className="flex-1 overflow-y-auto overflow-x-auto pr-0.5 min-h-0">
              {isInitialLoading ? (
                <div className="space-y-2 py-3 px-1">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-10 rounded-[5px] bg-bg2/70 border border-line/40 animate-pulse"
                    />
                  ))}
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
                          mode="stock"
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
                    {sp500Rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-dim text-[12px]">
                          No hay acciones que coincidan con el filtro seleccionado.
                        </td>
                      </tr>
                    ) : (
                      sp500Rows.map((q) => {
                        const isFav = favStocks.includes(q.symbol);
                        const hasChange = typeof q.change === 'number' && Number.isFinite(q.change);
                        const isUp = hasChange && q.change! > 0;
                        const isDown = hasChange && q.change! < 0;

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
                                  <span className="text-[10.5px] text-dim block truncate max-w-[125px]">
                                    {q.name || '—'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2 px-2 text-right font-mono font-medium text-text tabular-nums">
                              {fmtPrice(q.price)}
                            </td>

                            <td
                              className={`py-2 px-2 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                                isUp ? 'text-teal' : isDown ? 'text-red' : 'text-dim'
                              }`}
                            >
                              {fmtPct(q.change, true)}
                            </td>

                            <td className="hidden sm:table-cell py-2 px-2 text-right font-mono text-dim text-[11px] tabular-nums">
                              {fmtCompact(q.volume)}
                            </td>

                            <td className="hidden md:table-cell py-2 px-2 text-center">
                              <div className="w-[64px] h-[20px] mx-auto">
                                <Sparkline
                                  data={q.bars ?? []}
                                  change={q.change ?? 0}
                                  width={64}
                                  height={20}
                                />
                              </div>
                            </td>

                            <td
                              className="py-2 px-1 text-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(q.symbol, q.name || q.symbol);
                              }}
                            >
                              <button
                                title={isFav ? 'Quitar de Mis Favoritas' : 'Agregar a Mis Favoritas'}
                                className={`text-[14px] transition-transform active:scale-125 ${
                                  isFav ? 'text-gold' : 'text-dim hover:text-text'
                                }`}
                              >
                                {isFav ? '★' : '☆'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}

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
                          const isFav = favStocks.includes(r.symbol);
                          const hasChg = typeof r.change === 'number' && Number.isFinite(r.change);
                          const isUp = hasChg && r.change! > 0;
                          const isDown = hasChg && r.change! < 0;

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
                              <td className="py-2 px-2 text-right font-mono font-medium tabular-nums">
                                {fmtPrice(r.price)}
                              </td>
                              <td
                                className={`py-2 px-2 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                                  isUp ? 'text-teal' : isDown ? 'text-red' : 'text-dim'
                                }`}
                              >
                                {fmtPct(r.change, true)}
                              </td>
                              <td className="hidden sm:table-cell py-2 px-2 text-right text-dim">—</td>
                              <td className="hidden md:table-cell py-2 px-2 text-center text-dim">—</td>
                              <td
                                className="py-2 px-1 text-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(r.symbol, r.name || r.symbol);
                                }}
                              >
                                <button
                                  className={`text-[14px] ${
                                    isFav ? 'text-gold' : 'text-dim hover:text-text'
                                  }`}
                                >
                                  {isFav ? '★' : '☆'}
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
          Izquierda (53%): Bloque 3 — Panel Triple (Oro & Materias Primas | Mercado Global | Argentina ADRs)
          Derecha  (47%): Bloque 4 — Noticias, Balances (Quartr) & Voces
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
                <span className="text-[10.5px] font-mono text-dim hidden sm:inline">Rango:</span>
                <TimeframeControl
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  sortActive={sort.key === 'change'}
                  sortDir={sort.dir}
                  onSortClick={() => toggleSort('change')}
                  align="right"
                  mode="stock"
                />
              </div>
            </div>

            {/* Grilla de 3 Columnas Verticales Lado a Lado (Sin scroll anidado: top 7 + Ver todos) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-start">
              {/* COLUMNA 1: Oro & Materias Primas */}
              <div className="bg-bg2/60 border border-line rounded-[6px] flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-bg2 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gem size={13} className="text-gold" />
                    <h4 className="text-[12px] font-semibold text-text">Oro &amp; Materias Primas</h4>
                  </div>
                  <span className="text-[9.5px] font-mono text-dim">{commoditiesRows.length}</span>
                </div>

                <div className="divide-y divide-line/40 px-1">
                  {isInitialLoading
                    ? Array.from({ length: INITIAL_CARD_ROWS }).map((_, idx) => (
                        <div key={idx} className="h-11 my-1 rounded bg-bg2 animate-pulse" />
                      ))
                    : visibleCommodities.map((item) => {
                        const hasChg = typeof item.change === 'number' && Number.isFinite(item.change);
                        const isUp = hasChg && item.change! > 0;
                        const isDown = hasChg && item.change! < 0;

                        return (
                          <div
                            key={item.symbol}
                            onClick={() =>
                              setSelected({
                                name: item.displayName,
                                symbol: item.symbol,
                                type: 'stock',
                                price: item.price ?? 0,
                                change: item.change ?? 0,
                                bars: item.bars,
                              })
                            }
                            className="flex items-center justify-between py-2 px-1.5 hover:bg-card/80 rounded transition-colors cursor-pointer group gap-1.5"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
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

                            <div className="w-[44px] h-[18px] flex-shrink-0 hidden 2xl:block">
                              <Sparkline
                                data={item.bars ?? []}
                                change={item.change ?? 0}
                                width={44}
                                height={18}
                              />
                            </div>

                            <div className="text-right flex-shrink-0 tabular-nums">
                              <div className="text-[11px] font-mono font-medium text-text">
                                {fmtPrice(item.price)}
                              </div>
                              <div
                                className={`text-[10px] font-mono font-semibold whitespace-nowrap ${
                                  isUp ? 'text-teal' : isDown ? 'text-red' : 'text-dim'
                                }`}
                              >
                                {fmtPct(item.change, true)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>

                {commoditiesRows.length > INITIAL_CARD_ROWS && (
                  <button
                    type="button"
                    onClick={() => setExpandCommodities((prev) => !prev)}
                    className="w-full py-2 px-3 bg-bg2/90 hover:bg-bg2 border-t border-line text-[11px] font-mono text-gold hover:text-text flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {expandCommodities ? (
                      <>
                        <span>Mostrar menos</span>
                        <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        <span>Ver todos ({commoditiesRows.length})</span>
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                )}
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

                <div className="divide-y divide-line/40 px-1">
                  {isInitialLoading
                    ? Array.from({ length: INITIAL_CARD_ROWS }).map((_, idx) => (
                        <div key={idx} className="h-11 my-1 rounded bg-bg2 animate-pulse" />
                      ))
                    : visibleGlobal.map((item) => {
                        const hasChg = typeof item.change === 'number' && Number.isFinite(item.change);
                        const isUp = hasChg && item.change! > 0;
                        const isDown = hasChg && item.change! < 0;

                        return (
                          <div
                            key={item.symbol}
                            onClick={() =>
                              setSelected({
                                name: item.displayName,
                                symbol: item.symbol,
                                type: 'stock',
                                price: item.price ?? 0,
                                change: item.change ?? 0,
                                bars: item.bars,
                              })
                            }
                            className="flex items-center justify-between py-2 px-1.5 hover:bg-card/80 rounded transition-colors cursor-pointer group gap-1.5"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
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

                            <div className="w-[44px] h-[18px] flex-shrink-0 hidden 2xl:block">
                              <Sparkline
                                data={item.bars ?? []}
                                change={item.change ?? 0}
                                width={44}
                                height={18}
                              />
                            </div>

                            <div className="text-right flex-shrink-0 tabular-nums">
                              <div className="text-[11px] font-mono font-medium text-text">
                                {item.symbol === '^TNX'
                                  ? item.price != null
                                    ? `${fmtPrice(item.price, '')}%`
                                    : '—'
                                  : fmtPrice(item.price)}
                              </div>
                              <div
                                className={`text-[10px] font-mono font-semibold whitespace-nowrap ${
                                  isUp ? 'text-teal' : isDown ? 'text-red' : 'text-dim'
                                }`}
                              >
                                {fmtPct(item.change, true)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>

                {globalRows.length > INITIAL_CARD_ROWS && (
                  <button
                    type="button"
                    onClick={() => setExpandGlobal((prev) => !prev)}
                    className="w-full py-2 px-3 bg-bg2/90 hover:bg-bg2 border-t border-line text-[11px] font-mono text-gold hover:text-text flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {expandGlobal ? (
                      <>
                        <span>Mostrar menos</span>
                        <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        <span>Ver todos ({globalRows.length})</span>
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* COLUMNA 3: Argentina (ADRs & Header Macro) */}
              <div className="bg-bg2/60 border border-line rounded-[6px] flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-bg2 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Landmark size={13} className="text-gold" />
                    <h4 className="text-[12px] font-semibold text-text">Argentina (ADRs)</h4>
                  </div>
                  <span className="text-[9.5px] font-mono text-dim">{argentinaRows.length}</span>
                </div>

                {/* Header Macro en Tiempo Real: Riesgo País, Dólar MEP, Dólar CCL y Brecha % */}
                <div className="grid grid-cols-2 gap-1 p-1.5 bg-card/70 border-b border-line text-[9.5px] font-mono">
                  <div className="px-1.5 py-1 rounded bg-bg2 border border-line/60 flex items-center justify-between">
                    <span className="text-dim">Riesgo País</span>
                    <b className="text-gold">
                      {argMacro.riesgoPais != null ? `${argMacro.riesgoPais} pb` : '—'}
                    </b>
                  </div>
                  <div className="px-1.5 py-1 rounded bg-bg2 border border-line/60 flex items-center justify-between">
                    <span className="text-dim">MEP</span>
                    <b className="text-text">{fmtPrice(argMacro.mep)}</b>
                  </div>
                  <div className="px-1.5 py-1 rounded bg-bg2 border border-line/60 flex items-center justify-between">
                    <span className="text-dim">CCL</span>
                    <b className="text-text">{fmtPrice(argMacro.ccl)}</b>
                  </div>
                  <div className="px-1.5 py-1 rounded bg-bg2 border border-line/60 flex items-center justify-between">
                    <span className="text-dim">Brecha</span>
                    <b className="text-teal">
                      {argMacro.brechaPct != null ? fmtPct(argMacro.brechaPct) : '—'}
                    </b>
                  </div>
                </div>

                <div className="divide-y divide-line/40 px-1">
                  {isInitialLoading
                    ? Array.from({ length: INITIAL_CARD_ROWS }).map((_, idx) => (
                        <div key={idx} className="h-11 my-1 rounded bg-bg2 animate-pulse" />
                      ))
                    : visibleArgentina.map((item) => {
                        const hasChg = typeof item.change === 'number' && Number.isFinite(item.change);
                        const isUp = hasChg && item.change! > 0;
                        const isDown = hasChg && item.change! < 0;

                        return (
                          <div
                            key={item.symbol}
                            onClick={() =>
                              setSelected({
                                name: item.displayName,
                                symbol: item.symbol,
                                type: 'stock',
                                price: item.price ?? 0,
                                change: item.change ?? 0,
                                bars: item.bars,
                              })
                            }
                            className="flex items-center justify-between py-2 px-1.5 hover:bg-card/80 rounded transition-colors cursor-pointer group gap-1.5"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <AssetIcon symbol={item.symbol} name={item.displayName} type="stock" size="sm" />
                              <div className="min-w-0">
                                <div className="text-[11.5px] font-semibold text-text group-hover:text-gold transition-colors truncate">
                                  {item.symbol}{' '}
                                  <span className="font-normal text-dim text-[10px]">
                                    · {item.displayName}
                                  </span>
                                </div>
                                <span className="text-[9.5px] font-mono text-dim block truncate">
                                  {item.sector}
                                </span>
                              </div>
                            </div>

                            <div className="w-[44px] h-[18px] flex-shrink-0 hidden 2xl:block">
                              <Sparkline
                                data={item.bars ?? []}
                                change={item.change ?? 0}
                                width={44}
                                height={18}
                              />
                            </div>

                            <div className="text-right flex-shrink-0 tabular-nums">
                              <div className="text-[11px] font-mono font-medium text-text">
                                {fmtPrice(item.price)}
                              </div>
                              <div
                                className={`text-[10px] font-mono font-semibold whitespace-nowrap ${
                                  isUp ? 'text-teal' : isDown ? 'text-red' : 'text-dim'
                                }`}
                              >
                                {fmtPct(item.change, true)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>

                {argentinaRows.length > INITIAL_CARD_ROWS && (
                  <button
                    type="button"
                    onClick={() => setExpandArgentina((prev) => !prev)}
                    className="w-full py-2 px-3 bg-bg2/90 hover:bg-bg2 border-t border-line text-[11px] font-mono text-gold hover:text-text flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {expandArgentina ? (
                      <>
                        <span>Mostrar menos</span>
                        <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        <span>Ver todos ({argentinaRows.length})</span>
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 4: Noticias / Balances (Quartr) / Habló X Persona (47%) */}
        <div className="w-full xl:w-[47%] min-w-0">
          <BolsaNewsCard onSelectTicker={openTickerInDetail} />
        </div>
      </div>

      {/* Modal Central de Detalle al hacer clic en cualquier activo de cualquiera de los bloques */}
      <DetailPanel asset={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
};
