'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { AssetIcon } from '@/components/common/AssetIcon';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { formatPercent, formatPrice } from '@/lib/format';
import { AssetType } from '@/types';

export type HeatmapSizeBy = 'marketCap' | 'equal' | 'volatility';

export interface HeatmapItem {
  id: string;
  symbol: string;
  name?: string;
  type: AssetType;
  price: number;
  change: number;
  marketCap?: number | null;
}

interface MarketHeatmapProps<T extends HeatmapItem> {
  items: T[];
  onItemClick?: (item: T) => void;
  defaultSizeBy?: HeatmapSizeBy;
  title?: string;
  /** Clases de altura del lienzo (responsive). */
  heightClassName?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ============================================================
 * Squarified Treemap (Bruls, Huizing & van Wijk) en TS puro.
 * Recibe áreas ya normalizadas (suma = w*h) ordenadas desc.
 * ============================================================ */
function worstRatio(row: number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  const max = Math.max(...row);
  const min = Math.min(...row);
  const s2 = sum * sum;
  const w2 = side * side;
  return Math.max((w2 * max) / s2, s2 / (w2 * min));
}

function squarify(areas: number[], container: Rect): Rect[] {
  const out: Rect[] = [];
  const free: Rect = { ...container };
  let row: number[] = [];
  let i = 0;

  const layoutRow = (r: number[]) => {
    const sum = r.reduce((a, b) => a + b, 0);
    if (free.w >= free.h) {
      // Columna a la izquierda
      const colW = free.h > 0 ? sum / free.h : 0;
      let y = free.y;
      for (const a of r) {
        const h = colW > 0 ? a / colW : 0;
        out.push({ x: free.x, y, w: colW, h });
        y += h;
      }
      free.x += colW;
      free.w -= colW;
    } else {
      // Fila arriba
      const rowH = free.w > 0 ? sum / free.w : 0;
      let x = free.x;
      for (const a of r) {
        const w = rowH > 0 ? a / rowH : 0;
        out.push({ x, y: free.y, w, h: rowH });
        x += w;
      }
      free.y += rowH;
      free.h -= rowH;
    }
  };

  while (i < areas.length) {
    const side = Math.min(free.w, free.h);
    const candidate = [...row, areas[i]];
    if (row.length === 0 || worstRatio(candidate, side) <= worstRatio(row, side)) {
      row = candidate;
      i++;
    } else {
      layoutRow(row);
      row = [];
    }
  }
  if (row.length) layoutRow(row);
  return out;
}

/* ============================================================
 * Escala térmica sobre la paleta FinDash
 * ============================================================ */
const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lerpColor = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, idx) => Math.round(v + (cb[idx] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

const FULL_SCALE = 5; // ±5% = color pleno

export function heatColor(change: number): { bg: string; border: string } {
  if (!Number.isFinite(change) || Math.abs(change) < 0.05) {
    return { bg: '#161b25', border: '#262d3b' };
  }
  const t = Math.min(Math.abs(change) / FULL_SCALE, 1);
  if (change > 0) {
    return {
      bg: lerpColor('#1b4341', '#2b9e93', t),
      border: change >= 3 ? '#4fc7bd' : 'rgba(79,199,189,0.35)',
    };
  }
  return {
    bg: lerpColor('#4d2224', '#c94a42', t),
    border: change <= -3 ? '#d9685f' : 'rgba(217,104,95,0.35)',
  };
}

const SIZE_OPTIONS: Array<[HeatmapSizeBy, string]> = [
  ['marketCap', 'Cap. Mercado'],
  ['equal', 'Igualitario'],
  ['volatility', 'Volatilidad'],
];

const GAP = 2;

export function MarketHeatmap<T extends HeatmapItem>({
  items,
  onItemClick,
  defaultSizeBy = 'marketCap',
  title = 'Mapa de Calor',
  heightClassName = 'h-[380px] md:h-[460px]',
}: MarketHeatmapProps<T>) {
  const [sizeBy, setSizeBy] = useState<HeatmapSizeBy>(defaultSizeBy);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  // Medición responsive del lienzo
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const valid = useMemo(
    () => items.filter((it) => it.price > 0 || Number.isFinite(it.change)),
    [items]
  );

  // Pesos según modo
  const weighted = useMemo(() => {
    const caps = valid.map((it) => it.marketCap).filter((v): v is number => !!v && v > 0);
    const avgCap = caps.length ? caps.reduce((a, b) => a + b, 0) / caps.length : 0;

    const raw = valid.map((it) => {
      let w = 1;
      if (sizeBy === 'marketCap') {
        w = avgCap > 0 ? (it.marketCap && it.marketCap > 0 ? it.marketCap : avgCap) : 1;
      } else if (sizeBy === 'volatility') {
        w = 1 + Math.abs(it.change || 0);
      }
      return { item: it, w };
    });

    // Piso mínimo para que ningún activo desaparezca
    const total = raw.reduce((a, b) => a + b.w, 0) || 1;
    const floor = total * 0.004;
    return raw
      .map((r) => ({ ...r, w: Math.max(r.w, floor) }))
      .sort((a, b) => b.w - a.w);
  }, [valid, sizeBy]);

  const rects = useMemo(() => {
    if (!dims.w || !dims.h || weighted.length === 0) return [];
    const total = weighted.reduce((a, b) => a + b.w, 0);
    const area = dims.w * dims.h;
    const areas = weighted.map((r) => (r.w / total) * area);
    return squarify(areas, { x: 0, y: 0, w: dims.w, h: dims.h });
  }, [weighted, dims]);

  const ups = valid.filter((it) => it.change > 0).length;
  const downs = valid.filter((it) => it.change < 0).length;

  return (
    <div className="bg-card border border-line rounded-xl p-4 shadow-sm">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 text-gold flex items-center justify-center">
            <LayoutGrid size={14} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text">{title}</h3>
            <p className="text-[11px] text-dim font-mono">
              {valid.length} activos · <span className="text-teal">{ups} ▲</span> ·{' '}
              <span className="text-red">{downs} ▼</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-dim">Tamaño:</span>
          <div className="flex border border-line rounded-lg overflow-hidden">
            {SIZE_OPTIONS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSizeBy(key)}
                className={`px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  sizeBy === key ? 'bg-gold text-bg font-semibold' : 'bg-bg2 text-dim hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lienzo del Treemap */}
      <div ref={containerRef} className={`relative w-full overflow-hidden rounded-lg bg-bg ${heightClassName}`}>
        {valid.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-dim text-[12.5px]">
            Cargando cotizaciones para el mapa...
          </div>
        )}

        {rects.map((r, idx) => {
          const { item } = weighted[idx];
          const { bg, border } = heatColor(item.change);
          const w = Math.max(r.w - GAP, 0);
          const h = Math.max(r.h - GAP, 0);
          const minSide = Math.min(w, h);

          const showIcon = w >= 84 && h >= 70;
          const showPct = w >= 42 && h >= 30;
          const showTicker = w >= 24 && h >= 16;
          const tickerSize = Math.max(9, Math.min(26, minSide / 3.6));
          const pctSize = Math.max(8.5, Math.min(16, minSide / 6));
          const iconPx = Math.round(Math.max(18, Math.min(34, minSide / 4)));

          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              title={`${item.name ?? item.symbol} (${item.symbol})\n$${formatPrice(item.price)} · ${formatPercent(item.change)}`}
              className="absolute flex flex-col items-center justify-center text-center overflow-hidden rounded-[3px] transition-[filter,transform] duration-150 hover:brightness-125 hover:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{
                left: r.x + GAP / 2,
                top: r.y + GAP / 2,
                width: w,
                height: h,
                background: bg,
                border: `1px solid ${border}`,
              }}
            >
              {showIcon &&
                (item.type === 'crypto' ? (
                  <CryptoIcon symbol={item.symbol} size={iconPx} className="mb-1" />
                ) : (
                  <AssetIcon
                    symbol={item.symbol}
                    name={item.name}
                    type="stock"
                    size={iconPx >= 28 ? 'lg' : 'md'}
                    className="mb-1"
                  />
                ))}
              {showTicker && (
                <span
                  className="font-bold text-white leading-none truncate max-w-full px-1"
                  style={{ fontSize: tickerSize }}
                >
                  {item.symbol.replace(/\.BA$/, '').replace(/=F$/, '')}
                </span>
              )}
              {showPct && (
                <span
                  className="font-mono text-white/85 leading-none mt-1"
                  style={{ fontSize: pctSize }}
                >
                  {formatPercent(item.change)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda térmica */}
      <div className="flex items-center justify-center gap-1 mt-3 text-[10px] font-mono text-dim">
        {[-5, -3, -1, 0, 1, 3, 5].map((v) => (
          <span
            key={v}
            className="px-2 py-0.5 rounded-[3px] text-white/90"
            style={{ background: heatColor(v).bg }}
          >
            {v > 0 ? `+${v}%` : `${v}%`}
          </span>
        ))}
      </div>
    </div>
  );
}
