'use client';
import React, { useState } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CountryView } from '@/components/dashboard/CountryView';
import { PortfolioView } from '@/components/dashboard/PortfolioView';
import { MultiChartView } from '@/components/dashboard/MultiChartView';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { Ticker } from '@/components/layout/Ticker';
import { Sidebar } from '@/components/layout/Sidebar';

export default function Dashboard() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
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
        <main className="flex-1 p-[26px_28px] min-w-0">{renderView()}</main>
      </div>
    </>
  );
}
