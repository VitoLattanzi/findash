'use client';
import React, { useMemo, useState } from 'react';
import { Asset } from '@/types';
import { Sparkline } from '@/components/common/Sparkline';
import { AssetIcon } from '@/components/common/AssetIcon';
import { TimeframeControl } from '@/components/common/TimeframeHeader';
import { ChangeTimeframe } from '@/lib/timeframe';
import { formatPercent, formatPrice } from '@/lib/format';

type AssetSortKey = 'name' | 'price' | 'change';

interface AssetListProps {
  assets: Asset[];
  view: 'list' | 'card';
  onAssetClick: (asset: Asset) => void;
  onRemove?: (asset: Asset) => void;
  timeframe?: ChangeTimeframe;
  onTimeframeChange?: (tf: ChangeTimeframe) => void;
}

export const AssetList = ({
  assets,
  view,
  onAssetClick,
  onRemove,
  timeframe = '24h',
  onTimeframeChange,
}: AssetListProps) => {
  const [sort, setSort] = useState<{ key: AssetSortKey; dir: 1 | -1 }>({
    key: 'name',
    dir: 1,
  });

  const toggleSort = (key: AssetSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 1 ? -1 : 1 }
        : { key, dir: key === 'name' ? 1 : -1 }
    );
  };

  const sortedAssets = useMemo(() => {
    if (!assets) return [];
    return [...assets].sort((a, b) => {
      if (sort.key === 'name') {
        return (a.name || a.symbol || '').localeCompare(b.name || b.symbol || '', 'es') * sort.dir;
      }
      const va = a[sort.key] ?? 0;
      const vb = b[sort.key] ?? 0;
      return (va - vb) * sort.dir;
    });
  }, [assets, sort]);

  if (!assets || assets.length === 0) {
    return <div className="text-dim text-[12.5px] p-4">No hay activos para mostrar.</div>;
  }

  const sortArrow = (key: AssetSortKey) =>
    sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕';

  return (
    <div>
      {/* Encabezado de Ordenamiento y Selector de Rango (%) */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-line text-[11px] font-medium text-dim uppercase tracking-wider px-1">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => toggleSort('name')}
            className={`hover:text-text transition-colors ${
              sort.key === 'name' ? 'text-gold font-semibold' : ''
            }`}
          >
            ACTIVO <span className="text-[9px] ml-0.5">{sortArrow('name')}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleSort('price')}
            className={`hover:text-text transition-colors ${
              sort.key === 'price' ? 'text-gold font-semibold' : ''
            }`}
          >
            PRECIO <span className="text-[9px] ml-0.5">{sortArrow('price')}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {onTimeframeChange ? (
            <TimeframeControl
              timeframe={timeframe}
              onTimeframeChange={onTimeframeChange}
              sortActive={sort.key === 'change'}
              sortDir={sort.dir}
              onSortClick={() => toggleSort('change')}
              align="right"
            />
          ) : (
            <button
              type="button"
              onClick={() => toggleSort('change')}
              className={`hover:text-text transition-colors ${
                sort.key === 'change' ? 'text-gold font-semibold' : ''
              }`}
            >
              24H % <span className="text-[9px] ml-0.5">{sortArrow('change')}</span>
            </button>
          )}
        </div>
      </div>

      <div className={view === 'list' ? 'flex flex-col' : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'}>
        {sortedAssets.map((a) => (
          <div
            key={a.symbol ?? a.name}
            className={
              view === 'list'
                ? 'group flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-none hover:bg-[#1a2030] px-1 cursor-pointer'
                : 'group bg-bg2 border border-line rounded-[5px] p-3 cursor-pointer hover:border-gold'
            }
            onClick={() => onAssetClick(a)}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <AssetIcon symbol={a.symbol} name={a.name} type={a.type} size="md" />
              <div className="min-w-0 flex-1">
                <b className="text-[13.5px] truncate block">{a.name}</b>
                <div className="text-dim text-[12px] font-mono">${formatPrice(a.price)}</div>
                {view === 'card' && (
                  <div className="mt-2 h-[30px]">
                    <Sparkline data={a.bars} change={a.change} width={140} height={30} />
                  </div>
                )}
              </div>
            </div>

            {view === 'list' && (
              <div className="w-[90px] h-[30px] flex-shrink-0 hidden sm:block">
                <Sparkline data={a.bars} change={a.change} width={90} height={30} />
              </div>
            )}

            <div
              className={`w-[72px] text-right font-mono font-semibold text-[12.5px] ${
                a.change >= 0 ? 'text-teal' : 'text-red'
              }`}
            >
              {formatPercent(a.change)}
            </div>

            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(a);
                }}
                title="Quitar del dashboard"
                className="text-dim hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
