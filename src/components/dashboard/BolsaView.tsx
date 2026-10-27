'use client';
import React, { useEffect, useState } from 'react';

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  name?: string;
  error?: string | null;
}

const ACCIONES = 'AAPL,NVDA,MSFT,MELI,TSLA,AMZN';
const COMMODITIES = 'GC=F,SI=F,CL=F,NG=F,ZS=F';

export const BolsaView = () => {
  const [mode, setMode] = useState<'acciones' | 'commodities'>('acciones');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/market?tickers=${mode === 'acciones' ? ACCIONES : COMMODITIES}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setQuotes(data);
        } else {
          setError(data?.error || 'No se pudo obtener la data de mercado');
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo obtener la data de mercado');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Bolsa &amp; Materias Primas</h2>
        <div className="flex border border-line rounded-[5px] overflow-hidden">
          <button
            onClick={() => setMode('acciones')}
            className={`px-[14px] py-[7px] text-[12.5px] ${mode === 'acciones' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            Acciones
          </button>
          <button
            onClick={() => setMode('commodities')}
            className={`px-[14px] py-[7px] text-[12.5px] ${mode === 'commodities' ? 'bg-gold text-bg' : 'bg-bg2 text-dim'}`}
          >
            Commodities
          </button>
        </div>
      </div>
      <div className="bg-card border border-line rounded-[6px] p-4">
        {loading ? (
          <div className="text-dim text-[12.5px]">Cargando cotizaciones...</div>
        ) : error ? (
          <div className="text-red text-[12.5px]">{error}</div>
        ) : (
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr>
                <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Ticker</th>
                <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Nombre</th>
                <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">Precio</th>
                <th className="p-[8px_10px] border-b border-line text-dim font-medium text-[11.5px]">24h%</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.symbol} className="hover:bg-[#1a2030]">
                  <td className="p-[9px_10px] border-b border-line font-bold">{q.symbol}</td>
                  <td className="p-[9px_10px] border-b border-line text-dim">{q.name || '—'}</td>
                  <td className="p-[9px_10px] border-b border-line">
                    {q.price != null
                      ? `$${q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td
                    className={`p-[9px_10px] border-b border-line ${
                      (q.change ?? 0) >= 0 ? 'text-teal' : 'text-red'
                    }`}
                  >
                    {q.change != null ? `${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
