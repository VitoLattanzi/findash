import React from 'react';
import { Asset } from '@/types';
import { Sparkline } from '@/components/common/Sparkline';
import { formatPercent, formatPrice } from '@/lib/format';

interface AssetListProps {
  assets: Asset[];
  view: 'list' | 'card';
  onAssetClick: (asset: Asset) => void;
  onRemove?: (asset: Asset) => void;
}

export const AssetList = ({ assets, view, onAssetClick, onRemove }: AssetListProps) => {
  if (!assets || assets.length === 0) {
    return <div className="text-dim text-[12.5px] p-4">No hay activos para mostrar.</div>;
  }

  return (
    <div className={view === 'list' ? 'flex flex-col' : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'}>
      {assets.map((a) => (
        <div
          key={a.symbol ?? a.name}
          className={
            view === 'list'
              ? 'group flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-none hover:bg-[#1a2030] px-1 cursor-pointer'
              : 'group bg-bg2 border border-line rounded-[5px] p-3 cursor-pointer hover:border-gold'
          }
          onClick={() => onAssetClick(a)}
        >
          <div className="min-w-0 flex-1">
            <b className="text-[13.5px]">{a.name}</b>
            <div className="text-dim text-[12px]">${formatPrice(a.price)}</div>
            {view === 'card' && (
              <div className="mt-2 h-[30px]">
                <Sparkline data={a.bars} change={a.change} width={140} height={30} />
              </div>
            )}
          </div>

          {view === 'list' && (
            <div className="w-[90px] h-[30px] flex-shrink-0 hidden sm:block">
              <Sparkline data={a.bars} change={a.change} width={90} height={30} />
            </div>
          )}

          <div className={`w-[64px] text-right text-[12.5px] ${a.change >= 0 ? 'text-teal' : 'text-red'}`}>
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
  );
};
