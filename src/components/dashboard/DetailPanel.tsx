'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Asset } from '@/types';
import { useSeriesData } from '@/hooks/useSeriesData';
import { PriceChart } from '@/components/common/PriceChart';
import { AssetIcon } from '@/components/common/AssetIcon';
import { formatPrice } from '@/lib/format';
import { getTradingViewUrl } from '@/lib/tradingview';

interface DetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

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
  const [chartType, setChartType] = useState<'area' | 'velas'>('area');
  const [timeframe, setTimeframe] = useState('1a');

  const symbol = asset?.symbol ?? asset?.name;
  const isIntraday = timeframe in INTRADAY;

  const [extendedQuote, setExtendedQuote] = useState<{
    marketState?: string | null;
    preMarketPrice?: number | null;
    preMarketChange?: number | null;
    postMarketPrice?: number | null;
    postMarketChange?: number | null;
  } | null>(null);

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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[50]" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[420px] sm:max-w-[92vw] bg-card border-l border-line z-[51] overflow-y-auto p-4 pb-10 sm:p-[22px]">
        <button onClick={onClose} className="absolute top-4 right-4 text-dim hover:text-text" aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="mb-4 pr-8">
          <div className="flex items-center gap-2.5">
            <AssetIcon symbol={symbol} name={asset.name} type={asset.type} size="md" />
            <div className="text-[22px] font-display font-semibold truncate">{asset.name}</div>
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap mt-1">
            <div className="text-[20px] font-display font-semibold">${formatPrice(asset.price)}</div>
            <div className={`text-[13px] font-medium ${asset.change >= 0 ? 'text-teal' : 'text-red'}`}>
              {asset.change >= 0 ? '+' : ''}
              {asset.change.toFixed(2)}% hoy
            </div>
          </div>

          {/* Pre / Post Market Info */}
          {asset.type !== 'crypto' && (
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-dim flex-wrap">
              {marketState && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg2 border border-line text-[10px] uppercase tracking-wider font-mono">
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
                    <span className={preChange >= 0 ? ' text-teal/80 ml-1' : ' text-red/80 ml-1'}>
                      ({preChange >= 0 ? '+' : ''}{preChange.toFixed(2)}%)
                    </span>
                  )}
                </span>
              )}

              {marketState !== 'REGULAR' && typeof postPrice === 'number' && (
                <span className="text-dim">
                  Post-Mkt: <b className="text-dim font-medium">${formatPrice(postPrice)}</b>
                  {typeof postChange === 'number' && (
                    <span className={postChange >= 0 ? ' text-teal/80 ml-1' : ' text-red/80 ml-1'}>
                      ({postChange >= 0 ? '+' : ''}{postChange.toFixed(2)}%)
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
          <div className="flex gap-1.5">
            {(['area', 'velas'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-[10px] py-1 text-[11.5px] rounded-full border border-line ${
                  chartType === type ? 'bg-gold text-bg' : 'text-dim'
                }`}
              >
                {type === 'area' ? 'Área' : 'Velas'}
              </button>
            ))}
          </div>

          <a
            href={getTradingViewUrl(symbol, asset.type)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-full border border-line bg-bg2 text-dim hover:text-gold hover:border-gold transition-colors font-medium"
            title="Abrir este gráfico completo en TradingView"
          >
            <span>TradingView</span>
            <ExternalLink size={11} />
          </a>
        </div>

        <div className="mb-3">
          <PriceChart
            chartType={chartType}
            height={280}
            points={view.points}
            candles={view.candles}
            loading={loading}
            error={error}
          />
        </div>

        <div className="flex gap-1 mb-4 flex-wrap">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-[10px] py-1 text-[11.5px] rounded-full border border-line ${
                timeframe === tf ? 'bg-gold text-bg' : 'text-dim'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[12px] text-dim mb-4">
          <div>
            Apertura
            <b className="block text-text text-[13.5px]">${formatPrice(last?.open)}</b>
          </div>
          <div>
            Máximo
            <b className="block text-text text-[13.5px]">${formatPrice(last?.high)}</b>
          </div>
          <div>
            Mínimo
            <b className="block text-text text-[13.5px]">${formatPrice(last?.low)}</b>
          </div>
        </div>

        <div className="bg-bg2 border border-dashed border-line rounded-[5px] p-[12px_14px] text-[12.5px] mb-4">
          <b className="text-red">Análisis</b> — espacio reservado para la lógica de análisis crítico
          (¿caro o barato según su contexto?).
        </div>

        <div className="bg-card border border-line rounded-[6px] p-4">
          <h3 className="text-[13.5px] text-dim font-medium mb-2.5">NOTICIAS DEL ACTIVO</h3>
          <div className="text-dim text-[12px]">
            Próximamente: titulares filtrados por activo desde el feed RSS.
          </div>
        </div>
      </aside>
    </>
  );
};
