'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ExternalLink,
  LineChart,
  BarChart2,
  Building2,
  Calendar,
  Target,
  DollarSign,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Info,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { Asset } from '@/types';
import { useSeriesData } from '@/hooks/useSeriesData';
import { PriceChart } from '@/components/common/PriceChart';
import { AssetIcon } from '@/components/common/AssetIcon';
import { formatCompactNumber, formatPrice } from '@/lib/format';
import { getTradingViewUrl } from '@/lib/tradingview';
import { FundamentalData } from '@/app/api/fundamentals/route';
import { getCryptoProfile } from '@/data/cryptoData';

interface DetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'grafico' | 'fundamentales' | 'perfil';

const TIMEFRAMES = ['1h', '12h', '24h', '1s', '2s', '1m', '3m', '6m', '1a', '3a', '5a', 'ALL'];
const INTRADAY: Record<string, number> = { '1h': 1, '12h': 12, '24h': 24 };
const TF_DAYS: Record<string, number> = {
  '1s': 7,
  '2s': 14,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1a': 365,
  '3a': 1095,
  '5a': 1825,
  ALL: 99999,
};

export const DetailPanel = ({ asset, isOpen, onClose }: DetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('grafico');
  const [chartType, setChartType] = useState<'area' | 'velas'>('area');
  const [timeframe, setTimeframe] = useState('1a');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fundamentales & Perfil
  const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);
  const [fundamentalsError, setFundamentalsError] = useState<string | null>(null);

  // Gesto táctil en celulares (Swipe to close hacia la derecha / volver atrás)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const isDragging = useRef<boolean>(false);

  const symbol = asset?.symbol ?? asset?.name;
  const isIntraday = timeframe in INTRADAY;

  const cryptoProfile = useMemo(() => {
    if (!asset || asset.type !== 'crypto') return null;
    return getCryptoProfile(asset.symbol || asset.name);
  }, [asset]);

  const [extendedQuote, setExtendedQuote] = useState<{
    marketState?: string | null;
    preMarketPrice?: number | null;
    preMarketChange?: number | null;
    postMarketPrice?: number | null;
    postMarketChange?: number | null;
  } | null>(null);

  // Fetch de cotizaciones extendidas (Pre / Post Market)
  useEffect(() => {
    if (!isOpen || !symbol || asset?.type === 'crypto') {
      setExtendedQuote(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/market?tickers=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data[0]) {
          const item = data[0];
          setExtendedQuote({
            marketState: item.marketState,
            preMarketPrice: item.preMarketPrice,
            preMarketChange: item.preMarketChange,
            postMarketPrice: item.postMarketPrice,
            postMarketChange: item.postMarketChange,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, symbol, asset?.type]);

  // Fetch de Análisis Fundamental y Perfil de Yahoo Finance
  useEffect(() => {
    if (!isOpen || !symbol) {
      setFundamentals(null);
      setFundamentalsError(null);
      return;
    }

    if (asset?.type === 'crypto') {
      setFundamentals(null);
      setLoadingFundamentals(false);
      return;
    }

    let cancelled = false;
    setLoadingFundamentals(true);
    setFundamentalsError(null);

    fetch(`/api/fundamentals?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron obtener métricas contables');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setFundamentals(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFundamentalsError(err.message || 'Error de datos');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFundamentals(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, symbol, asset?.type]);

  // Handlers para el gesto de deslizamiento en celulares (swipe right to back)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current || !isDragging.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    // Si arrastra hacia la derecha desde el borde o área con menor componente vertical
    if (diffX > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(Math.max(0, diffX));
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 85) {
      onClose();
    }
    setDragOffset(0);
    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const series = useSeriesData(isOpen ? symbol : undefined, asset?.type);
  const intraday = useSeriesData(
    isOpen && isIntraday ? symbol : undefined,
    asset?.type,
    '5m',
    INTRADAY[timeframe] ?? 24
  );

  const active = isIntraday ? intraday : series;

  const view = useMemo(() => {
    if (isIntraday) {
      const bars = Math.max((INTRADAY[timeframe] ?? 24) * 12, 2);
      return { points: intraday.points.slice(-bars), candles: intraday.candles.slice(-bars) };
    }
    const days = TF_DAYS[timeframe] ?? 365;
    return { points: series.points.slice(-days), candles: series.candles.slice(-days) };
  }, [isIntraday, timeframe, intraday.points, intraday.candles, series.points, series.candles]);

  if (!isOpen || !asset) return null;

  const { loading, error } = active;
  const last = view.candles[view.candles.length - 1];

  const marketState = extendedQuote?.marketState ?? asset.marketState;
  const prePrice = extendedQuote?.preMarketPrice ?? asset.preMarketPrice;
  const preChange = extendedQuote?.preMarketChange ?? asset.preMarketChange;
  const postPrice = extendedQuote?.postMarketPrice ?? asset.postMarketPrice;
  const postChange = extendedQuote?.postMarketChange ?? asset.postMarketChange;

  const m = fundamentals?.metrics;
  const prof = fundamentals?.profile;

  // Cálculo de Upside respecto a precio objetivo de analistas
  const targetUpside =
    m?.targetPrice && asset.price > 0
      ? ((m.targetPrice - asset.price) / asset.price) * 100
      : null;

  // Comparativa Deuda vs Liquidez
  const totalCash = m?.totalCash ?? 0;
  const totalDebt = m?.totalDebt ?? 0;
  const totalCashDebtSum = totalCash + totalDebt;
  const cashPercent = totalCashDebtSum > 0 ? (totalCash / totalCashDebtSum) * 100 : 50;

  return (
    <>
      {/* Backdrop oscuro translúcido con desenfoque */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor: Modal Card Central (Desktop) / Pantalla Nueva Completa (Mobile) */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-0 sm:p-4 md:p-6 pointer-events-none">
        <div
          style={{
            transform: dragOffset > 0 ? `translateX(${dragOffset}px)` : undefined,
            transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pointer-events-auto bg-card border-0 sm:border sm:border-line rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* BARRA SUPERIOR DE CABECERA (Header) */}
          <div className="p-4 sm:p-5 border-b border-line bg-bg2/60 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              {/* Botón Volver para Mobile */}
              <button
                onClick={onClose}
                className="sm:hidden flex items-center gap-1.5 text-dim hover:text-text text-[12px] font-medium py-1 px-2 rounded-md bg-card border border-line"
                aria-label="Volver atrás"
              >
                <ArrowLeft size={14} />
                <span>Volver</span>
              </button>

              {/* Título e ícono del Activo */}
              <div className="flex items-center gap-3 min-w-0">
                <AssetIcon symbol={symbol} name={asset.name} type={asset.type} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[19px] sm:text-[22px] font-display font-semibold truncate text-text">
                      {asset.name}
                    </h2>
                    {symbol && (
                      <span className="text-[12px] font-mono text-dim px-2 py-0.5 rounded bg-bg border border-line/70 hidden sm:inline-block">
                        {symbol}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2.5 flex-wrap mt-0.5">
                    <span className="text-[20px] sm:text-[22px] font-display font-semibold text-text">
                      ${formatPrice(asset.price)}
                    </span>
                    <span
                      className={`text-[12.5px] font-medium ${
                        asset.change >= 0 ? 'text-teal' : 'text-red'
                      }`}
                    >
                      {asset.change >= 0 ? '+' : ''}
                      {asset.change.toFixed(2)}% hoy
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción superiores (TradingView y Cerrar) */}
              <div className="flex items-center gap-2">
                <a
                  href={getTradingViewUrl(symbol, asset.type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] rounded-lg border border-line bg-card text-dim hover:text-gold hover:border-gold transition-colors font-medium shadow-sm"
                  title="Abrir este gráfico completo en TradingView"
                >
                  <span>TradingView</span>
                  <ExternalLink size={12} />
                </a>

                <button
                  onClick={onClose}
                  className="text-dim hover:text-text p-1.5 rounded-lg hover:bg-bg border border-transparent hover:border-line transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Badges de Pre/Post Market y Estado de Negociación */}
            {asset.type !== 'crypto' && (
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-dim flex-wrap">
                {marketState && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-card border border-line text-[10px] uppercase tracking-wider font-mono">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        marketState === 'REGULAR'
                          ? 'bg-teal animate-pulse'
                          : marketState === 'PRE' || marketState === 'POST'
                          ? 'bg-gold'
                          : 'bg-red'
                      }`}
                    />
                    {marketState === 'REGULAR'
                      ? 'Mercado Abierto'
                      : marketState === 'PRE'
                      ? 'Pre-Market'
                      : marketState === 'POST'
                      ? 'After-Hours'
                      : 'Cerrado'}
                  </span>
                )}

                {marketState !== 'REGULAR' && typeof prePrice === 'number' && (
                  <span className="text-dim">
                    Pre-Mkt: <b className="text-dim font-medium">${formatPrice(prePrice)}</b>
                    {typeof preChange === 'number' && (
                      <span
                        className={
                          preChange >= 0 ? ' text-teal/80 ml-1' : ' text-red/80 ml-1'
                        }
                      >
                        ({preChange >= 0 ? '+' : ''}
                        {preChange.toFixed(2)}%)
                      </span>
                    )}
                  </span>
                )}

                {marketState !== 'REGULAR' && typeof postPrice === 'number' && (
                  <span className="text-dim">
                    Post-Mkt: <b className="text-dim font-medium">${formatPrice(postPrice)}</b>
                    {typeof postChange === 'number' && (
                      <span
                        className={
                          postChange >= 0 ? ' text-teal/80 ml-1' : ' text-red/80 ml-1'
                        }
                      >
                        ({postChange >= 0 ? '+' : ''}
                        {postChange.toFixed(2)}%)
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}

            {/* NAVEGACIÓN ENTRE PESTAÑAS (TABS) */}
            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-line/40">
              <button
                onClick={() => setActiveTab('grafico')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 text-[12.5px] font-medium rounded-lg transition-all ${
                  activeTab === 'grafico'
                    ? 'bg-gold text-bg font-semibold shadow-sm'
                    : 'text-dim hover:text-text bg-card/60 hover:bg-card border border-line/60'
                }`}
              >
                <LineChart size={14} />
                <span>Gráfico</span>
              </button>

              <button
                onClick={() => setActiveTab('fundamentales')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 text-[12.5px] font-medium rounded-lg transition-all ${
                  activeTab === 'fundamentales'
                    ? 'bg-gold text-bg font-semibold shadow-sm'
                    : 'text-dim hover:text-text bg-card/60 hover:bg-card border border-line/60'
                }`}
              >
                <BarChart2 size={14} />
                <span>Fundamentales</span>
              </button>

              <button
                onClick={() => setActiveTab('perfil')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 text-[12.5px] font-medium rounded-lg transition-all ${
                  activeTab === 'perfil'
                    ? 'bg-gold text-bg font-semibold shadow-sm'
                    : 'text-dim hover:text-text bg-card/60 hover:bg-card border border-line/60'
                }`}
              >
                <Building2 size={14} />
                <span>Perfil</span>
              </button>

              {/* En mobile botón TradingView en pestañas */}
              <a
                href={getTradingViewUrl(symbol, asset.type)}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:hidden ml-auto inline-flex items-center gap-1 text-[11px] text-dim hover:text-gold"
              >
                <span>TV</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* CUERPO CON SCROLL SUAVE (BODY) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* ===================== TAB 1: GRÁFICO ===================== */}
            {activeTab === 'grafico' && (
              <div className="space-y-4">
                {/* Controles de tipo de gráfico y temporalidades */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-1.5">
                    {(['area', 'velas'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-1 text-[12px] font-medium rounded-lg border border-line transition-colors ${
                          chartType === type
                            ? 'bg-card text-gold border-gold/40 shadow-sm'
                            : 'bg-bg2 text-dim hover:text-text'
                        }`}
                      >
                        {type === 'area' ? 'Área' : 'Velas'}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border border-line transition-colors ${
                          timeframe === tf
                            ? 'bg-gold text-bg font-semibold'
                            : 'bg-bg2 text-dim hover:text-text'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gráfico Espacioso */}
                <div className="rounded-xl border border-line overflow-hidden bg-card">
                  <PriceChart
                    chartType={chartType}
                    height={340}
                    points={view.points}
                    candles={view.candles}
                    loading={loading}
                    error={error}
                  />
                </div>

                {/* Métricas de sesión en tarjetas horizontales */}
                <div className="grid grid-cols-3 gap-2.5 text-dim">
                  <div className="p-3 bg-bg2 rounded-xl border border-line">
                    <span className="text-[11px] block text-dim/80">Apertura</span>
                    <b className="block text-text text-[15px] font-mono mt-0.5">
                      ${formatPrice(last?.open)}
                    </b>
                  </div>
                  <div className="p-3 bg-bg2 rounded-xl border border-line">
                    <span className="text-[11px] block text-dim/80">Máximo</span>
                    <b className="block text-text text-[15px] font-mono mt-0.5">
                      ${formatPrice(last?.high)}
                    </b>
                  </div>
                  <div className="p-3 bg-bg2 rounded-xl border border-line">
                    <span className="text-[11px] block text-dim/80">Mínimo</span>
                    <b className="block text-text text-[15px] font-mono mt-0.5">
                      ${formatPrice(last?.low)}
                    </b>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 2: FUNDAMENTALES ===================== */}
            {activeTab === 'fundamentales' && (
              <div className="space-y-4">
                {loadingFundamentals ? (
                  <div className="py-16 text-center text-dim space-y-2.5">
                    <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[13px]">Consultando balance y métricas contables oficiales...</p>
                  </div>
                ) : asset.type === 'crypto' ? (
                  /* Métricas Cripto Enriquecidas */
                  <div className="space-y-3.5">
                    <div className="p-3.5 bg-bg2 border border-line rounded-xl text-[12.5px] text-dim flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <Info size={18} className="text-gold flex-shrink-0" />
                        <span>
                          Métricas fundamentales de red, tokenomics y mercado descentralizado 24/7.
                        </span>
                      </div>
                      {cryptoProfile && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-card border border-line text-[11px] font-mono text-gold">
                          <Layers size={12} />
                          {cryptoProfile.network}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Máximo Histórico (ATH)</span>
                        <span className="text-[16px] font-mono font-semibold text-text mt-0.5 block">
                          ${formatPrice(asset.ath || cryptoProfile?.ath || 0)}
                        </span>
                        {asset.price > 0 && (asset.ath || cryptoProfile?.ath) && (
                          <span className="text-[10.5px] font-mono text-red block mt-0.5">
                            {(
                              ((asset.price - (asset.ath || cryptoProfile!.ath)) /
                                (asset.ath || cryptoProfile!.ath)) *
                              100
                            ).toFixed(1)}
                            % vs ATH
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Capitalización</span>
                        <span className="text-[16px] font-mono font-semibold text-text mt-0.5 block">
                          {asset.cap || '—'}
                        </span>
                        {cryptoProfile?.rank && (
                          <span className="text-[10.5px] font-mono text-gold block mt-0.5">
                            Rank #{cryptoProfile.rank}{' '}
                            {cryptoProfile.category === 'memecoin' ? 'Meme' : 'Cripto'}
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Volumen 24h</span>
                        <span className="text-[16px] font-mono font-semibold text-text mt-0.5 block">
                          {asset.vol || '—'}
                        </span>
                        <span className="text-[10.5px] text-dim block mt-0.5">Mercado Spot</span>
                      </div>
                      <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Negociación</span>
                        <span className="text-[15px] font-mono text-teal font-semibold mt-0.5 block">
                          24/7 Global
                        </span>
                        <span className="text-[10.5px] text-teal/80 block mt-0.5">
                          Sin corte de mercado
                        </span>
                      </div>
                    </div>

                    {/* Suministro y Tokenomics */}
                    {cryptoProfile && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                          <span className="text-[11px] text-dim block">Suministro en Circulación</span>
                          <span className="text-[15px] font-mono text-text font-semibold mt-0.5 block">
                            {cryptoProfile.circulatingSupply}
                          </span>
                        </div>
                        <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                          <span className="text-[11px] text-dim block">Emisión y Suministro Total</span>
                          <span
                            className="text-[13.5px] font-mono text-dim font-medium mt-0.5 block truncate"
                            title={cryptoProfile.totalSupply}
                          >
                            {cryptoProfile.totalSupply}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : fundamentalsError || !m ? (
                  <div className="py-12 text-center text-dim bg-bg2 rounded-xl border border-line p-5">
                    <p className="text-[14px] text-text font-medium mb-1">
                      Sin balance contable disponible
                    </p>
                    <p className="text-[12px]">
                      No se registran datos fundamentales oficiales para el ticker {symbol}.
                    </p>
                  </div>
                ) : (
                  /* Métricas contables y de balance completas */
                  <div className="space-y-4">
                    {/* Grilla Principal de Métricas en 3 Columnas cómodas */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">PER (Trailing P/E)</span>
                        <span className="text-[16px] font-mono font-semibold text-text mt-0.5 block">
                          {m.pe != null ? `${m.pe.toFixed(1)}x` : '—'}
                        </span>
                        {m.forwardPe != null && (
                          <span className="text-[10.5px] text-dim block mt-0.5">
                            Forward P/E: {m.forwardPe.toFixed(1)}x
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">BPA / EPS (Trailing)</span>
                        <span className="text-[16px] font-mono font-semibold text-text mt-0.5 block">
                          {m.eps != null ? `$${m.eps.toFixed(2)}` : '—'}
                        </span>
                        {m.forwardEps != null && (
                          <span className="text-[10.5px] text-dim block mt-0.5">
                            Forward EPS: ${m.forwardEps.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Capitalización (Market Cap)</span>
                        <span className="text-[16px] font-mono font-semibold text-text mt-0.5 block">
                          {formatCompactNumber(m.marketCap)}
                        </span>
                      </div>

                      <div className="p-3 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Dividendos</span>
                        {m.dividendYield != null && m.dividendYield > 0 ? (
                          <>
                            <span className="text-[16px] font-mono font-semibold text-teal mt-0.5 block">
                              {m.dividendYield.toFixed(2)}%
                            </span>
                            <span className="text-[10.5px] text-dim font-medium block mt-0.5 truncate">
                              {m.dividendFrequency || 'Trimestral'}
                              {m.dividendRate != null ? ` · $${m.dividendRate.toFixed(2)}/acc` : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[15px] font-mono font-medium text-dim mt-0.5 block">
                              No distribuye
                            </span>
                            <span className="text-[10.5px] text-dim/60 block mt-0.5">
                              Reinvierte ganancias
                            </span>
                          </>
                        )}
                      </div>

                      <div className="p-3 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Próximo Balance (Earnings)</span>
                        <span className="text-[14px] font-mono font-medium text-gold truncate mt-0.5 block">
                          {m.earningsDate || 'A confirmar'}
                        </span>
                      </div>

                      <div className="p-3 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Consenso Wall Street</span>
                        <span className="text-[14px] font-mono font-medium uppercase text-text truncate mt-0.5 block">
                          {m.recommendation ? m.recommendation.replace('_', ' ') : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Fila de Precio Objetivo y Potencial Upside */}
                    {m.targetPrice != null && (
                      <div className="p-4 bg-bg2 border border-line rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-[12px] text-dim">
                            <Target size={14} className="text-gold" />
                            <span className="font-medium text-text">Precio Objetivo de Analistas</span>
                          </div>
                          <p className="text-[11.5px] text-dim mt-0.5">
                            Proyección promedio de bancos y casas de inversión de Wall Street.
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[17px] font-mono font-semibold text-text block">
                              ${formatPrice(m.targetPrice)}
                            </span>
                            {targetUpside != null && (
                              <span
                                className={`text-[11.5px] font-mono font-medium inline-flex items-center gap-0.5 ${
                                  targetUpside >= 0 ? 'text-teal' : 'text-red'
                                }`}
                              >
                                {targetUpside >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {targetUpside >= 0 ? '+' : ''}
                                {targetUpside.toFixed(1)}% Upside
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comparativa Deuda Total vs. Liquidez / Caja */}
                    <div className="p-4 bg-bg2 border border-line rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-text font-medium">Deuda Total vs. Liquidez (Caja)</span>
                        {m.debtToEquity != null && (
                          <span className="text-[11px] text-dim font-mono">
                            Debt to Equity: {m.debtToEquity.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {/* Barra visual bicolor */}
                      <div className="w-full h-3 bg-line rounded-full overflow-hidden flex shadow-inner">
                        <div
                          className="bg-teal transition-all"
                          style={{ width: `${cashPercent}%` }}
                          title={`Caja: ${formatCompactNumber(totalCash)}`}
                        />
                        <div
                          className="bg-red transition-all"
                          style={{ width: `${100 - cashPercent}%` }}
                          title={`Deuda: ${formatCompactNumber(totalDebt)}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11.5px] font-mono">
                        <span className="text-teal flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal" /> Caja:{' '}
                          {formatCompactNumber(totalCash)}
                        </span>
                        <span className="text-red flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red" /> Deuda:{' '}
                          {formatCompactNumber(totalDebt)}
                        </span>
                      </div>
                    </div>

                    {/* Flujos de Caja (Free Cash Flow y Cash Flow Operativo) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Flujo de Caja Libre (FCF)</span>
                        <span
                          className={`text-[15px] font-mono font-semibold mt-0.5 block ${
                            (m.freeCashFlow ?? 0) >= 0 ? 'text-text' : 'text-red'
                          }`}
                        >
                          {formatCompactNumber(m.freeCashFlow)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                        <span className="text-[11px] text-dim block">Cash Flow Operativo (FCO)</span>
                        <span
                          className={`text-[15px] font-mono font-semibold mt-0.5 block ${
                            (m.operatingCashFlow ?? 0) >= 0 ? 'text-text' : 'text-red'
                          }`}
                        >
                          {formatCompactNumber(m.operatingCashFlow)}
                        </span>
                      </div>
                    </div>

                    {/* Rango de 52 Semanas */}
                    {m.fiftyTwoWeekLow != null && m.fiftyTwoWeekHigh != null && (
                      <div className="p-3.5 bg-bg2 border border-line rounded-xl">
                        <div className="flex items-center justify-between text-[11.5px] text-dim mb-1.5 font-mono">
                          <span>52w Mín: ${formatPrice(m.fiftyTwoWeekLow)}</span>
                          <span className="text-text font-medium">Rango 52 Semanas</span>
                          <span>52w Máx: ${formatPrice(m.fiftyTwoWeekHigh)}</span>
                        </div>
                        {(() => {
                          const min = m.fiftyTwoWeekLow;
                          const max = m.fiftyTwoWeekHigh;
                          const current = asset.price;
                          const pct = Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
                          return (
                            <div className="w-full h-2 bg-line rounded-full relative overflow-hidden">
                              <div
                                className="h-full bg-gold rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===================== TAB 3: PERFIL ===================== */}
            {activeTab === 'perfil' && (
              <div className="space-y-4">
                {loadingFundamentals ? (
                  <div className="py-16 text-center text-dim space-y-2.5">
                    <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[13px]">Cargando perfil corporativo e institucional...</p>
                  </div>
                ) : asset.type === 'crypto' && cryptoProfile ? (
                  <div className="space-y-4">
                    {/* Ficha técnica cripto en 2 columnas */}
                    <div className="p-4 bg-bg2 border border-line rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Red / Ecosistema</span>
                        <span className="text-gold font-medium font-mono">{cryptoProfile.network}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Categoría</span>
                        <span className="text-text font-medium capitalize">
                          {cryptoProfile.category === 'memecoin' ? 'Meme Coin' : 'Altcoin / Capa 1'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Consenso / Estándar</span>
                        <span className="text-text font-medium">{cryptoProfile.consensus}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Creador / Equipo</span>
                        <span className="text-text font-medium">{cryptoProfile.creator}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Año de Lanzamiento</span>
                        <span className="text-text font-mono font-medium">{cryptoProfile.launchYear}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Sitio Web Oficial</span>
                        <a
                          href={cryptoProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gold hover:underline text-[12px] font-medium"
                        >
                          <span>{cryptoProfile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50 sm:col-span-2">
                        <span className="text-dim">Explorador de Bloques</span>
                        <a
                          href={cryptoProfile.explorer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-teal hover:underline text-[12px] font-medium truncate max-w-[340px]"
                        >
                          <span>{cryptoProfile.explorer.replace(/^https?:\/\//, '').split('/')[0]}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>

                    {/* Descripción de la Criptomoneda */}
                    <div className="p-4 bg-bg2 border border-line rounded-xl">
                      <h4 className="text-[12px] font-semibold text-text mb-2 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Building2 size={13} className="text-gold" />
                        <span>Acerca del Proyecto ({cryptoProfile.name})</span>
                      </h4>
                      <p className="text-[13px] text-dim leading-relaxed whitespace-pre-line">
                        {cryptoProfile.description}
                      </p>
                    </div>
                  </div>
                ) : !prof ? (
                  <div className="py-12 text-center text-dim bg-bg2 rounded-xl border border-line p-5">
                    <p className="text-[14px] text-text font-medium mb-1">
                      Perfil no disponible
                    </p>
                    <p className="text-[12px]">
                      No se registran datos institucionales para {asset.name}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ficha institucional en 2 columnas */}
                    <div className="p-4 bg-bg2 border border-line rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">CEO / Dirección</span>
                        <span className="text-text font-medium">{prof.ceo || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Sector</span>
                        <span className="text-text font-medium">{prof.sector || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Industria</span>
                        <span className="text-text font-medium">{prof.industry || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Sede Central</span>
                        <span className="text-text font-medium">
                          {[prof.city, prof.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Empleados</span>
                        <span className="text-text font-mono font-medium">
                          {prof.employees?.toLocaleString('es-AR') || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                        <span className="text-dim">Sitio Web Oficial</span>
                        {prof.website ? (
                          <a
                            href={prof.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-gold hover:underline text-[12px] font-medium"
                          >
                            <span>{prof.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </div>
                    </div>

                    {/* Descripción de la Compañía */}
                    {prof.description && (
                      <div className="p-4 bg-bg2 border border-line rounded-xl">
                        <h4 className="text-[12px] font-semibold text-text mb-2 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Building2 size={13} className="text-gold" />
                          <span>Acerca del Negocio y Operaciones</span>
                        </h4>
                        <p
                          className={`text-[12.5px] text-dim leading-relaxed ${
                            isDescriptionExpanded ? '' : 'line-clamp-6'
                          }`}
                        >
                          {prof.description}
                        </p>
                        {prof.description.length > 300 && (
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-[11.5px] text-gold hover:underline mt-2.5 font-medium inline-block"
                          >
                            {isDescriptionExpanded ? 'Mostrar menos' : 'Leer descripción completa →'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer del Modal con Disclaimer y Reserva de Derechos */}
          <div className="px-4 py-2.5 sm:px-6 bg-bg2/80 border-t border-line text-[11px] text-dim/80 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-gold flex-shrink-0" />
              <span>
                Fines exclusivamente informativos. La información puede contener demoras o inexactitudes técnicas.
              </span>
            </span>
            <span className="font-mono text-[10px] text-dim/60">© FinDash · Derechos reservados</span>
          </div>
        </div>
      </div>
    </>
  );
};
