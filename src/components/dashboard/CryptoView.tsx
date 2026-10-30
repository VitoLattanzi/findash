'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Flame,
  Layers,
  X,
} from 'lucide-react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import { Sparkline } from '@/components/common/Sparkline';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { WhaleTracker } from '@/components/dashboard/WhaleTracker';
import { CryptoNewsCard } from '@/components/dashboard/CryptoNewsCard';
import { TradingViewCryptoHeatmap } from '@/components/common/TradingViewCryptoHeatmap';
import { TimeframeControl } from '@/components/common/TimeframeHeader';
import { formatPercent, formatPrice, formatVolume } from '@/lib/format';
import {
  DEFAULT_ALTCOINS,
  DEFAULT_MEMECOINS,
  CRYPTO_PROFILES,
  getCryptoProfile,
} from '@/data/cryptoData';
import { ChangeTimeframe, getTimeframeOption } from '@/lib/timeframe';
import { Asset } from '@/types';

const STORAGE_ALT_KEY = 'findash_crypto_custom_altcoins_v2';
const STORAGE_MEME_KEY = 'findash_crypto_custom_memecoins_v2';

type CryptoSortKey = 'sym' | 'price' | 'change' | 'vol';

interface KlineWindow {
  firstOpen: number;
  bars: number[];
  lastClose: number;
}

export const CryptoView = () => {
  const [altcoins, setAltcoins] = useState<string[]>(DEFAULT_ALTCOINS);
  const [memecoins, setMemecoins] = useState<string[]>(DEFAULT_MEMECOINS);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<ChangeTimeframe>('24h');
  const [sort, setSort] = useState<{ key: CryptoSortKey; dir: 1 | -1 }>({
    key: 'vol',
    dir: -1,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<'altcoin' | 'memecoin'>('altcoin');
  const [customTickerInput, setCustomTickerInput] = useState('');

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    try {
      const savedAlt = localStorage.getItem(STORAGE_ALT_KEY);
      const savedMeme = localStorage.getItem(STORAGE_MEME_KEY);
      if (savedAlt) {
        const parsed = JSON.parse(savedAlt);
        if (Array.isArray(parsed) && parsed.length > 0) setAltcoins(parsed);
      }
      if (savedMeme) {
        const parsed = JSON.parse(savedMeme);
        if (Array.isArray(parsed) && parsed.length > 0) setMemecoins(parsed);
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoadedFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoadedFromStorage) return;
    try {
      localStorage.setItem(STORAGE_ALT_KEY, JSON.stringify(altcoins));
      localStorage.setItem(STORAGE_MEME_KEY, JSON.stringify(memecoins));
    } catch {
      // ignore storage quota errors
    }
  }, [altcoins, memecoins, isLoadedFromStorage]);

  const allSymbols = useMemo(() => {
    const set = new Set([...altcoins, ...memecoins]);
    return Array.from(set).map((sym) => `${sym.toLowerCase()}usdt`);
  }, [altcoins, memecoins]);

  const prices = useBinanceWebSocket(allSymbols);
  const [klineWindows, setKlineWindows] = useState<Record<string, KlineWindow>>({});

  // Fetch de velas según el rango seleccionado (12h, 24h, 1sem, 1mes, 3meses)
  useEffect(() => {
    let cancelled = false;
    if (allSymbols.length === 0) return;

    const pairs = allSymbols.map((s) => s.toUpperCase()).join(',');
    const opt = getTimeframeOption(timeframe);

    fetch(
      `/api/klines?symbols=${pairs}&interval=${opt.binanceInterval}&limit=${opt.binanceLimit}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data) return;
        const map: Record<string, KlineWindow> = {};
        for (const key of Object.keys(data)) {
          const candles = data[key];
          if (Array.isArray(candles) && candles.length > 0) {
            const firstOpen = Number(candles[0].open) || Number(candles[0].close) || 0;
            const bars = candles.map((c: { close: number }) => c.close);
            const lastClose = bars[bars.length - 1] ?? 0;
            map[key] = { firstOpen, bars, lastClose };
          }
        }
        setKlineWindows(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [allSymbols, timeframe]);

  const toggleSort = (key: CryptoSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 1 ? -1 : 1 }
        : { key, dir: key === 'sym' ? 1 : -1 }
    );
  };

  const handleRemoveCoin = (sym: string, category: 'altcoin' | 'memecoin') => {
    if (category === 'altcoin') {
      setAltcoins((prev) => prev.filter((s) => s !== sym));
    } else {
      setMemecoins((prev) => prev.filter((s) => s !== sym));
    }
  };

  const handleAddCoin = (sym: string, category: 'altcoin' | 'memecoin') => {
    const clean = sym.trim().toUpperCase().replace('USDT', '');
    if (!clean) return;

    if (category === 'altcoin') {
      if (!altcoins.includes(clean)) setAltcoins((prev) => [...prev, clean]);
    } else {
      if (!memecoins.includes(clean)) setMemecoins((prev) => [...prev, clean]);
    }
    setShowAddModal(false);
    setCustomTickerInput('');
  };

  const handleResetDefaults = () => {
    setAltcoins(DEFAULT_ALTCOINS);
    setMemecoins(DEFAULT_MEMECOINS);
    localStorage.removeItem(STORAGE_ALT_KEY);
    localStorage.removeItem(STORAGE_MEME_KEY);
  };

  const handleSelectCoin = (
    sym: string,
    name: string,
    price: number,
    change: number,
    open: number,
    high?: number,
    low?: number,
    vol?: number,
    bars?: number[]
  ) => {
    const profile = getCryptoProfile(sym);
    setSelectedAsset({
      name: profile?.name || name,
      symbol: sym,
      type: 'crypto',
      price,
      change,
      open,
      high,
      low,
      vol: vol ? formatVolume(vol) : '—',
      cap: profile?.circulatingSupply ? `${profile.circulatingSupply} circ.` : '—',
      ath: profile?.ath || 0,
      bars: bars || [],
    });
  };

  const getRowsFor = (symbols: string[]) => {
    const query = searchQuery.toLowerCase().trim();

    const rows = symbols
      .map((sym) => {
        const pair = `${sym.toUpperCase()}USDT`;
        const profile = getCryptoProfile(sym);
        const name = profile?.name || sym;
        const network = profile?.network || 'Cripto';

        if (query) {
          const matchesSym = sym.toLowerCase().includes(query);
          const matchesName = name.toLowerCase().includes(query);
          const matchesNet = network.toLowerCase().includes(query);
          if (!matchesSym && !matchesName && !matchesNet) return null;
        }

        const ticker = prices[pair];
        const kw = klineWindows[pair];
        const livePrice = ticker ? parseFloat(ticker.c) : 0;
        const price = livePrice || kw?.lastClose || 0;
        const wsOpen = ticker ? parseFloat(ticker.o) : 0;
        const high = ticker && ticker.h ? parseFloat(ticker.h) : undefined;
        const low = ticker && ticker.l ? parseFloat(ticker.l) : undefined;
        const vol = ticker ? parseFloat(ticker.q || '0') : 0;

        // Cálculo exacto de variación según el rango activo (12h, 24h, 1sem, 1mes, 3meses)
        const refOpen = kw && kw.firstOpen > 0 ? kw.firstOpen : wsOpen;
        const change = refOpen > 0 && price > 0 ? ((price - refOpen) / refOpen) * 100 : 0;
        const bars = kw?.bars
          ? livePrice > 0
            ? [...kw.bars.slice(0, -1), livePrice]
            : kw.bars
          : [];

        return {
          sym,
          name,
          network,
          price,
          change,
          open: refOpen,
          high,
          low,
          vol,
          bars,
          profile,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return rows.sort((a, b) => {
      if (sort.key === 'sym') {
        return a.sym.localeCompare(b.sym, 'es') * sort.dir;
      }
      const va = a[sort.key];
      const vb = b[sort.key];
      return (va - vb) * sort.dir;
    });
  };

  const altRows = getRowsFor(altcoins);
  const memeRows = getRowsFor(memecoins);

  const renderPanel = (
    title: string,
    badgeText: string,
    category: 'altcoin' | 'memecoin',
    icon: React.ReactNode,
    rows: ReturnType<typeof getRowsFor>
  ) => {
    const sortArrow = (key: CryptoSortKey) =>
      sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕';

    return (
      <div className="bg-card border border-line rounded-[6px] p-3.5 flex flex-col shadow-sm">
        {/* Cabecera del Panel */}
        <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-line">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center ${
                category === 'altcoin'
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'bg-teal/15 text-teal border border-teal/30'
              }`}
            >
              {icon}
            </div>
            <h3 className="text-[13.5px] font-semibold text-text flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg2 border border-line text-dim">
                {rows.length} {badgeText}
              </span>
            </h3>
          </div>

          <button
            onClick={() => {
              setAddCategory(category);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-bg2 hover:bg-line border border-line text-[11px] font-medium text-dim hover:text-text transition-colors"
            title={`Agregar moneda a ${title}`}
          >
            <Plus size={12} className="text-gold" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Contenedor Scrolleable Compacto */}
        <div className="max-h-[265px] overflow-y-auto overflow-x-auto pr-0.5">
          {rows.length === 0 ? (
            <div className="py-10 text-center text-dim text-[12px]">
              {searchQuery
                ? `Sin resultados para "${searchQuery}"`
                : 'No hay monedas agregadas en esta lista.'}
            </div>
          ) : (
            <table className="w-full text-left text-[12px] border-collapse min-w-[330px]">
              <thead className="sticky top-0 bg-card z-20">
                <tr className="border-b border-line text-dim font-medium text-[10.5px] uppercase tracking-wider">
                  <th
                    onClick={() => toggleSort('sym')}
                    className={`py-2 px-2 cursor-pointer select-none hover:text-text ${
                      sort.key === 'sym' ? 'text-gold' : ''
                    }`}
                  >
                    Activo <span className="text-[9px] ml-0.5">{sortArrow('sym')}</span>
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
                    onClick={() => toggleSort('vol')}
                    className={`hidden sm:table-cell py-2 px-2 text-right cursor-pointer select-none hover:text-text ${
                      sort.key === 'vol' ? 'text-gold' : ''
                    }`}
                  >
                    Volumen <span className="text-[9px] ml-0.5">{sortArrow('vol')}</span>
                  </th>
                  <th className="hidden md:table-cell py-2 px-2 text-center">Gráfico</th>
                  <th className="py-2 px-1 text-center w-7"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {rows.map((r) => (
                  <tr
                    key={r.sym}
                    onClick={() =>
                      handleSelectCoin(
                        r.sym,
                        r.name,
                        r.price,
                        r.change,
                        r.open,
                        r.high,
                        r.low,
                        r.vol,
                        r.bars
                      )
                    }
                    className="cursor-pointer hover:bg-bg2/70 transition-colors group"
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <CryptoIcon symbol={r.sym} size={22} />
                        <div>
                          <div className="font-semibold text-text group-hover:text-gold transition-colors leading-tight">
                            <span>{r.sym}</span>
                          </div>
                          <span className="text-[10px] text-dim block truncate max-w-[110px]">
                            {r.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-2 text-right font-mono font-medium text-text">
                      ${formatPrice(r.price)}
                    </td>

                    <td
                      className={`py-2 px-2 text-right font-mono font-semibold ${
                        r.change >= 0 ? 'text-teal' : 'text-red'
                      }`}
                    >
                      {formatPercent(r.change)}
                    </td>

                    <td className="hidden sm:table-cell py-2 px-2 text-right font-mono text-dim text-[11px]">
                      {r.vol > 0 ? formatVolume(r.vol) : '—'}
                    </td>

                    <td className="hidden md:table-cell py-2 px-2 text-center">
                      <div className="w-[66px] h-[20px] mx-auto">
                        <Sparkline data={r.bars} change={r.change} width={66} height={20} />
                      </div>
                    </td>

                    <td
                      className="py-2 px-1 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCoin(r.sym, category);
                      }}
                    >
                      <button
                        className="opacity-0 group-hover:opacity-100 text-dim hover:text-red transition-all p-1 rounded"
                        title="Quitar de mi lista"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-5">
      {/* Barra Superior con Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-line rounded-[6px] p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-display font-semibold text-text">Criptomercado</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal/15 text-teal border border-teal/30">
              Binance 24/7 Live
            </span>
          </div>
          <p className="text-[12px] text-dim mt-0.5">
            Mapa de calor oficial de TradingView, listas interactivas por rango temporal, fundamentales y radar de ballenas.
          </p>
        </div>

        {/* Buscador y Restablecer */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar cripto o red..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-bg2 border border-line text-[12.5px] text-text placeholder-dim/60 focus:outline-none focus:border-gold transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-text"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={handleResetDefaults}
            className="p-2 rounded-lg bg-bg2 hover:bg-line border border-line text-dim hover:text-gold transition-colors flex-shrink-0"
            title="Restablecer listas predeterminadas"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Grilla Superior: Izquierda (TradingView Crypto Heatmap 53%) | Derecha (2 Paneles Apilados 47%) */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        <div className="w-full xl:w-[53%] min-w-0">
          <TradingViewCryptoHeatmap />
        </div>

        <div className="w-full xl:w-[47%] min-w-0 flex flex-col justify-between gap-4">
          {renderPanel('Altcoins & Capa 1', 'activas', 'altcoin', <Layers size={14} />, altRows)}
          {renderPanel('Meme Coins Líderes', 'activas', 'memecoin', <Flame size={14} />, memeRows)}
        </div>
      </div>

      {/* Grid Inferior: 2 Cards (Portal de Noticias Cripto & Radar de Ballenas) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        <CryptoNewsCard />
        <WhaleTracker />
      </div>

      {/* Modal para Agregar Moneda */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-line rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="text-[15px] font-semibold text-text flex items-center gap-2">
                <Plus size={16} className="text-gold" />
                <span>
                  Agregar a {addCategory === 'altcoin' ? 'Altcoins' : 'Meme Coins'}
                </span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-dim hover:text-text p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11.5px] text-dim block">
                Ingresa el Ticker de Binance (ej: NEAR, SUI, FLOKI, BRETT):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTickerInput}
                  onChange={(e) => setCustomTickerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCoin(customTickerInput, addCategory);
                  }}
                  placeholder="Ej: SUI"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-bg2 border border-line text-[13px] text-text font-mono uppercase focus:outline-none focus:border-gold"
                  autoFocus
                />
                <button
                  onClick={() => handleAddCoin(customTickerInput, addCategory)}
                  className="px-3.5 py-1.5 rounded-lg bg-gold text-bg font-semibold text-[12.5px] hover:bg-gold/90 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-line">
              <span className="text-[11px] text-dim block">O selecciona una sugerida:</span>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {Object.values(CRYPTO_PROFILES)
                  .filter((p) => p.category === addCategory)
                  .filter(
                    (p) =>
                      !(addCategory === 'altcoin' ? altcoins : memecoins).includes(p.symbol)
                  )
                  .map((p) => (
                    <button
                      key={p.symbol}
                      onClick={() => handleAddCoin(p.symbol, addCategory)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg2 hover:bg-line border border-line text-[11.5px] text-text hover:text-gold transition-colors"
                    >
                      <CryptoIcon symbol={p.symbol} size={20} />
                      <span className="font-semibold">{p.symbol}</span>
                      <span className="text-[10px] text-dim">{p.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Central de Detalle al Clickear Cualquier Moneda */}
      <DetailPanel
        asset={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </section>
  );
};
