'use client';
import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Holding } from '@/types';
import { X } from 'lucide-react';

export const PortfolioView = () => {
  const [portfolio, setPortfolio] = useLocalStorage<Holding[]>('findash_cartera', []);
  const [activo, setActivo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');

  const addHolding = () => {
    if (!activo || !cantidad || !precio) return;
    setPortfolio([...portfolio, { activo, cantidad: parseFloat(cantidad), precio: parseFloat(precio) }]);
    setActivo(''); setCantidad(''); setPrecio('');
  };

  const removeHolding = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-[18px]">
        <h2 className="text-[22px]">Mi Cartera</h2>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input value={activo} onChange={e => setActivo(e.target.value)} placeholder="Activo (ej: BTC)" className="flex-1 bg-bg2 border border-line text-text p-[8px_10px] rounded-[5px] min-w-[120px]" />
        <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cantidad" className="flex-1 bg-bg2 border border-line text-text p-[8px_10px] rounded-[5px] min-w-[120px]" />
        <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio de compra" className="flex-1 bg-bg2 border border-line text-text p-[8px_10px] rounded-[5px] min-w-[120px]" />
        <button onClick={addHolding} className="bg-gold text-bg p-[8px_16px] rounded-[5px] font-semibold">Agregar</button>
      </div>
      <div className="bg-card border border-line rounded-[6px] p-4">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium">Activo</th>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium">Cantidad</th>
              <th className="hidden sm:table-cell p-[8px_10px] border-b border-line text-dim font-medium">Precio compra</th>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium">Valor</th>
              <th className="p-[8px_10px] border-b border-line text-dim font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((h, i) => (
              <tr key={i} className="hover:bg-[#1a2030]">
                <td className="p-[9px_10px] border-b border-line font-bold">{h.activo}</td>
                <td className="p-[9px_10px] border-b border-line">{h.cantidad}</td>
                <td className="hidden sm:table-cell p-[9px_10px] border-b border-line">${h.precio.toLocaleString()}</td>
                <td className="p-[9px_10px] border-b border-line">${(h.cantidad * h.precio).toLocaleString()}</td>
                <td className="p-[9px_10px] border-b border-line">
                  <button onClick={() => removeHolding(i)} className="text-dim hover:text-red"><X size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
