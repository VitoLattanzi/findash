import React from 'react';
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

export const Sidebar = ({ activeView, setActiveView }: { activeView: string, setActiveView: (v: string) => void }) => {
  return (
    <aside className="w-[var(--sidebar-w)] flex-shrink-0 bg-bg2 border-r border-line p-[18px_10px] sticky top-9 h-[calc(100vh-36px)]">
      <div className="font-display font-semibold text-[18px] p-[4px_10px_18px]">💠 FinDash</div>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <button
            key={item.target}
            onClick={() => setActiveView(item.target)}
            className={`flex items-center gap-2.5 w-full text-left text-[13px] p-[10px] rounded-[5px] ${
              activeView === item.target ? 'bg-card text-text' : 'text-dim hover:bg-[#1a2030]'
            }`}
          >
            <item.icon size={16} />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
