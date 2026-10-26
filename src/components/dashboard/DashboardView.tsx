'use client';
import React, { useState, useEffect } from 'react';
import { AssetList } from '@/components/dashboard/AssetList';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { Asset } from '@/types';

export const DashboardView = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'card'>('list');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const response = await fetch('/api/market?tickers=AAPL,NVDA,MSFT,SPY,ARGT');
        const data = await response.json();
        const mappedAssets: Asset[] = data.map((item: any) => ({
          name: item.symbol,
          price: item.price || 0,
          change: item.change || 0,
          bars: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)),
        }));
        setAssets(mappedAssets);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching market data:', error);
        setLoading(false);
      }
    }
    fetchMarketData();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Dashboard</h2>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          <button 
            onClick={() => setView('list')} 
            className={`px-[14px] py-[7px] text-[12.5px] ${view === 'list' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >Lista</button>
          <button 
            onClick={() => setView('card')} 
            className={`px-[14px] py-[7px] text-[12.5px] ${view === 'card' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >Cards</button>
        </div>
      </div>
      <div className="bg-card border border-line rounded-[6px] p-4">
        <h3 className="text-[13.5px] text-dim font-medium mb-2.5">ACTIVOS FIJADOS</h3>
        {loading ? (
          <div className="text-dim text-[12.5px]">Cargando activos...</div>
        ) : (
          <AssetList assets={assets} view={view} onAssetClick={(a) => setSelectedAsset(a)} />
        )}

      </div>
      <DetailPanel 
        asset={selectedAsset} 
        isOpen={!!selectedAsset} 
        onClose={() => setSelectedAsset(null)} 
      />
    </>
  );
};
