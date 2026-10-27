'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import { PriceChart } from '@/components/common/PriceChart';
import { Sparkline } from '@/components/common/Sparkline';
import { formatPercent, formatPrice, formatVolume } from '@/lib/format';

const MAIN = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'];
const MEME = ['dogeusdt', 'pepeusdt', 'shibusdt', 'trumpusdt', 'wifusdt', 'bonkusdt'];
const ALL = [...MAIN, ...MEME];

const NAMES: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  BNBUSDT: 'BNB',
  SOLUSDT: 'SOL',
  DOGEUSDT: 'DOGE',
  PEPEUSDT: 'PEPE',
  SHIBUSDT: 'SHIB',
  TRUMPUSDT: 'TRUMP',
  WIFUSDT: 'WIF',
  BONKUSDT: 'BONK',
};

const label = (pair: string) => NAMES[pair] ?? pair.replace('USDT', '');

export const CryptoView = () => {
  const prices = useBinanceWebSocket(ALL);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [selected, setSelected] = useState('BTC');
  const [chartType, setChartType] = useState<'area' | 'velas'>('area');

  useEffect(() => {
    let cancelled = false;
    const pairs = ALL.map((s) => s.toUpperCase()).join(',');

    fetch(`/api/klines?symbols=${pairs}&interval=1h&limit=48`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data) return;
        const map: Record<string, number[]> = {};
        for (const key of Object.keys(data)) {
          const candles = data[key];
          if (Array.isArray(candles)) {
            map[key] = candles.map((c: { close: number }) => c.close);
          }
        }
        setSparklines(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPair = `${selected.toUpperCase()}USDT`;
  const selectedTicker = prices[selectedPair];
  const selectedPrice = selectedTicker ? parseFloat(selectedTicker.c) : 0;
  const selectedOpen = selectedTicker ? parseFloat(selectedTicker.o) : 0;
  const selectedChange = selectedOpen ? ((selectedPrice - selectedOpen) / selectedOpen) * 100 : 0;

  const rowsFor = (symbols: string[]) =>
    symbols
      .map((s) => s.toUpperCase())
      .map((pair) => {
        const t = prices[pair];
        if (!t) return null;
        const price = parseFloat(t.c);
        const open = parseFloat(t.o);
        return {
          pair,
          name: label(pair),
          price,
          change: open ? ((price - open) / open) * 100 : 0,
          vol: parseFloat(t.q || '0'),
          bars: sparklines[pair] ?? [],
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

  const renderTable = (title: string, symbols: string[]) => {
    const rows = rowsFor(symbols);
    return (
      <div className="mb-6 last:mb-0">
        <h3 className="text-[13.5px] text-dim font-medium mb-2.5">{title}</h3>
        {rows.length === 0 ? (
          <div className="text-dim text-[12.5px]">Conectando con Binance...</div>
        ) : (
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr>
                <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Activo</th>
                <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Precio</th>
                <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">24h%</th>
                <th className="hidden md:table-cell p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Vol 24h</th>
                <th className="hidden sm:table-cell p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">48h</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isActive = r.name === selected;
                return (
                  <tr
                    key={r.pair}
                    onClick={() => {
                      setSelected(r.name);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`cursor-pointer ${isActive ? 'bg-[#1d2330]' : 'hover:bg-[#1a2030]'}`}
                  >
                    <td className={`p-[9px_10px] border-b border-line font-bold ${isActive ? 'text-gold' : ''}`}>
                      {r.name}
                    </td>
                    <td className="p-[9px_10px] border-b border-line">${formatPrice(r.price)}</td>
                    <td className={`p-[9px_10px] border-b border-line ${r.change >= 0 ? 'text-teal' : 'text-red'}`}>
                      {formatPercent(r.change)}
                    </td>
                    <td className="hidden md:table-cell p-[9px_10px] border-b border-line text-dim">{formatVolume(r.vol)}</td>
                    <td className="hidden sm:table-cell p-[9px_10px] border-b border-line">
                      <div className="w-[80px] h-[24px]">
                        <Sparkline data={r.bars} change={r.change} width={80} height={24} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Cripto</h2>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 items-stretch xl:items-start">
        <div className="w-full xl:w-auto xl:flex-[2] min-w-0 flex flex-col gap-4">
          <div className="bg-card border border-line rounded-[6px] p-4">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
              <div>
                <div className="text-[16px] font-display font-semibold">{selected}</div>
                <div className="text-[20px] font-display font-semibold">${formatPrice(selectedPrice)}</div>
                <div className={`text-[12.5px] ${selectedChange >= 0 ? 'text-teal' : 'text-red'}`}>
                  {formatPercent(selectedChange)} hoy
                </div>
              </div>
              <div className="flex border border-line rounded-[5px] overflow-hidden">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-[12px] py-[5px] text-[11.5px] ${
                    chartType === 'area' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'
                  }`}
                >
                  Área
                </button>
                <button
                  onClick={() => setChartType('velas')}
                  className={`px-[12px] py-[5px] text-[11.5px] ${
                    chartType === 'velas' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'
                  }`}
                >
                  Velas
                </button>
              </div>
            </div>
            <PriceChart symbol={selected} type="crypto" chartType={chartType} height={260} />
          </div>

          <div className="bg-card border border-line rounded-[6px] p-4">
            {renderTable('PRINCIPALES', MAIN)}
            {renderTable('MEME COINS', MEME)}
          </div>
        </div>

        <div className="w-full xl:w-auto xl:flex-[1] xl:min-w-[260px] min-w-0 bg-card border border-line rounded-[6px] p-4">
          <h3 className="text-[13.5px] text-dim font-medium mb-2.5">OPERACIONES DE BALLENAS</h3>
          <div className="block mt-2 bg-[#2a1c1c] text-[#f0b9a8] border border-[#5a2f2a] text-[11.5px] p-[7px_9px] rounded-[4px] mb-2">
            Detector de ballenas en espera de stream @aggTrade
          </div>
          <div className="text-dim text-[11.5px]">
            Se mostrarán alertas cuando se registren órdenes individuales mayores a USD 100.000.
          </div>
        </div>
      </div>
    </section>
  );
};
