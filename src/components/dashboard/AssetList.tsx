import React from 'react';
import { Asset } from '@/types';
import { Sparkline } from '@/components/common/Sparkline';

interface AssetListProps {
  assets: Asset[];
  view: 'list' | 'card';
  onAssetClick: (asset: Asset) => void;
}

export const AssetList = ({ assets, view, onAssetClick }: AssetListProps) => {
  if (!assets || assets.length === 0) {
    return <div className="text-dim text-[12.5px] p-4">No hay activos para mostrar.</div>;
  }

  return (
    <div className={view === 'list' ? 'flex flex-col' : 'grid grid-cols-2 gap-2.5'}>
      {assets.map((a) => (
        <div
          key={a.name}
          onClick={() => onAssetClick(a)}
          className={`cursor-pointer p-3 border border-line ${view === 'list' ? 'flex items-center justify-between border-b' : 'bg-bg2 rounded-[5px]'}`}
        >
          <div>
            <b className="text-[13.5px]">{a.name}</b>
            <div className="text-dim text-[12px]">${a.price?.toLocaleString() || '0'}</div>
          </div>
          <div className={`${(a.change || 0) >= 0 ? 'text-teal' : 'text-red'}`}>
            {(a.change || 0) >= 0 ? '+' : ''}{(a.change || 0).toFixed(2)}%
          </div>
          <div className="w-[80px] h-[30px]">
            <Sparkline data={a.bars} change={a.change || 0} />
          </div>
        </div>
      ))}
    </div>
  );
};
