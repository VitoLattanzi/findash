'use client';
import React, { useEffect, useState } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CryptoView } from '@/components/dashboard/CryptoView';
import { BolsaView } from '@/components/dashboard/BolsaView';
import { CountryView } from '@/components/dashboard/CountryView';
import { PortfolioView } from '@/components/dashboard/PortfolioView';
import { MultiChartView } from '@/components/dashboard/MultiChartView';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { Ticker } from '@/components/layout/Ticker';
import { Sidebar } from '@/components/layout/Sidebar';

const VIEW_ORDER = ['dashboard', 'cripto', 'bolsa', 'paises', 'noticias', 'multi', 'cartera'];

export default function Dashboard() {
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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
      case 'paises': return <CountryView />;
      case 'cartera': return <PortfolioView />;
      case 'multi': return <MultiChartView />;
      case 'noticias': return <NewsFeed />;
      default: return <DashboardView />;
    }
  };

  return (
    <>
      <Ticker />
      <div className="flex min-h-[calc(100vh-36px)]">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main key={activeView} className="flex-1 p-[26px_28px] min-w-0 view-enter">{renderView()}</main>
      </div>
    </>
  );
}
