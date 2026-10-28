'use client';
import React, { useEffect, useState } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CryptoView } from '@/components/dashboard/CryptoView';
import { BolsaView } from '@/components/dashboard/BolsaView';
import { CountryView } from '@/components/dashboard/CountryView';
// import { PortfolioView } from '@/components/dashboard/PortfolioView'; // En pausa temporalmente
import { MultiChartView } from '@/components/dashboard/MultiChartView';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { ArgentinaView } from '@/components/dashboard/ArgentinaView';
import { AcademyView } from '@/components/dashboard/AcademyView';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { GlobalSearchModal } from '@/components/common/GlobalSearchModal';
import { Ticker } from '@/components/layout/Ticker';
import { Sidebar } from '@/components/layout/Sidebar';
import { Asset } from '@/types';

const VIEW_ORDER = ['dashboard', 'cripto', 'bolsa', 'cedears', 'paises', 'noticias', 'multi', 'aprender'];

export default function Dashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Atajo Ctrl+K o Cmd+K para abrir el buscador global
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Atajo '/' para abrir buscador si no está en un input
      if (e.key === '/') {
        e.preventDefault();
        setSearchModalOpen(true);
        return;
      }

      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VIEW_ORDER.length) setActiveView(VIEW_ORDER[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'cripto': return <CryptoView />;
      case 'bolsa': return <BolsaView />;
      case 'cedears': return <ArgentinaView />;
      case 'paises': return <CountryView />;
      // case 'cartera': return <PortfolioView />;
      case 'multi': return <MultiChartView />;
      case 'noticias': return <NewsFeed />;
      case 'aprender': return <AcademyView />;
      default: return <DashboardView />;
    }
  };

  return (
    <>
      <Ticker onOpenSearch={() => setSearchModalOpen(true)} />
      <div className="flex min-h-[calc(100svh-36px)]">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main
          key={activeView}
          className="flex-1 min-w-0 p-4 pb-24 sm:p-[26px_28px] sm:pb-24 md:pb-[26px] view-enter"
        >
          {renderView()}
        </main>
      </div>

      {/* Buscador Global Universal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectAsset={(asset) => setSelectedAsset(asset)}
      />

      {/* Modal Card del Activo Seleccionado desde el Buscador Global */}
      <DetailPanel
        asset={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </>
  );
}
