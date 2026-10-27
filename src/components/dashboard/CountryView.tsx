'use client';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Country } from '@/types';
import { Sparkline } from '@/components/common/Sparkline';
import { formatPercent, formatPrice } from '@/lib/format';
import { X } from 'lucide-react';

const DEFAULT_COUNTRIES: Country[] = [
  { name: 'Argentina', etf: 'ARGT' },
  { name: 'Brasil', etf: 'EWZ' },
  { name: 'EE.UU.', etf: 'SPY' },
  { name: 'España', etf: 'EWP' },
  { name: 'Europa', etf: 'VGK' },
  { name: 'China', etf: 'FXI' },
  { name: 'Japón', etf: 'EWJ' },
  { name: 'México', etf: 'EWW' },
  { name: 'India', etf: 'INDA' },
  { name: 'Alemania', etf: 'EWG' },
];

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  name: string | null;
  bars: number[] | null;
}

export const CountryView = () => {
  const [countries, setCountries] = useLocalStorage<Country[]>('findash_countries', DEFAULT_COUNTRIES);
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  const tickers = countries.map((c) => c.etf).filter((t) => t && t !== '—');

  useEffect(() => {
    if (tickers.length === 0) {
      setQuotes({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    fetch(`/api/market?tickers=${encodeURIComponent(tickers.join(','))}&spark=1`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const map: Record<string, Quote> = {};
        for (const q of data) map[q.symbol] = q;
        setQuotes(map);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tickers.join(',')]);

  const addCountry = () => {
    const value = input.trim();
    if (!value) return;
    const [name, etf] = value.split('/').map((s) => s.trim());
    const ticker = (etf || name).toUpperCase();
    if (countries.some((c) => c.etf === ticker)) {
      setInput('');
      return;
    }
    setCountries([...countries, { name: name || ticker, etf: ticker }]);
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

      {loading ? (
        <div className="text-dim text-[12.5px]">Cargando cotizaciones...</div>
      ) : (
        <div className="grid gap-2">
          {countries.map((c, i) => {
            const q = quotes[c.etf];
            const change = q?.change ?? 0;
            return (
              <div
                key={`${c.etf}-${i}`}
                className="flex justify-between items-center bg-bg2 border border-line rounded-[5px] p-[10px_12px] gap-4"
              >
                <div className="min-w-0 flex-1">
                  <b className="text-[13.5px]">{c.name}</b>
                  <span className="text-dim text-[12px] ml-1">({c.etf})</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12.5px]">${formatPrice(q?.price)}</span>
                    <span className={`text-[12px] ${change >= 0 ? 'text-teal' : 'text-red'}`}>
                      {formatPercent(q?.price == null ? null : change)}
                    </span>
                  </div>
                </div>
                <div className="w-[110px] h-[34px] flex-shrink-0">
                  <Sparkline data={q?.bars ?? []} change={change} width={110} height={34} />
                </div>
                <button
                  onClick={() => removeCountry(i)}
                  className="text-dim hover:text-red flex-shrink-0"
                  aria-label={`Quitar ${c.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
          {countries.length === 0 && (
            <div className="text-dim text-[12.5px]">Todavía no agregaste países.</div>
          )}
        </div>
      )}
    </section>
  );
};
