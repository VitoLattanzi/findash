'use client';
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Coins, TrendingUp, Globe, Newspaper, BarChart3, Briefcase, Landmark } from 'lucide-react';

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

const isUsMarketOpen = (date: Date) => {
  const et = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
};

export const Sidebar = ({ activeView, setActiveView }: { activeView: string, setActiveView: (v: string) => void }) => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const open = now ? isUsMarketOpen(now) : false;
  const etTime = now
    ? now.toLocaleTimeString('es-AR', { timeZone: 'America/New_York', hour12: false })
    : '--:--:--';

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

        <div className="mt-auto pt-3 border-t border-line space-y-1">
          <div className="flex items-center gap-2 px-2.5 text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-teal animate-pulse' : 'bg-red'}`} />
            <span className="text-dim">Wall St {open ? 'abierto' : 'cerrado'}</span>
          </div>
          <div className="px-2.5 text-[11px] text-dim font-mono tabular-nums">{etTime} ET</div>
          <div className="px-2.5 text-[10px] text-dim/60">Cripto 24/7</div>
        </div>
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
