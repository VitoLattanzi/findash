'use client';
import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Asset } from '@/types';
import { useSeriesData } from '@/hooks/useSeriesData';
import { PriceChart } from '@/components/common/PriceChart';
import { formatPrice } from '@/lib/format';

interface DetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIMEFRAMES = ['1D', '1S', '1M', '3M', '6M', '1A', '5A', '10A', 'Máx'];

const TF_DAYS: Record<string, number> = {
  '1D': 1,
  '1S': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1A': 365,
  '5A': 1825,
  '10A': 3650,
  'Máx': 99999,
};

export const DetailPanel = ({ asset, isOpen, onClose }: DetailPanelProps) => {
  const [chartType, setChartType] = useState<'area' | 'velas'>('area');
  const [timeframe, setTimeframe] = useState('Máx');

  const symbol = asset?.symbol ?? asset?.name;
  const series = useSeriesData(isOpen ? symbol : undefined, asset?.type);

  const view = useMemo(() => {
    const days = TF_DAYS[timeframe] ?? 30;
    return {
      points: series.points.slice(-days),
      candles: series.candles.slice(-days),
    };
  }, [series.points, series.candles, timeframe]);

  if (!isOpen || !asset) return null;

  const { loading, error } = series;
  const last = view.candles[view.candles.length - 1];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-[420px] max-w-[92vw] bg-card border-l border-line z-[21] overflow-y-auto p-[22px]">
        <button onClick={onClose} className="absolute top-4 right-4 text-dim hover:text-text" aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="mb-4 pr-8">
          <div className="text-[22px] font-display font-semibold">{asset.name}</div>
          <div className="text-[20px] font-display font-semibold mt-1">${formatPrice(asset.price)}</div>
          <div className={`text-[13px] ${asset.change >= 0 ? 'text-teal' : 'text-red'}`}>
            {asset.change >= 0 ? '+' : ''}
            {asset.change.toFixed(2)}% hoy
          </div>
        </div>

        <div className="flex gap-1.5 mb-3">
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
