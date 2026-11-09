'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Country, Asset } from '@/types';
import { fmtPrice, fmtPct, fmtCompact } from '@/lib/format';
import { PriceCell, ChangeCell } from '@/components/common/PriceCell';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { PriceChart } from '@/components/common/PriceChart';
import { CountryFlag } from '@/components/common/CountryFlag';
import { Sparkline } from '@/components/common/Sparkline';
import { TimeframeControl } from '@/components/common/TimeframeHeader';
import { ChangeTimeframe } from '@/lib/timeframe';
import { MarketHeatmap } from '@/components/common/MarketHeatmap';
import { X } from 'lucide-react';
import { CountryNewsCard } from '@/components/dashboard/CountryNewsCard';
import type { ArIndicatorsResponse } from '@/app/api/ar-indicators/route';


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

const CURRENCY_BY_ETF: Record<string, string> = {
  ARGT: 'ARS',
  EWZ: 'BRL',
  SPY: 'USD',
  EWP: 'EUR',
  VGK: 'EUR',
  EWG: 'EUR',
  FXI: 'CNY',
  EWJ: 'JPY',
  EWW: 'MXN',
  INDA: 'INR',
};

const CURRENCY_BY_NAME: Record<string, string> = {
  argentina: 'ARS',
  brasil: 'BRL',
  'ee.uu.': 'USD',
  'estados unidos': 'USD',
  españa: 'EUR',
  europa: 'EUR',
  china: 'CNY',
  japón: 'JPY',
  mexico: 'MXN',
  'méxico': 'MXN',
  india: 'INR',
  alemania: 'EUR',
};

const CURRENCY_SYMBOL: Record<string, string> = {
  ARS: '$',
  BRL: 'R$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  MXN: 'MX$',
  INR: '₹',
};

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  name: string | null;
  bars: number[] | null;
  marketCap?: number | null;
  volume?: number | null;
}

interface CountryNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment: 'pos' | 'neg' | 'neu';
}

interface CountryNews {
  pos: CountryNewsItem[];
  neg: CountryNewsItem[];
  neu: CountryNewsItem[];
}

interface FxRates {
  ARS: number;
  BRL: number;
  EUR: number;
  GBP: number;
  JPY: number;
  CNY: number;
  MXN: number;
  INR: number;
}

type CountrySortField = 'name' | 'price' | 'change' | 'volume';

const volatility = (bars?: number[] | null): number | null => {
  if (!bars || bars.length < 6) return null;
  const rets: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    if (bars[i - 1] > 0) rets.push(Math.log(bars[i] / bars[i - 1]));
  }
  if (rets.length < 5) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
};

const riskTone = (vol: number | null) => {
  if (vol == null) return 'text-dim';
  if (vol < 15) return 'text-teal';
  if (vol < 30) return 'text-gold';
  return 'text-red';
};

export const CountryView = () => {
  const [countries, setCountries] = useLocalStorage<Country[]>('findash:countries:v1', DEFAULT_COUNTRIES);
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [fx, setFx] = useState<FxRates | null>(null);
  const [news, setNews] = useState<Record<string, CountryNews>>({});
  const [newsLoading, setNewsLoading] = useState(true);
  const [riskAr, setRiskAr] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'card' | 'map'>('card');
  const [timeframe, setTimeframe] = useState<ChangeTimeframe>('24h');
  const [sort, setSort] = useState<{ field: CountrySortField; dir: 1 | -1 }>({ field: 'name', dir: 1 });

  const tickers = countries.map((c) => c.etf).filter((t) => t && t !== '—');
  const names = useMemo(() => countries.map((c) => c.name), [countries]);

  useEffect(() => {
    if (tickers.length === 0) {
      setQuotes({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    fetch(
      `/api/market?tickers=${encodeURIComponent(tickers.join(','))}&spark=1&timeframe=${encodeURIComponent(timeframe)}`
    )
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
  }, [tickers.join(','), timeframe]);

  useEffect(() => {
    fetch('/api/fx')
      .then((res) => res.json())
      .then((data) => data?.rates && setFx(data.rates))
      .catch(() => {});
    fetch('/api/ar-indicators')
      .then((res) => res.json())
      .then((data: ArIndicatorsResponse) => {
        if (typeof data?.riesgoPais === 'number') setRiskAr(data.riesgoPais);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (names.length === 0) {
      setNews({});
      setNewsLoading(false);
      return;
    }
    let cancelled = false;
    setNewsLoading(true);

    fetch(`/api/country-news?countries=${encodeURIComponent(names.join(','))}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data || typeof data !== 'object') return;
        setNews((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setNewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [names.join(',')]);

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

  const removeCountryByEtf = (etf: string) => {
    setCountries(countries.filter((c) => c.etf !== etf));
  };

  const toggleSort = (field: CountrySortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 1 ? -1 : 1 }
        : { field, dir: field === 'name' ? 1 : -1 }
    );
  };

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      const qa = quotes[a.etf];
      const qb = quotes[b.etf];
      if (sort.field === 'name') return a.name.localeCompare(b.name, 'es') * sort.dir;
      if (sort.field === 'price') return ((qa?.price ?? -Infinity) - (qb?.price ?? -Infinity)) * sort.dir;
      if (sort.field === 'volume') return ((qa?.volume ?? -Infinity) - (qb?.volume ?? -Infinity)) * sort.dir;
      return ((qa?.change ?? -Infinity) - (qb?.change ?? -Infinity)) * sort.dir;
    });
  }, [countries, quotes, sort]);

  const currencyOf = (c: Country) =>
    CURRENCY_BY_ETF[c.etf.toUpperCase()] ?? CURRENCY_BY_NAME[c.name.trim().toLowerCase()] ?? null;

  const fxFor = (code: string | null): { rate: number | null; symbol: string } => {
    if (!code) return { rate: null, symbol: '' };
    if (code === 'USD') return { rate: 1, symbol: '$' };
    const rate = fx ? (fx as unknown as Record<string, number>)[code] ?? null : null;
    return { rate, symbol: CURRENCY_SYMBOL[code] ?? '' };
  };

  const sortArrow = (field: CountrySortField) =>
    sort.field === field ? (sort.dir === 1 ? '▲' : '▼') : '↕';

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-3">
        <div>
          <h2 className="text-[22px]">Países (ETFs e Índices)</h2>
          <p className="text-dim text-[12px] mt-1">
            Gráfico, tipo de cambio local, riesgo y titulares buenos y malos de cada mercado.
          </p>
        </div>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          {(
            [
              ['list', 'Lista'],
              ['card', 'Cards'],
              ['map', 'Mapa'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-[14px] py-[7px] text-[12.5px] ${view === key ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-[16px]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCountry()}
          placeholder="Agregar país o ETF (ej: Brasil / EWZ) y Enter"
          className="flex-1 bg-bg2 border border-line text-text p-[8px_10px] rounded-[5px] text-[16px] sm:text-[13px]"
        />
        <button onClick={addCountry} className="bg-gold text-bg p-[8px_14px] rounded-[5px] font-semibold text-[13px]">
          Agregar
        </button>
      </div>

      {/* Barra de ordenamiento y temporalidad */}
      <div className="bg-card border border-line rounded-[6px] px-3 py-2 mb-3 flex items-center justify-between flex-wrap gap-3 text-[11px] font-mono uppercase tracking-wider text-dim">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => toggleSort('name')}
            className={`hover:text-text transition-colors ${sort.field === 'name' ? 'text-gold font-semibold' : ''}`}
          >
            ACTIVO / PAÍS <span className="text-[9px] ml-0.5">{sortArrow('name')}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleSort('price')}
            className={`hover:text-text transition-colors ${sort.field === 'price' ? 'text-gold font-semibold' : ''}`}
          >
            PRECIO <span className="text-[9px] ml-0.5">{sortArrow('price')}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleSort('volume')}
            className={`hover:text-text transition-colors ${sort.field === 'volume' ? 'text-gold font-semibold' : ''}`}
          >
            VOLUMEN <span className="text-[9px] ml-0.5">{sortArrow('volume')}</span>
          </button>
        </div>

        <TimeframeControl
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          sortActive={sort.field === 'change'}
          sortDir={sort.dir}
          onSortClick={() => toggleSort('change')}
          align="right"
          mode="stock"
        />
      </div>

      {loading ? (
        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[360px] bg-card border border-line rounded-[8px] animate-pulse" />
          ))}
        </div>
      ) : view === 'map' ? (
        <MarketHeatmap
          items={sortedCountries
            .filter((c) => quotes[c.etf]?.price != null)
            .map((c) => ({
              id: `${c.name}-${c.etf}`,
              symbol: c.etf,
              name: c.name,
              type: 'stock' as const,
              price: quotes[c.etf]?.price ?? 0,
              change: quotes[c.etf]?.change ?? 0,
              marketCap: quotes[c.etf]?.marketCap ?? null,
            }))}
          defaultSizeBy="volatility"
          title="Mapa de Calor · Países (ETFs)"
          onItemClick={(it) =>
            setSelected({
              name: it.name ?? it.symbol,
              symbol: it.symbol,
              type: 'stock',
              price: it.price,
              change: it.change,
              bars: quotes[it.symbol]?.bars ?? [],
            })
          }
        />
      ) : view === 'list' ? (
        <div className="bg-card border border-line rounded-[6px] overflow-x-auto">
          <table className="w-full text-left text-[12.5px] border-collapse">
            <thead>
              <tr className="bg-bg2 text-dim border-b border-line text-[11px] uppercase tracking-wider">
                <th
                  onClick={() => toggleSort('name')}
                  className={`p-3 cursor-pointer select-none hover:text-text ${
                    sort.field === 'name' ? 'text-gold' : ''
                  }`}
                >
                  Activo / País <span className="text-[9px] ml-0.5">{sortArrow('name')}</span>
                </th>
                <th className="p-3">ETF</th>
                <th
                  onClick={() => toggleSort('price')}
                  className={`p-3 text-right cursor-pointer select-none hover:text-text ${
                    sort.field === 'price' ? 'text-gold' : ''
                  }`}
                >
                  Precio (USD) <span className="text-[9px] ml-0.5">{sortArrow('price')}</span>
                </th>
                <th className="p-3 text-right">
                  <TimeframeControl
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    sortActive={sort.field === 'change'}
                    sortDir={sort.dir}
                    onSortClick={() => toggleSort('change')}
                    align="right"
                    mode="stock"
                  />
                </th>
                <th
                  onClick={() => toggleSort('volume')}
                  className={`p-3 text-right cursor-pointer select-none hover:text-text hidden md:table-cell ${
                    sort.field === 'volume' ? 'text-gold' : ''
                  }`}
                >
                  Volumen <span className="text-[9px] ml-0.5">{sortArrow('volume')}</span>
                </th>
                <th className="p-3 text-right">Gráfico</th>
                <th className="p-3 text-center w-10">Quitar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sortedCountries.map((c) => {
                const q = quotes[c.etf];
                const change = q?.change ?? null;
                return (
                  <tr
                    key={c.etf}
                    onClick={() =>
                      setSelected({
                        name: c.name,
                        symbol: c.etf,
                        type: 'stock',
                        price: q?.price ?? null,
                        change,
                        bars: q?.bars ?? [],
                      })
                    }
                    className="hover:bg-[#1a2030] transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <CountryFlag country={c.name} size="sm" />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-gold font-semibold">{c.etf}</td>
                    <td className="p-3 text-right font-mono">
                      <PriceCell price={q?.price} currency="$" />
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      <ChangeCell change={q?.price == null ? null : change} />
                    </td>
                    <td className="p-3 text-right font-mono text-dim hidden md:table-cell tabular-nums">
                      {fmtCompact(q?.volume)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex justify-end">
                        <Sparkline data={q?.bars ?? []} change={change ?? 0} width={76} height={22} />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCountryByEtf(c.etf);
                        }}
                        className="text-dim hover:text-red"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
          {sortedCountries.map((c) => {
            const key = c.name;
            const q = quotes[c.etf];
            const change = q?.change ?? null;
            const vol = volatility(q?.bars);
            const code = currencyOf(c);
            const { rate, symbol } = fxFor(code);
            const items = news[key];
            const pos = items?.pos ?? [];
            const neg = items?.neg ?? [];

            return (
              <article
                key={c.etf}
                onClick={() =>
                  setSelected({
                    name: c.name,
                    symbol: c.etf,
                    type: 'stock',
                    price: q?.price ?? null,
                    change,
                    bars: q?.bars ?? [],
                  })
                }
                className="group bg-card border border-line rounded-[8px] p-4 cursor-pointer transition-colors hover:border-[#3a4356] flex flex-col"
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CountryFlag country={c.name} size="md" />
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-display font-semibold leading-tight truncate">{c.name}</h3>
                      <div className="text-[11px] font-mono text-dim mt-0.5">
                        {c.etf}
                        {code && <span className="text-gold"> · {code === 'USD' ? 'base USD' : `USD/${code}`}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Sparkline data={q?.bars ?? []} change={change ?? 0} width={68} height={22} />
                    <div className="text-right">
                      <div className="text-[16px] font-semibold">
                        <PriceCell price={q?.price} currency="$" />
                      </div>
                      <div className="text-[11.5px] font-semibold">
                        <ChangeCell change={q?.price == null ? null : change} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCountryByEtf(c.etf);
                    }}
                    className="text-dim hover:text-red flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    aria-label={`Quitar ${c.name}`}
                  >
                    <X size={15} />
                  </button>
                </header>

                <div className="mt-3">
                  <PriceChart symbol={c.etf} type="stock" chartType="area" height={130} compact />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 border-t border-line pt-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-dim">Dólar local</div>
                    <div className="text-[12.5px] font-semibold truncate tabular-nums">
                      {code === 'USD'
                        ? 'Base'
                        : rate != null && rate > 0
                          ? fmtPrice(rate, symbol)
                          : '—'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-dim">Riesgo país</div>
                    <div className="text-[12.5px] font-semibold truncate tabular-nums">
                      {c.etf === 'ARGT' && riskAr != null ? `${riskAr.toLocaleString('es-AR')} pb` : '—'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-dim">Vol 30d</div>
                    <div className={`text-[12.5px] font-semibold truncate tabular-nums ${riskTone(vol)}`}>
                      {vol != null ? fmtPct(vol) : '—'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 border-t border-line pt-3 flex-1">
                  <CountryNewsCard 
                    title="Buenas" 
                    items={pos} 
                    color="teal" 
                    isLoading={newsLoading && !items}
                  />
                  <div className="sm:border-l sm:border-line sm:pl-2">
                    <CountryNewsCard 
                      title="Malas" 
                      items={neg} 
                      color="red" 
                      isLoading={newsLoading && !items}
                    />
                  </div>
                </div>

                <div className="text-[10.5px] text-dim mt-3 group-hover:text-gold transition-colors">
                  Ver gráfico completo →
                </div>
              </article>
            );
          })}
          {countries.length === 0 && (
            <div className="text-dim text-[12.5px]">Todavía no agregaste países.</div>
          )}
        </div>
      )}

      <DetailPanel asset={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
};
