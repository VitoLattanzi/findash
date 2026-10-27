'use client';
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Coins, TrendingUp, Globe, Newspaper, BarChart3, Briefcase } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, target: 'dashboard' },
  { name: 'Cripto', icon: Coins, target: 'cripto' },
  { name: 'Bolsa', icon: TrendingUp, target: 'bolsa' },
  { name: 'Países', icon: Globe, target: 'paises' },
  { name: 'Noticias', icon: Newspaper, target: 'noticias' },
  { name: 'Multigráficos', icon: BarChart3, target: 'multi' },
  { name: 'Mi Cartera', icon: Briefcase, target: 'cartera' },
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
    <aside className="w-[var(--sidebar-w)] flex-shrink-0 bg-bg2 border-r border-line p-[18px_10px] sticky top-9 h-[calc(100vh-36px)] flex flex-col">
      <div className="font-display font-semibold text-[18px] p-[4px_10px_18px] tracking-tight">
        <span className="text-gold">◆</span> FinDash
      </div>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item, i) => (
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
            <kbd
              className={`ml-auto text-[9.5px] font-mono px-1 rounded-[3px] border ${
                activeView === item.target
                  ? 'border-line text-gold'
                  : 'border-transparent text-dim/60 group-hover:border-line'
              }`}
            >
              {i + 1}
            </kbd>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-line space-y-1">
        <div className="flex items-center gap-2 px-2.5 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-teal animate-pulse' : 'bg-red'}`} />
          <span className="text-dim">Wall St {open ? 'abierto' : 'cerrado'}</span>
        </div>
        <div className="px-2.5 text-[11px] text-dim font-mono tabular-nums">{etTime} ET</div>
        <div className="px-2.5 text-[10px] text-dim/60">Cripto 24/7 · 1–7 navegar</div>
      </div>
    </aside>
  );
};
