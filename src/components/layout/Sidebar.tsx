'use client';
import React from 'react';
import { LayoutDashboard, Coins, TrendingUp, Globe, Newspaper, BarChart3, Briefcase, Landmark } from 'lucide-react';
import { MarketStatusWidget } from '@/components/layout/MarketStatusWidget';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, target: 'dashboard' },
  { name: 'Cripto', icon: Coins, target: 'cripto' },
  { name: 'Bolsa', icon: TrendingUp, target: 'bolsa' },
  { name: 'Arg / CEDEARs', icon: Landmark, target: 'cedears' },
  { name: 'Países', icon: Globe, target: 'paises' },
  { name: 'Noticias', icon: Newspaper, target: 'noticias' },
  { name: 'Multigráficos', icon: BarChart3, target: 'multi' },
  // { name: 'Mi Cartera', icon: Briefcase, target: 'cartera' }, // Pausado temporalmente
];

export const Sidebar = ({ activeView, setActiveView }: { activeView: string, setActiveView: (v: string) => void }) => {
  return (
    <>
      <aside className="hidden md:flex w-[var(--sidebar-w)] flex-shrink-0 bg-bg2 border-r border-line p-[18px_10px] sticky top-9 h-[calc(100dvh-36px)] flex-col z-20">
        <div className="font-display font-semibold text-[18px] p-[4px_10px_18px] tracking-tight">
          <span className="text-gold">◆</span> FinDash
        </div>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => setActiveView(item.target)}
              className={`group flex items-center gap-2.5 w-full text-left text-[13px] p-[10px] rounded-[5px] transition-colors ${
                activeView === item.target
                  ? 'bg-card text-text shadow-[inset_2px_0_0_var(--gold)]'
                  : 'text-dim hover:bg-[#1a2030] hover:text-text'
              }`}
            >
              <item.icon size={16} className={activeView === item.target ? 'text-gold' : ''} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <MarketStatusWidget />
      </aside>

      <nav
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg2/95 backdrop-blur border-t border-line safe-bottom"
      >
        <div className="grid grid-cols-7">
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => setActiveView(item.target)}
              aria-label={item.name}
              aria-current={activeView === item.target ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 min-h-[52px] px-0.5 py-1.5 transition-colors ${
                activeView === item.target ? 'text-gold' : 'text-dim active:text-text'
              }`}
            >
              <item.icon size={16} />
              <span className="text-[7.5px] leading-tight truncate w-full text-center">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};
