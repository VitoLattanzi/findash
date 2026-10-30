'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  CEDEARS_LIST,
  BONOS_SOBERANOS,
  INSTRUMENTOS_PESOS,
  CedearInfo,
  DolarRate,
  calculateCedearArs,
} from '@/lib/argentina';
import { DetailPanel } from '@/components/dashboard/DetailPanel';
import { AssetIcon } from '@/components/common/AssetIcon';
import { Sparkline } from '@/components/common/Sparkline';
import { TimeframeControl } from '@/components/common/TimeframeHeader';
import { ChangeTimeframe } from '@/lib/timeframe';
import { Asset } from '@/types';
import { formatPercent } from '@/lib/format';
import { Search, Calculator, ArrowRightLeft, ShieldAlert, Sparkles, TrendingUp, ExternalLink } from 'lucide-react';
import { getTradingViewUrl } from '@/lib/tradingview';

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  name: string | null;
  bars?: number[] | null;
  volume?: number | null;
}

type TabMode = 'cedears' | 'bonos' | 'calculadora';
type CedearSortField = 'ticker' | 'name' | 'usd' | 'ars' | 'change' | 'volume';

const formatVolumeCompact = (v?: number | null) => {
  if (v == null || v <= 0) return '—';
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

export const ArgentinaView = () => {
  const [tab, setTab] = useState<TabMode>('cedears');
  const [dolares, setDolares] = useState<Record<string, DolarRate>>({});
  const [riskCountry, setRiskCountry] = useState<number | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'etf' | 'tech' | 'latam' | 'value'>('all');
  const [timeframe, setTimeframe] = useState<ChangeTimeframe>('24h');
  const [sort, setSort] = useState<{ field: CedearSortField; dir: 1 | -1 }>({ field: 'ticker', dir: 1 });
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Estados de calculadora
  const [calcTicker, setCalcTicker] = useState<string>('SPY');
  const [calcArsAmount, setCalcArsAmount] = useState<string>('500000');
  const [mepPesosInput, setMepPesosInput] = useState<string>('1000000');

  // Carga de cotizaciones de dólares y riesgo país
  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, DolarRate> = {};
        for (const item of data) {
          if (item?.casa) map[item.casa] = item;
        }
        setDolares(map);
      })
      .catch(() => {});

    fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.valor === 'number') setRiskCountry(data.valor);
      })
      .catch(() => {});
  }, []);

  // Carga de cotizaciones de acciones subyacentes de CEDEARs desde Yahoo Finance con el rango elegido
  useEffect(() => {
    let cancelled = false;
    const underlyings = Array.from(new Set(CEDEARS_LIST.map((c) => c.underlying))).join(',');
    setLoadingQuotes(true);

    fetch(`/api/market?tickers=${encodeURIComponent(underlyings)}&timeframe=${encodeURIComponent(timeframe)}&spark=1`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const map: Record<string, Quote> = {};
        for (const q of data) {
          if (q?.symbol) map[q.symbol] = q;
        }
        setQuotes(map);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingQuotes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  // Referencias de dólares
  const cclPrice = dolares['contadoconliqui']?.venta || 0;
  const mepPrice = dolares['bolsa']?.venta || 0;
  const bluePrice = dolares['blue']?.venta || 0;
  const oficialPrice = dolares['oficial']?.venta || 0;

  // Cálculos de brechas cambiarias
  const brechaCcl = oficialPrice > 0 ? ((cclPrice - oficialPrice) / oficialPrice) * 100 : 0;
  const brechaBlue = oficialPrice > 0 ? ((bluePrice - oficialPrice) / oficialPrice) * 100 : 0;
  const canjeRate = mepPrice > 0 ? ((cclPrice - mepPrice) / mepPrice) * 100 : 0;

  const toggleSort = (field: CedearSortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 1 ? -1 : 1 }
        : { field, dir: field === 'ticker' || field === 'name' ? 1 : -1 }
    );
  };

  // Filtrado y ordenamiento de CEDEARs
  const filteredCedears = useMemo(() => {
    const base = CEDEARS_LIST.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return item.ticker.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
    });

    return [...base].sort((a, b) => {
      const qa = quotes[a.underlying];
      const qb = quotes[b.underlying];
      if (sort.field === 'ticker') return a.ticker.localeCompare(b.ticker, 'es') * sort.dir;
      if (sort.field === 'name') return a.name.localeCompare(b.name, 'es') * sort.dir;
      if (sort.field === 'usd') return ((qa?.price ?? 0) - (qb?.price ?? 0)) * sort.dir;
      if (sort.field === 'ars') {
        const arsA = calculateCedearArs(qa?.price ?? 0, a.ratio, cclPrice);
        const arsB = calculateCedearArs(qb?.price ?? 0, b.ratio, cclPrice);
        return (arsA - arsB) * sort.dir;
      }
      if (sort.field === 'volume') return ((qa?.volume ?? 0) - (qb?.volume ?? 0)) * sort.dir;
      return ((qa?.change ?? 0) - (qb?.change ?? 0)) * sort.dir;
    });
  }, [categoryFilter, search, quotes, sort, cclPrice]);

  // Selección de CEDEAR para la calculadora
  const selectedCalcCedear = useMemo(() => {
    return CEDEARS_LIST.find((c) => c.ticker === calcTicker) || CEDEARS_LIST[0];
  }, [calcTicker]);

  const calcUsdPrice = quotes[selectedCalcCedear.underlying]?.price || 0;
  const calcEstimatedArsPerCedear = calculateCedearArs(calcUsdPrice, selectedCalcCedear.ratio, cclPrice);
  const parsedArs = parseFloat(calcArsAmount) || 0;
  const qtyCedears = calcEstimatedArsPerCedear > 0 ? Math.floor(parsedArs / calcEstimatedArsPerCedear) : 0;
  const totalInvestedUsd = cclPrice > 0 ? parsedArs / cclPrice : 0;
  const equivalentUnderlyingShares = selectedCalcCedear.ratio > 0 ? qtyCedears / selectedCalcCedear.ratio : 0;

  // Calculadora de Dólar MEP
  const parsedMepPesos = parseFloat(mepPesosInput) || 0;
  const estimatedMepUsd = mepPrice > 0 ? (parsedMepPesos / mepPrice) * 0.995 : 0; // Comisión estimada ~0.5%

  const openCedearChart = (cedear: CedearInfo) => {
    const q = quotes[cedear.underlying];
    setSelectedAsset({
      name: `${cedear.name} (CEDEAR)`,
      symbol: cedear.underlying,
      type: 'stock',
      price: q?.price ?? 0,
      change: q?.change ?? 0,
      bars: q?.bars ?? [],
    });
  };

  const sortArrow = (field: CedearSortField) =>
    sort.field === field ? (sort.dir === 1 ? '▲' : '▼') : '↕';

  return (
    <section className="space-y-6">
      {/* Título y descripción */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-gold font-mono text-[13px] font-semibold">◆ BYMA / MERCADO ARGENTINO</span>
          <span className="text-[11px] bg-bg2 border border-line text-dim px-2 py-0.5 rounded-[3px]">Sin API Keys</span>
        </div>
        <h1 className="text-[26px] tracking-tight">CEDEARs, Bonos &amp; Dólares</h1>
        <p className="text-dim text-[13px] max-w-2xl mt-0.5">
          Cotizaciones en vivo, ratios de conversión oficiales, curva soberana de deuda (AL30/GD30) y brechas cambiarias de la City porteña.
        </p>
      </div>

      {/* Panel Superior: Dólares y Riesgo País */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-card border border-line p-3 rounded-[6px]">
          <div className="text-[11px] text-dim flex items-center justify-between">
            <span>Dólar Blue</span>
            <span className="text-[9px] text-teal">Libre</span>
          </div>
          <div className="text-[17px] font-mono font-semibold mt-1">
            ${bluePrice.toLocaleString('es-AR', { minimumFractionDigits: 1 })}
          </div>
          <div className="text-[10px] text-dim mt-0.5">
            C: ${dolares['blue']?.compra?.toLocaleString('es-AR') ?? '—'}
          </div>
        </div>

        <div className="bg-card border border-line p-3 rounded-[6px]">
          <div className="text-[11px] text-dim flex items-center justify-between">
            <span>Dólar MEP (Bolsa)</span>
            <span className="text-[9px] text-gold">AL30</span>
          </div>
          <div className="text-[17px] font-mono font-semibold mt-1 text-gold">
            ${mepPrice.toLocaleString('es-AR', { minimumFractionDigits: 1 })}
          </div>
          <div className="text-[10px] text-dim mt-0.5">
            Brecha: +{brechaBlue.toFixed(1)}% vs Of.
          </div>
        </div>

        <div className="bg-card border border-line p-3 rounded-[6px]">
          <div className="text-[11px] text-dim flex items-center justify-between">
            <span>Dólar CCL</span>
            <span className="text-[9px] text-teal">GD30 / Cable</span>
          </div>
          <div className="text-[17px] font-mono font-semibold mt-1">
            ${cclPrice.toLocaleString('es-AR', { minimumFractionDigits: 1 })}
          </div>
          <div className="text-[10px] text-dim mt-0.5">
            Canje (CCL/MEP): {canjeRate >= 0 ? '+' : ''}{canjeRate.toFixed(2)}%
          </div>
        </div>

        <div className="bg-card border border-line p-3 rounded-[6px]">
          <div className="text-[11px] text-dim flex items-center justify-between">
            <span>Dólar Oficial</span>
            <span className="text-[9px] text-dim">BNA</span>
          </div>
          <div className="text-[17px] font-mono font-semibold mt-1">
            ${oficialPrice.toLocaleString('es-AR', { minimumFractionDigits: 1 })}
          </div>
          <div className="text-[10px] text-dim mt-0.5">
            Mayorista: ${dolares['mayorista']?.venta?.toLocaleString('es-AR') ?? '—'}
          </div>
        </div>

        <div className="bg-card border border-line p-3 rounded-[6px]">
          <div className="text-[11px] text-dim flex items-center justify-between">
            <span>Brecha Cambiaria</span>
            <span className="text-[9px] text-dim">CCL vs BNA</span>
          </div>
          <div className="text-[17px] font-mono font-semibold mt-1 text-teal">
            +{brechaCcl.toFixed(1)}%
          </div>
          <div className="text-[10px] text-dim mt-0.5">
            Blue vs Of: +{brechaBlue.toFixed(1)}%
          </div>
        </div>

        <div className="bg-card border border-line p-3 rounded-[6px]">
          <div className="text-[11px] text-dim flex items-center justify-between">
            <span>Riesgo País</span>
            <span className="text-[9px] text-dim">EMBI+</span>
          </div>
          <div className="text-[17px] font-mono font-semibold mt-1 text-gold">
            {riskCountry != null ? `${riskCountry.toLocaleString('es-AR')} bps` : '— bps'}
          </div>
          <div className="text-[10px] text-dim mt-0.5">
            ArgentinaDatos API
          </div>
        </div>
      </div>

      {/* Selector de sub-pestañas */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab('cedears')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[13px] border-b-2 font-medium transition-colors ${
            tab === 'cedears' ? 'border-gold text-gold' : 'border-transparent text-dim hover:text-text'
          }`}
        >
          <TrendingUp size={15} />
          <span>CEDEARs &amp; Ratios</span>
          <span className="text-[10px] bg-bg2 px-1.5 py-0.2 rounded font-mono text-dim">{CEDEARS_LIST.length}</span>
        </button>

        <button
          onClick={() => setTab('bonos')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[13px] border-b-2 font-medium transition-colors ${
            tab === 'bonos' ? 'border-gold text-gold' : 'border-transparent text-dim hover:text-text'
          }`}
        >
          <ShieldAlert size={15} />
          <span>Curva Soberana (AL30/GD30)</span>
        </button>

        <button
          onClick={() => setTab('calculadora')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[13px] border-b-2 font-medium transition-colors ${
            tab === 'calculadora' ? 'border-gold text-gold' : 'border-transparent text-dim hover:text-text'
          }`}
        >
          <Calculator size={15} />
          <span>Calculadoras MEP &amp; CEDEAR</span>
        </button>
      </div>

      {/* PESTAÑA 1: CEDEARS */}
      {tab === 'cedears' && (
        <div className="space-y-4">
          {/* Barra de búsqueda y categorías */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: 'all', label: 'Todos' },
                  { key: 'etf', label: 'ETFs' },
                  { key: 'tech', label: 'Tecnología' },
                  { key: 'latam', label: 'Latam & Arg' },
                  { key: 'value', label: 'Value / Consumo' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`text-[11.5px] px-2.5 py-1 rounded-[4px] border transition-colors ${
                    categoryFilter === cat.key
                      ? 'bg-card border-gold text-gold font-medium'
                      : 'bg-bg2 border-line text-dim hover:text-text'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
              <input
                type="text"
                placeholder="Buscar CEDEAR (ej: SPY, NVDA)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-line rounded-[5px] pl-8 pr-3 py-1.5 text-[12.5px] focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Tabla de CEDEARs */}
          <div className="bg-card border border-line rounded-[6px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-bg2 text-dim border-b border-line text-[11px] uppercase tracking-wider">
                    <th
                      onClick={() => toggleSort('ticker')}
                      className={`p-3 cursor-pointer select-none hover:text-text ${
                        sort.field === 'ticker' ? 'text-gold' : ''
                      }`}
                    >
                      Activo / CEDEAR <span className="text-[9px] ml-0.5">{sortArrow('ticker')}</span>
                    </th>
                    <th
                      onClick={() => toggleSort('name')}
                      className={`p-3 cursor-pointer select-none hover:text-text ${
                        sort.field === 'name' ? 'text-gold' : ''
                      }`}
                    >
                      Nombre <span className="text-[9px] ml-0.5">{sortArrow('name')}</span>
                    </th>
                    <th className="p-3 text-center">Ratio BYMA</th>
                    <th
                      onClick={() => toggleSort('usd')}
                      className={`p-3 text-right cursor-pointer select-none hover:text-text ${
                        sort.field === 'usd' ? 'text-gold' : ''
                      }`}
                    >
                      Precio (USD) <span className="text-[9px] ml-0.5">{sortArrow('usd')}</span>
                    </th>
                    <th
                      onClick={() => toggleSort('ars')}
                      className={`p-3 text-right cursor-pointer select-none hover:text-text ${
                        sort.field === 'ars' ? 'text-gold' : ''
                      }`}
                    >
                      Teórico ARS (CCL) <span className="text-[9px] ml-0.5">{sortArrow('ars')}</span>
                    </th>
                    <th className="p-3 text-right">
                      <TimeframeControl
                        timeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                        sortActive={sort.field === 'change'}
                        sortDir={sort.dir}
                        onSortClick={() => toggleSort('change')}
                        align="right"
                      />
                    </th>
                    <th
                      onClick={() => toggleSort('volume')}
                      className={`p-3 text-right cursor-pointer select-none hover:text-text hidden lg:table-cell ${
                        sort.field === 'volume' ? 'text-gold' : ''
                      }`}
                    >
                      Volumen <span className="text-[9px] ml-0.5">{sortArrow('volume')}</span>
                    </th>
                    <th className="p-3 text-center">Gráfico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredCedears.map((item) => {
                    const q = quotes[item.underlying];
                    const usdPrice = q?.price ?? 0;
                    const change = q?.change ?? 0;
                    const arsPrice = calculateCedearArs(usdPrice, item.ratio, cclPrice);

                    return (
                      <tr
                        key={item.ticker}
                        className="hover:bg-[#1a2030] transition-colors cursor-pointer"
                        onClick={() => openCedearChart(item)}
                      >
                        <td className="p-3 font-mono font-semibold text-text">
                          <div className="flex items-center gap-2">
                            <AssetIcon symbol={item.underlying} name={item.name} type="stock" size="sm" />
                            <span className="text-gold font-bold">{item.ticker}</span>
                          </div>
                        </td>
                        <td className="p-3 text-dim truncate max-w-[180px]">{item.name}</td>
                        <td className="p-3 text-center font-mono text-[11.5px]">
                          <span className="bg-bg2 border border-line px-1.5 py-0.5 rounded text-gold">
                            {item.ratio}:1
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {loadingQuotes ? (
                            <span className="text-dim/60">...</span>
                          ) : usdPrice > 0 ? (
                            `$${usdPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-teal">
                          {arsPrice > 0
                            ? `$${arsPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                            : '—'}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className={change >= 0 ? 'text-teal' : 'text-red'}>
                            {formatPercent(change)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-dim text-[11.5px] hidden lg:table-cell">
                          {formatVolumeCompact(q?.volume)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Sparkline data={q?.bars ?? []} change={change} width={68} height={22} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCedearChart(item);
                              }}
                              className="text-[11px] bg-bg2 hover:bg-card border border-line hover:border-gold px-2 py-0.5 rounded text-dim hover:text-gold transition-colors"
                              title="Ver gráfico en panel lateral"
                            >
                              Vela
                            </button>
                            <a
                              href={getTradingViewUrl(item.underlying, 'stock')}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] bg-bg2 hover:bg-card border border-line hover:border-gold px-2 py-0.5 rounded text-dim hover:text-gold transition-colors inline-flex items-center gap-0.5 font-mono"
                              title={`Ver ${item.ticker} en TradingView`}
                            >
                              <span>TV</span>
                              <ExternalLink size={9} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[11px] text-dim flex items-center justify-between px-1">
            <span>
              💡 <b>¿Cómo se calcula el precio en pesos?</b> <code>(Precio USD / Ratio) × Dólar CCL actual (${cclPrice.toFixed(0)})</code>.
            </span>
            <span>Hacé click en cualquier fila para ver el gráfico técnico.</span>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: BONOS SOBERANOS & DEUDA */}
      {tab === 'bonos' && (
        <div className="space-y-6">
          {/* Tarjetas informativas de Mecánica del Mercado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-line p-4 rounded-[6px]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="text-gold" size={18} />
                <h3 className="font-semibold text-[14px]">Mecánica del Dólar MEP (Dólar Bolsa)</h3>
              </div>
              <ol className="text-[12px] text-dim space-y-1.5 list-decimal list-inside">
                <li>
                  <b className="text-text">Compra del bono en pesos:</b> Se compra <b>AL30</b> en pesos (plazo contado inmediato o 24hs).
                </li>
                <li>
                  <b className="text-text">Parking regulatorio:</b> Se mantiene el bono en cartera durante 1 día hábil (normativa CNV).
                </li>
                <li>
                  <b className="text-text">Venta en dólares:</b> Se vende en la especie dólares <b>AL30D</b>. Los USD quedan acreditados en tu comitente listos para transferir a tu cuenta bancaria.
                </li>
              </ol>
            </div>

            <div className="bg-card border border-line p-4 rounded-[6px]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-teal" size={18} />
                <h3 className="font-semibold text-[14px]">Dólar CCL vs MEP (El &quot;Canje&quot; o Cable)</h3>
              </div>
              <p className="text-[12px] text-dim leading-relaxed">
                El <b>Dólar CCL</b> (Contado con Liquidación) se opera con bonos ley extranjera (como <b>GD30 / GD30C</b>) o CEDEARs y permite enviar divisas a cuentas bancarias del exterior (o ingresarlas). El diferencial de precio entre el dólar cable (CCL) y el dólar MEP se conoce como <b>tasa de canje</b> (actualmente <span className="text-gold font-mono font-semibold">{canjeRate.toFixed(2)}%</span>).
              </p>
            </div>
          </div>

          {/* Tabla de la Curva Soberana de Bonos */}
          <div className="bg-card border border-line rounded-[6px] overflow-hidden">
            <div className="p-3 bg-bg2 border-b border-line flex items-center justify-between">
              <span className="font-semibold text-[13px] text-text">Curva Soberana en Dólares (Bonares vs Globales)</span>
              <span className="text-[11px] text-dim">Amortizaciones semestrales (Julio / Enero)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-bg2/60 text-dim border-b border-line text-[11px] uppercase tracking-wider">
                    <th className="p-3">Bono</th>
                    <th className="p-3">Legislación</th>
                    <th className="p-3">Vencimiento</th>
                    <th className="p-3 text-center">Cupón</th>
                    <th className="p-3 text-right">Paridad Ref.</th>
                    <th className="p-3 text-right">TIR Estimada</th>
                    <th className="p-3">Uso Principal en la City</th>
                    <th className="p-3 text-center">Gráfico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {BONOS_SOBERANOS.map((b) => (
                    <tr key={b.ticker} className="hover:bg-[#1a2030] transition-colors">
                      <td className="p-3 font-mono font-bold text-gold">
                        <div className="flex items-center gap-2">
                          <AssetIcon symbol={b.ticker} size="sm" />
                          <span>{b.ticker}</span>
                        </div>
                      </td>
                      <td className="p-3 text-[12px]">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono ${
                            b.legislation.includes('Local')
                              ? 'bg-teal/10 text-teal border border-teal/20'
                              : 'bg-gold/10 text-gold border border-gold/20'
                          }`}
                        >
                          {b.legislation}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-dim text-[11.5px]">{b.maturity}</td>
                      <td className="p-3 text-center font-mono text-[11.5px] text-dim">{b.coupon}</td>
                      <td className="p-3 text-right font-mono font-semibold text-text">{b.paridadRef}%</td>
                      <td className="p-3 text-right font-mono font-semibold text-teal">{b.tirRef}%</td>
                      <td className="p-3 text-dim text-[12px]">{b.useCase}</td>
                      <td className="p-3 text-center">
                        <a
                          href={getTradingViewUrl(b.ticker)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] bg-bg2 hover:bg-card border border-line hover:border-gold px-2 py-0.5 rounded text-dim hover:text-gold transition-colors inline-flex items-center gap-1 font-mono"
                          title={`Abrir ${b.ticker} en TradingView`}
                        >
                          <span>TV</span>
                          <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instrumentos en pesos: Lecaps, CER, Bopreales */}
          <div>
            <h3 className="text-[16px] font-semibold mb-3">Deuda en Pesos &amp; Bopreales del BCRA</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INSTRUMENTOS_PESOS.map((inst) => (
                <div key={inst.ticker} className="bg-card border border-line p-3.5 rounded-[6px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gold text-[13px]">{inst.ticker}</span>
                    <span className="text-[10px] bg-bg2 border border-line px-1.5 py-0.5 rounded text-dim">
                      {inst.type}
                    </span>
                  </div>
                  <div className="text-[12px] font-medium text-text">{inst.name}</div>
                  <p className="text-[11.5px] text-dim leading-relaxed">{inst.description}</p>
                  <div className="text-[11px] text-teal/90 bg-teal/5 p-2 rounded border border-teal/15">
                    <b>Estrategia:</b> {inst.mechanism}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CALCULADORAS DEL INVERSOR ARGENTINO */}
      {tab === 'calculadora' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calculadora de CEDEARs */}
          <div className="bg-card border border-line p-5 rounded-[6px] space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Calculator className="text-gold" size={18} />
              <div>
                <h3 className="font-semibold text-[15px]">Calculadora de Compra de CEDEARs</h3>
                <p className="text-dim text-[11.5px]">Simulá cuántos CEDEARs podés comprar con tu capital en pesos.</p>
              </div>
            </div>

            <div>
              <label className="text-[11.5px] text-dim block mb-1">Elegí el CEDEAR</label>
              <select
                value={calcTicker}
                onChange={(e) => setCalcTicker(e.target.value)}
                className="w-full bg-bg2 border border-line rounded-[5px] p-2 text-[13px] text-text focus:outline-none focus:border-gold"
              >
                {CEDEARS_LIST.map((c) => (
                  <option key={c.ticker} value={c.ticker}>
                    {c.ticker} — {c.name} (Ratio {c.ratio}:1)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11.5px] text-dim block mb-1">Capital disponible en Pesos (ARS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim font-mono">$</span>
                <input
                  type="number"
                  value={calcArsAmount}
                  onChange={(e) => setCalcArsAmount(e.target.value)}
                  className="w-full bg-bg2 border border-line rounded-[5px] pl-7 pr-3 py-2 text-[13.5px] font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="bg-bg2 border border-line p-3.5 rounded-[5px] space-y-2.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-dim">Cotización subyacente en USA:</span>
                <span className="font-mono text-text">
                  ${calcUsdPrice.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Dólar CCL de referencia:</span>
                <span className="font-mono text-text">
                  ${cclPrice.toFixed(0)} ARS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Precio teórico por CEDEAR:</span>
                <span className="font-mono text-teal font-semibold">
                  ${calcEstimatedArsPerCedear.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                </span>
              </div>
              <div className="border-t border-line pt-2 flex justify-between text-[13px]">
                <span className="font-semibold text-text">Cantidad de CEDEARs:</span>
                <span className="font-mono font-bold text-gold text-[15px]">{qtyCedears} u.</span>
              </div>
              <div className="flex justify-between text-[11px] text-dim">
                <span>Acciones equivalentes de USA:</span>
                <span className="font-mono text-text">{equivalentUnderlyingShares.toFixed(3)} acc.</span>
              </div>
              <div className="flex justify-between text-[11px] text-dim">
                <span>Valuación aproximada en USD:</span>
                <span className="font-mono text-teal">${totalInvestedUsd.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Calculadora de Dólar MEP */}
          <div className="bg-card border border-line p-5 rounded-[6px] space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <ArrowRightLeft className="text-teal" size={18} />
              <div>
                <h3 className="font-semibold text-[15px]">Simulador de Dólar MEP</h3>
                <p className="text-dim text-[11.5px]">Estimá cuántos dólares recibís en mano al comprar bono AL30.</p>
              </div>
            </div>

            <div>
              <label className="text-[11.5px] text-dim block mb-1">Monto en Pesos a dolarizar</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim font-mono">$</span>
                <input
                  type="number"
                  value={mepPesosInput}
                  onChange={(e) => setMepPesosInput(e.target.value)}
                  className="w-full bg-bg2 border border-line rounded-[5px] pl-7 pr-3 py-2 text-[13.5px] font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="bg-bg2 border border-line p-3.5 rounded-[5px] space-y-2.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-dim">Cotización Dólar MEP (Bolsa):</span>
                <span className="font-mono text-gold font-semibold">${mepPrice.toFixed(2)} ARS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Arancel / Comisión broker estimada:</span>
                <span className="font-mono text-dim">~0.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Parking requerido:</span>
                <span className="font-mono text-dim">1 día hábil</span>
              </div>
              <div className="border-t border-line pt-2 flex justify-between text-[14px]">
                <span className="font-semibold text-text">Dólares netos estimados:</span>
                <span className="font-mono font-bold text-teal text-[16px]">
                  US$ {estimatedMepUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10.5px] text-dim/80 pt-1 leading-relaxed">
                * El cálculo no incluye el riesgo de variación de precio del bono AL30 durante el día de parking regulatorio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Panel lateral con el gráfico interactivo */}
      <DetailPanel asset={selectedAsset} isOpen={!!selectedAsset} onClose={() => setSelectedAsset(null)} />
    </section>
  );
};
