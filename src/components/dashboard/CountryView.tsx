'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Country } from '@/types';
import { formatPercent, formatPrice } from '@/lib/format';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { PriceChart } from '@/components/common/PriceChart';
import { CountryFlag } from '@/components/common/CountryFlag';
import { MarketHeatmap } from '@/components/common/MarketHeatmap';
import { Asset } from '@/types';
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
  const [countries, setCountries] = useLocalStorage<Country[]>('findash_countries', DEFAULT_COUNTRIES);
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [fx, setFx] = useState<FxRates | null>(null);
  const [news, setNews] = useState<Record<string, CountryNews>>({});
  const [newsLoading, setNewsLoading] = useState(true);
  const [riskAr, setRiskAr] = useState<number | null>(null);
  const [view, setView] = useState<'card' | 'map'>('card');

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

  useEffect(() => {
    fetch('/api/fx')
      .then((res) => res.json())
      .then((data) => data?.rates && setFx(data.rates))
      .catch(() => {});
    fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo')
      .then((res) => res.json())
      .then((data) => typeof data?.valor === 'number' && setRiskAr(data.valor))
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

  const removeCountry = (index: number) => {
    setCountries(countries.filter((_, i) => i !== index));
  };

  const currencyOf = (c: Country) =>
    CURRENCY_BY_ETF[c.etf.toUpperCase()] ?? CURRENCY_BY_NAME[c.name.trim().toLowerCase()] ?? null;

  const fxFor = (code: string | null): { rate: number | null; symbol: string } => {
    if (!code) return { rate: null, symbol: '' };
    if (code === 'USD') return { rate: 1, symbol: '$' };
    const rate = fx ? (fx as unknown as Record<string, number>)[code] ?? null : null;
    return { rate, symbol: CURRENCY_SYMBOL[code] ?? '' };
  };

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
          className="flex-1 bg-bg2 border border-line text-text p-[8px_10px] rounded-[5px] text-[13px]"
        />
        <button onClick={addCountry} className="bg-gold text-bg p-[8px_14px] rounded-[5px] font-semibold text-[13px]">
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[360px] bg-card border border-line rounded-[8px] animate-pulse" />
          ))}
        </div>
      ) : view === 'map' ? (
        <MarketHeatmap
          items={countries
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
      ) : (
        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
          {countries.map((c, i) => {
            const key = c.name;
            const q = quotes[c.etf];
            const change = q?.change ?? 0;
            const vol = volatility(q?.bars);
            const code = currencyOf(c);
            const { rate, symbol } = fxFor(code);
            const items = news[key];
            const pos = items?.pos ?? [];
            const neg = items?.neg ?? [];

            return (
              <article
                key={`${c.etf}-${i}`}
                onClick={() =>
                  setSelected({
                    name: c.name,
                    symbol: c.etf,
                    type: 'stock',
                    price: q?.price ?? 0,
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
                  <div className="text-right flex-shrink-0">
                    <div className="text-[16px] font-semibold">${formatPrice(q?.price)}</div>
                    <div className={`text-[11.5px] font-semibold ${change >= 0 ? 'text-teal' : 'text-red'}`}>
                      {formatPercent(q?.price == null ? null : change)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCountry(i);
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
                    <div className="text-[12.5px] font-semibold truncate">
                      {code === 'USD'
                        ? 'Base'
                        : rate != null && rate > 0
                          ? `${symbol}${rate.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
                          : '—'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-dim">Riesgo país</div>
                    <div className="text-[12.5px] font-semibold truncate">
                      {c.etf === 'ARGT' && riskAr != null ? `${riskAr} pb` : '—'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-dim">Vol 30d</div>
                    <div className={`text-[12.5px] font-semibold truncate ${riskTone(vol)}`}>
                      {vol != null ? `${vol.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 border-t border-line pt-3 flex-1">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-teal mb-1.5">
                      Buenas {pos.length ? `(${pos.length})` : ''}
                    </div>
                    {newsLoading && !items ? (
                      <div className="text-dim text-[11px]">Analizando titulares...</div>
                    ) : pos.length === 0 ? (
                      <div className="text-dim text-[11px]">Sin novedades positivas.</div>
                    ) : (
                      <ul className="space-y-1.5">
                        {pos.slice(0, 2).map((n, idx) => (
                          <li key={`${n.link}-${idx}`}>
                            <a
                              href={n.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="block text-[11.5px] leading-snug text-text/90 hover:text-teal line-clamp-2"
                            >
                              {n.title}
                            </a>
                            <span className="text-[9.5px] text-dim">
                              {n.source}
                              {n.pubDate ? ` · ${new Date(n.pubDate).toLocaleDateString('es-AR')}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="sm:border-l sm:border-line sm:pl-2">
                    <div className="text-[10px] uppercase tracking-wide text-red mb-1.5">
                      Malas {neg.length ? `(${neg.length})` : ''}
                    </div>
                    {newsLoading && !items ? (
                      <div className="text-dim text-[11px]">Analizando titulares...</div>
                    ) : neg.length === 0 ? (
                      <div className="text-dim text-[11px]">Sin novedades negativas.</div>
                    ) : (
                      <ul className="space-y-1.5">
                        {neg.slice(0, 2).map((n, idx) => (
                          <li key={`${n.link}-${idx}`}>
                            <a
                              href={n.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="block text-[11.5px] leading-snug text-text/90 hover:text-red line-clamp-2"
                            >
                              {n.title}
                            </a>
                            <span className="text-[9.5px] text-dim">
                              {n.source}
                              {n.pubDate ? ` · ${new Date(n.pubDate).toLocaleDateString('es-AR')}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
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
