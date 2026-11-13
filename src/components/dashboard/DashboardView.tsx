'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AssetList } from '@/components/dashboard/AssetList';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { MarketHeatmap, HeatmapItem } from '@/components/common/MarketHeatmap';
import { ModularGrid, ModularLayoutItem } from '@/components/common/ModularGrid';
import { estimateCryptoMarketCap } from '@/data/cryptoData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import { useQuotes } from '@/hooks/useQuotes';
import { fmtPct, fmtPrice } from '@/lib/format';
import { Asset } from '@/types';
import { CATALOG, CATALOG_GROUPS, DEFAULT_PINNED, PinnedAsset } from '@/lib/catalog';
import { ChangeTimeframe, getTimeframeOption } from '@/lib/timeframe';
import type { ArIndicatorsResponse } from '@/app/api/ar-indicators/route';
import { Download, GripHorizontal, Upload } from 'lucide-react';

interface CryptoKlineSeries {
  firstOpen: number;
  lastClose: number;
  bars: number[];
}

interface Headline {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

interface Fng {
  value: number;
  classification: string;
}

const FNG_LABEL: Record<string, string> = {
  'Extreme Fear': 'Miedo extremo',
  Fear: 'Miedo',
  Neutral: 'Neutral',
  Greed: 'Codicia',
  'Extreme Greed': 'Codicia extrema',
};

const DASHBOARD_DEFAULT_LAYOUT: ModularLayoutItem[] = [
  { i: 'pinned-assets', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
  { i: 'heatmap', x: 4, y: 0, w: 4, h: 10, minW: 4, minH: 7 },
  { i: 'arg-indicators', x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
  { i: 'fear-greed', x: 0, y: 10, w: 4, h: 8, minW: 3, minH: 5 },
  { i: 'news', x: 4, y: 10, w: 4, h: 8, minW: 3, minH: 6 },
  { i: 'add-catalog', x: 8, y: 10, w: 4, h: 8, minW: 3, minH: 6 },
];

export const DashboardView = () => {
  const [pinned, setPinned] = useLocalStorage<PinnedAsset[]>('findash:pinned:v1', DEFAULT_PINNED);

  const [view, setView] = useState<'list' | 'card' | 'map'>('list');
  const [timeframe, setTimeframe] = useState<ChangeTimeframe>('24h');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [klines, setKlines] = useState<Record<string, CryptoKlineSeries>>({});
  const [arIndicators, setArIndicators] = useState<ArIndicatorsResponse | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [fng, setFng] = useState<Fng | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<string>('crypto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cryptoPinned = useMemo(
    () => pinned.filter((p) => p.type === 'crypto').map((p) => `${p.symbol.toLowerCase()}usdt`),
    [pinned]
  );
  const stockPinned = useMemo(() => pinned.filter((p) => p.type === 'stock').map((p) => p.symbol), [pinned]);

  const liveCrypto = useBinanceWebSocket(cryptoPinned);

  // Cotizaciones de acciones fijadas con useQuotes (inicializa en null, cero efecto $0,00)
  const { quotesMap: quotes, loading: loadingStocks } = useQuotes(stockPinned, {
    timeframe,
    withSpark: true,
    keepPreviousData: true,
  });

  const cryptoPairsKey = useMemo(
    () => cryptoPinned.map((c) => c.toUpperCase()).join(','),
    [cryptoPinned]
  );

  useEffect(() => {
    if (!cryptoPairsKey) return;
    let cancelled = false;
    const opt = getTimeframeOption(timeframe);

    fetch(`/api/klines?symbols=${cryptoPairsKey}&interval=${opt.binanceInterval}&limit=${opt.binanceLimit}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data) return;
        const map: Record<string, CryptoKlineSeries> = {};
        for (const key of Object.keys(data)) {
          const candles = data[key];
          if (Array.isArray(candles) && candles.length > 0) {
            const firstOpen = Number(candles[0].open) || Number(candles[0].close) || 0;
            const bars = candles.map((c: { close: number }) => Number(c.close));
            const lastClose = bars[bars.length - 1] ?? 0;
            map[key] = { firstOpen, lastClose, bars };
          }
        }
        setKlines(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [cryptoPairsKey, timeframe]);

  // Indicadores Argentinos reales desde /api/ar-indicators
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ar-indicators')
      .then((res) => res.json())
      .then((data: ArIndicatorsResponse) => {
        if (!cancelled && data) setArIndicators(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/fng')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || typeof data?.value !== 'number') return;
        setFng({ value: data.value, classification: data.classification ?? '' });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/news?category=todas')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) setHeadlines(data.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingNews(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Jamás inicializamos price: 0 ni change: 0; usamos null mientras cargan
  const assets: Asset[] = useMemo(() => {
    return pinned.map((p) => {
      if (p.type === 'crypto') {
        const pair = `${p.symbol.toUpperCase()}USDT`;
        const t = liveCrypto[pair];
        const kline = klines[pair];
        const livePrice = t ? parseFloat(t.c) : null;
        const rawPrice = livePrice && livePrice > 0 ? livePrice : kline?.lastClose && kline.lastClose > 0 ? kline.lastClose : null;
        const open24h = t ? parseFloat(t.o) : null;
        const liveChange24h =
          rawPrice != null && open24h != null && open24h > 0
            ? ((rawPrice - open24h) / open24h) * 100
            : null;

        let change = liveChange24h;
        if (kline && kline.firstOpen > 0 && rawPrice != null && rawPrice > 0) {
          change = ((rawPrice - kline.firstOpen) / kline.firstOpen) * 100;
        }

        const bars = kline
          ? livePrice && livePrice > 0
            ? [...kline.bars.slice(0, -1), livePrice]
            : kline.bars
          : [];

        return {
          name: p.label || p.symbol,
          symbol: p.symbol,
          type: 'crypto' as const,
          price: rawPrice,
          change,
          bars,
        };
      }
      const q = quotes[p.symbol];
      return {
        name: p.label || p.symbol,
        symbol: p.symbol,
        type: 'stock' as const,
        price: q?.price ?? null,
        change: q?.change ?? null,
        bars: q?.bars ?? [],
      };
    });
  }, [pinned, liveCrypto, klines, quotes]);

  const unpin = (symbol: string) => setPinned(pinned.filter((p) => p.symbol !== symbol));

  // Exportar / Importar configuración JSON de activos fijados
  const handleExportJson = () => {
    try {
      const payload = JSON.stringify({ version: 'v1', pinned }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'findash-config.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed?.pinned;
        if (Array.isArray(list) && list.every((it) => it && typeof it.symbol === 'string')) {
          setPinned(list);
        }
      } catch {
        // ignore invalid json
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Ítems para el mapa de calor
  const heatmapItems: Array<HeatmapItem & { asset: Asset }> = useMemo(
    () =>
      assets
        .filter((a) => a.price != null && a.price > 0)
        .map((a) => ({
          id: `${a.type}-${a.symbol ?? a.name}`,
          symbol: a.symbol ?? a.name,
          name: a.name,
          type: a.type ?? 'stock',
          price: a.price ?? 0,
          change: a.change ?? 0,
          marketCap:
            a.type === 'crypto'
              ? estimateCryptoMarketCap(a.symbol ?? a.name, a.price ?? 0)
              : quotes[a.symbol ?? '']?.marketCap ?? null,
          asset: a,
        })),
    [assets, quotes]
  );

  const pin = (item: (typeof CATALOG)[number]) =>
    setPinned([...pinned, { symbol: item.symbol, label: item.label, type: item.type }]);

  const catalogFiltered = CATALOG.filter(
    (c) => c.group === group && c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const d = arIndicators?.dolares;

  return (
    <>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2">
        <div>
          <h2 className="text-[22px]">Dashboard</h2>
          <p className="text-[11.5px] text-dim">
            Arrastrá desde la cabecera de cada módulo y redimensioná desde su esquina inferior derecha.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
            <button
              onClick={() => setView('map')}
              className={`px-[14px] py-[7px] text-[12.5px] ${view === 'map' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
            >
              Mapa
            </button>
          </div>
        </div>
      </div>

      <ModularGrid layoutId="dashboard" defaultLayout={DASHBOARD_DEFAULT_LAYOUT} rowHeight={32}>
        {/* 1. Activos Fijados */}
        <div key="pinned-assets" className="w-full h-full">
          <div className="bg-card border border-line rounded-[6px] p-4 w-full h-full flex flex-col">
            <div className="draggable-handle flex items-center justify-between mb-2.5 gap-2 flex-wrap pb-2 border-b border-line/60">
              <div className="flex items-center gap-1.5">
                <GripHorizontal size={13} className="text-dim/60" />
                <h3 className="text-[13.5px] text-dim font-medium">ACTIVOS FIJADOS</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportJson}
                  title="Exportar lista de activos en JSON"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg2 hover:bg-bg border border-line text-[10.5px] font-mono text-dim hover:text-gold transition-colors cursor-pointer"
                >
                  <Download size={11} />
                  <span>Exportar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Importar lista de activos desde JSON"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg2 hover:bg-bg border border-line text-[10.5px] font-mono text-dim hover:text-gold transition-colors cursor-pointer"
                >
                  <Upload size={11} />
                  <span>Importar</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
              {pinned.length === 0 ? (
                <div className="text-dim text-[12.5px]">
                  Todavía no fijaste ningún activo. Usá el catálogo para agregarlos.
                </div>
              ) : (
                <AssetList
                  assets={assets}
                  view={view === 'map' ? 'list' : view}
                  onAssetClick={(a) => setSelectedAsset(a)}
                  onRemove={(a) => unpin(a.symbol ?? a.name)}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  loading={loadingStocks}
                />
              )}
            </div>
          </div>
        </div>

        {/* 2. Mapa de Calor Activos Fijados */}
        <div key="heatmap" className={`w-full h-full rounded-xl ${view === 'map' ? 'ring-1 ring-gold/50' : ''}`}>
          <MarketHeatmap
            items={heatmapItems}
            defaultSizeBy="volatility"
            title="Mapa de Calor · Activos Fijados"
            heightClassName="flex-1 min-h-[180px]"
            onItemClick={(it) => setSelectedAsset(it.asset)}
          />
        </div>

        {/* 3. Indicadores Argentina */}
        <div key="arg-indicators" className="w-full h-full">
          <div className="bg-card border border-line rounded-[6px] p-4 w-full h-full flex flex-col">
            <div className="draggable-handle flex items-center justify-between mb-2.5 pb-2 border-b border-line/60">
              <div className="flex items-center gap-1.5">
                <GripHorizontal size={13} className="text-dim/60" />
                <h3 className="text-[13.5px] text-dim font-medium">INDICADORES ARGENTINA</h3>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {!arIndicators ? (
                <div className="space-y-2 py-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-5 rounded bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-line">
                  <div className="flex justify-between text-[12.5px] py-1.5 font-mono tabular-nums">
                    <span className="font-sans">Dólar Oficial</span>
                    <b className="font-semibold">{fmtPrice(d?.oficial)}</b>
                  </div>
                  <div className="flex justify-between text-[12.5px] py-1.5 font-mono tabular-nums">
                    <span className="font-sans">Dólar Blue</span>
                    <b className="font-semibold">{fmtPrice(d?.blue)}</b>
                  </div>
                  <div className="flex justify-between text-[12.5px] py-1.5 font-mono tabular-nums">
                    <span className="font-sans">Dólar MEP</span>
                    <b className="font-semibold text-gold">{fmtPrice(d?.mep)}</b>
                  </div>
                  <div className="flex justify-between text-[12.5px] py-1.5 font-mono tabular-nums">
                    <span className="font-sans">Dólar CCL</span>
                    <b className="font-semibold">{fmtPrice(d?.ccl)}</b>
                  </div>
                  <div className="flex justify-between text-[12.5px] py-1.5 font-mono tabular-nums">
                    <span className="font-sans">Brecha Cambiaria (MEP)</span>
                    <b className="font-semibold text-teal">{fmtPct(d?.brechaMep)}</b>
                  </div>
                  <div className="flex justify-between text-[12.5px] py-1.5 font-mono tabular-nums">
                    <span className="font-sans">Riesgo País (EMBI)</span>
                    <b className="font-semibold text-gold">
                      {arIndicators.riesgoPais != null
                        ? `${arIndicators.riesgoPais.toLocaleString('es-AR')} pb`
                        : '—'}
                    </b>
                  </div>
                  {arIndicators.inflacionMensual != null && (
                    <div className="flex justify-between text-[12.5px] py-1.5 font-mono tabular-nums">
                      <span className="font-sans">Inflación Mensual (INDEC)</span>
                      <b className="font-semibold">{fmtPct(arIndicators.inflacionMensual)}</b>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Miedo y Codicia */}
        <div key="fear-greed" className="w-full h-full">
          <div className="bg-card border border-line rounded-[6px] p-4 w-full h-full flex flex-col justify-between">
            <div className="draggable-handle flex items-center justify-between mb-2 pb-2 border-b border-line/60">
              <div className="flex items-center gap-1.5">
                <GripHorizontal size={13} className="text-dim/60" />
                <h3 className="text-[13.5px] text-dim font-medium">MIEDO Y CODICIA</h3>
              </div>
              <span className="text-[10px] text-dim/70 uppercase tracking-wide">Cripto</span>
            </div>
            {fng ? (
              <div className="my-auto py-2">
                <div className="flex items-baseline gap-2">
                  <b className="text-[28px] font-display leading-none">{fng.value}</b>
                  <span className="text-[11.5px] text-dim uppercase tracking-wide">
                    {FNG_LABEL[fng.classification] ?? fng.classification}
                  </span>
                </div>
                <div className="relative h-1.5 mt-3 rounded-full bg-gradient-to-r from-red via-gold to-teal">
                  <span
                    className="absolute -top-[3px] w-3 h-3 rounded-full bg-text border-2 border-bg shadow"
                    style={{ left: `calc(${Math.min(Math.max(fng.value, 0), 100)}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between text-[9.5px] text-dim mt-1">
                  <span>Miedo</span>
                  <span>Neutral</span>
                  <span>Codicia</span>
                </div>
              </div>
            ) : (
              <div className="h-12 rounded bg-white/5 animate-pulse" />
            )}
          </div>
        </div>

        {/* 5. Resumen del Día */}
        <div key="news" className="w-full h-full">
          <div className="bg-card border border-line rounded-[6px] p-4 w-full h-full flex flex-col">
            <div className="draggable-handle flex items-center gap-1.5 mb-2.5 pb-2 border-b border-line/60">
              <GripHorizontal size={13} className="text-dim/60" />
              <h3 className="text-[13.5px] text-dim font-medium">RESUMEN DEL DÍA</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
              {loadingNews ? (
                <div className="space-y-2 py-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : headlines.length === 0 ? (
                <div className="text-dim text-[12px]">Sin titulares disponibles.</div>
              ) : (
                headlines.map((h, i) => (
                  <a
                    key={`${h.link}-${i}`}
                    href={h.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block py-[9px] text-[12.5px] hover:text-gold ${
                      i < headlines.length - 1 ? 'border-b border-line' : ''
                    }`}
                  >
                    {h.title}
                    <span className="text-gold text-[11px] block mt-[2px]">
                      {h.source}
                      {h.pubDate ? ` · ${new Date(h.pubDate).toLocaleDateString('es-AR')}` : ''}
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 6. Agregar al Dashboard */}
        <div key="add-catalog" className="w-full h-full">
          <div className="bg-card border border-line rounded-[6px] p-4 w-full h-full flex flex-col">
            <div className="draggable-handle flex justify-between items-center mb-2.5 flex-wrap gap-2 pb-2 border-b border-line/60">
              <div className="flex items-center gap-1.5">
                <GripHorizontal size={13} className="text-dim/60" />
                <h3 className="text-[13.5px] text-dim font-medium">AGREGAR AL DASHBOARD</h3>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ticker..."
                className="bg-bg2 border border-line text-text px-2.5 py-1 rounded-[4px] text-[16px] sm:text-[12px] w-[150px]"
              />
            </div>
            <div className="mb-3 flex-shrink-0">
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
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap gap-1.5 content-start pr-0.5">
              {catalogFiltered.map((item) => {
                const isPinned = pinned.some((p) => p.symbol === item.symbol);
                return (
                  <button
                    key={item.symbol}
                    onClick={() => (isPinned ? unpin(item.symbol) : pin(item))}
                    title={item.label}
                    className={`text-[11.5px] px-2 py-1 rounded-[4px] border h-fit ${
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
      </ModularGrid>

      <DetailPanel asset={selectedAsset} isOpen={!!selectedAsset} onClose={() => setSelectedAsset(null)} />
    </>
  );
};
