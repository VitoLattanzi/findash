'use client';
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Coins,
  TrendingUp,
  Globe,
  Newspaper,
  BarChart3,
  Briefcase,
  Landmark,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { MarketStatusWidget } from '@/components/layout/MarketStatusWidget';
import { UpdatesModal } from '@/components/common/UpdatesModal';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, target: 'dashboard' },
  { name: 'Cripto', icon: Coins, target: 'cripto' },
  { name: 'Bolsa', icon: TrendingUp, target: 'bolsa' },
  { name: 'Arg / CEDEARs', icon: Landmark, target: 'cedears' },
  { name: 'Países', icon: Globe, target: 'paises' },
  { name: 'Noticias', icon: Newspaper, target: 'noticias' },
  { name: 'Multigráficos', icon: BarChart3, target: 'multi' },
  { name: 'Aprender', icon: GraduationCap, target: 'aprender' },
  // { name: 'Mi Cartera', icon: Briefcase, target: 'cartera' }, // Pausado temporalmente
];

export const Sidebar = ({ activeView, setActiveView }: { activeView: string, setActiveView: (v: string) => void }) => {
  const [showUpdates, setShowUpdates] = useState(false);

  return (
    <>
      <aside className="hidden md:flex w-[var(--sidebar-w)] flex-shrink-0 bg-bg2 border-r border-line p-[18px_10px] sticky top-9 h-[calc(100dvh-36px)] flex-col z-20">
        <div className="font-display font-semibold text-[18px] p-[4px_10px_18px] tracking-tight flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('dashboard');
            }}
            className="hover:text-gold transition-colors"
          >
            <span className="text-gold">◆</span> FinDash
          </a>
          <button
            onClick={() => setShowUpdates(true)}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-bg transition-colors"
            title="Ver últimas novedades de la plataforma"
          >
            v1.6
          </button>
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

        {/* Botón Novedades & Changelog */}
        <button
          onClick={() => setShowUpdates(true)}
          className="flex items-center justify-between w-full px-2.5 py-2 my-2 rounded-lg bg-card/60 hover:bg-card border border-line hover:border-gold/50 text-[11.5px] text-dim hover:text-text transition-all group shadow-sm"
          title="Ver qué hay de nuevo en FinDash"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles size={13} className="text-gold group-hover:scale-110 transition-transform" />
            <span>Novedades</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
        </button>

        <MarketStatusWidget />
      </aside>

      <UpdatesModal isOpen={showUpdates} onClose={() => setShowUpdates(false)} />

      <nav
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg2/95 backdrop-blur border-t border-line safe-bottom"
      >
        <div className="grid grid-cols-8">
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
