'use client';
import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Country } from '@/types';
import { Sparkline } from '@/components/common/Sparkline';
import { X } from 'lucide-react';

const DEFAULT_COUNTRIES: Country[] = [
  {name: "Argentina", etf: "ARGT", bars: [35, 42, 50, 55, 60]},
  {name: "Brasil", etf: "EWZ", bars: [50, 45, 48, 52, 49]},
  {name: "EE.UU.", etf: "SPY", bars: [55, 58, 60, 59, 62]},
  {name: "China", etf: "FXI", bars: [40, 38, 42, 45, 41]}
];

export const CountryView = () => {
  const [countries, setCountries] = useLocalStorage<Country[]>('findash_countries', DEFAULT_COUNTRIES);
  const [input, setInput] = useState('');

  const addCountry = () => {
    if (!input) return;
    const [name, etf] = input.split('/').map(s => s.trim());
    setCountries([...countries, { name: name || input, etf: etf || '—', bars: [40, 45, 50, 48, 55] }]);
    setInput('');
  };

  const removeCountry = (index: number) => {
    setCountries(countries.filter((_, i) => i !== index));
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Países (ETFs e Índices)</h2>
      </div>
      <div className="flex gap-2 mb-[14px]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCountry()}
          placeholder="Agregar país o ETF (ej: Brasil / EWZ) y Enter"
          className="flex-1 bg-bg2 border border-line text-text p-[8px_10px] rounded-[5px]"
        />
        <button onClick={addCountry} className="bg-gold text-bg p-[8px_14px] rounded-[5px] font-semibold">
          Agregar
        </button>
      </div>
      <div className="grid gap-2">
        {countries.map((c, i) => (
          <div key={i} className="flex justify-between items-center bg-bg2 border border-line rounded-[5px] p-[10px_12px]">
            <div>
              <b className="text-[13.5px]">{c.name}</b> 
              <span className="text-dim text-[12px] ml-1">({c.etf})</span>
              <div className="w-[80px] h-[30px] mt-1">
                <Sparkline data={c.bars} change={1} />
              </div>
            </div>
            <button onClick={() => removeCountry(i)} className="text-dim hover:text-red">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
