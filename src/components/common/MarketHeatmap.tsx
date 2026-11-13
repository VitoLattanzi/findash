'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, Maximize2, Minimize2, X, RotateCcw } from 'lucide-react';
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
      let x = free.y;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  // Estados de Zoom / Pan táctil para celular y mouse
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomTranslate, setZoomTranslate] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const touchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
    lastPan: { x: number; y: number };
    lastTapTime: number;
    isPinchingOrPanning: boolean;
    moved: boolean;
  }>({
    initialDistance: 0,
    initialScale: 1,
    lastPan: { x: 0, y: 0 },
    lastTapTime: 0,
    isPinchingOrPanning: false,
    moved: false,
  });

  // Cerrar con tecla Escape cuando está en modo pantalla completa
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Medición responsive del lienzo
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen]);

  // Reset zoom al cambiar fullscreen o modo
  const resetZoom = () => {
    setZoomScale(1);
    setZoomTranslate({ x: 0, y: 0 });
  };

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

  // Manejador de touch (pellizco 2 dedos para zoom, arrastre 1 o 2 dedos para pan, y doble toque)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStateRef.current.moved = false;

    if (e.touches.length === 2) {
      // Inicio de pellizco con 2 dedos
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      touchStateRef.current.initialDistance = dist;
      touchStateRef.current.initialScale = zoomScale;
      touchStateRef.current.lastPan = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      touchStateRef.current.isPinchingOrPanning = true;
    } else if (e.touches.length === 1) {
      // Registro de posición para pan cuando está zoomeado
      touchStateRef.current.lastPan = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      touchStateRef.current.moved = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);

      if (touchStateRef.current.initialDistance > 0) {
        const factor = dist / touchStateRef.current.initialDistance;
        const newScale = Math.min(Math.max(touchStateRef.current.initialScale * factor, 1), 4);
        setZoomScale(newScale);

        // Pan simultáneo de dos dedos
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const deltaX = midX - touchStateRef.current.lastPan.x;
        const deltaY = midY - touchStateRef.current.lastPan.y;

        setZoomTranslate((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        touchStateRef.current.lastPan = { x: midX, y: midY };
      }
    } else if (e.touches.length === 1 && zoomScale > 1.05) {
      // Pan con 1 dedo cuando está ampliado
      const deltaX = e.touches[0].clientX - touchStateRef.current.lastPan.x;
      const deltaY = e.touches[0].clientY - touchStateRef.current.lastPan.y;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        touchStateRef.current.moved = true;
      }

      setZoomTranslate((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      touchStateRef.current.lastPan = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStateRef.current.initialDistance = 0;
    }
    if (e.touches.length === 0) {
      // Doble toque para zoom in (2.2x) o restablecer (1x)
      const now = Date.now();
      const last = touchStateRef.current.lastTapTime;
      if (!touchStateRef.current.moved && now - last < 300) {
        if (zoomScale > 1.2) {
          resetZoom();
        } else {
          setZoomScale(2.2);
        }
      }
      touchStateRef.current.lastTapTime = now;
      touchStateRef.current.isPinchingOrPanning = false;
    }
  };

  return (
    <>
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[89] bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      <div
        className={
          isFullscreen
            ? 'fixed inset-2 sm:inset-5 z-[90] bg-card border border-line rounded-xl p-3 sm:p-4 shadow-2xl flex flex-col overflow-hidden'
            : `bg-card border border-line rounded-xl p-3 sm:p-4 shadow-sm w-full h-full flex flex-col justify-between`
        }
      >
        {/* Encabezado */}
        <div className="draggable-handle flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 text-gold flex items-center justify-center">
              <LayoutGrid size={14} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text">{title}</h3>
              <p className="text-[11px] text-dim font-mono">
                {valid.length} activos · <span className="text-teal">{ups} ▲</span> ·{' '}
                <span className="text-red">{downs} ▼</span>
                {zoomScale > 1.05 && (
                  <span className="ml-1 text-gold font-semibold">({zoomScale.toFixed(1)}x)</span>
                )}
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

            {zoomScale > 1.05 && (
              <button
                type="button"
                onClick={resetZoom}
                title="Restablecer zoom (1x)"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-bg2 hover:bg-line border border-line text-[11px] font-mono text-gold transition-colors"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">1x</span>
              </button>
            )}

            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="Cerrar pantalla completa"
                title="Cerrar pantalla completa (Esc)"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red/15 hover:bg-red text-red hover:text-white border border-red/30 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Lienzo del Treemap interactivo con gestos touch (pellizco 2 dedos + doble toque + tap en activo) */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full overflow-hidden rounded-lg bg-bg select-none touch-none ${
            isFullscreen ? 'flex-1 min-h-0' : heightClassName
          }`}
        >
          {valid.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-dim text-[12.5px]">
              Cargando cotizaciones para el mapa...
            </div>
          )}

          <div
            className="w-full h-full relative transition-transform duration-75 origin-center will-change-transform"
            style={{
              transform: `translate(${zoomTranslate.x}px, ${zoomTranslate.y}px) scale(${zoomScale})`,
            }}
          >
            {rects.map((r, idx) => {
              const { item } = weighted[idx];
              const { bg, border } = heatColor(item.change);
              const w = Math.max(r.w - GAP, 0);
              const h = Math.max(r.h - GAP, 0);
              const minSide = Math.min(w, h);

              const showIcon = w >= 70 && h >= 56;
              const showPct = w >= 36 && h >= 26;
              const showTicker = w >= 20 && h >= 14;
              const tickerSize = Math.max(9, Math.min(26, minSide / 3.6));
              const pctSize = Math.max(8.5, Math.min(16, minSide / 6));
              const iconPx = Math.round(Math.max(16, Math.min(32, minSide / 4)));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    // Evitar disparar click si el usuario estaba arrastrando/pellizcando
                    if (touchStateRef.current.moved) return;
                    onItemClick?.(item);
                  }}
                  title={`${item.name ?? item.symbol} (${item.symbol})\n$${formatPrice(item.price)} · ${formatPercent(item.change)}`}
                  className="absolute flex flex-col items-center justify-center text-center overflow-hidden rounded-[3px] transition-[filter,transform] duration-150 active:scale-95 hover:brightness-125 hover:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer"
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
                      <CryptoIcon symbol={item.symbol} size={iconPx} className="mb-1 pointer-events-none" />
                    ) : (
                      <AssetIcon
                        symbol={item.symbol}
                        name={item.name}
                        type="stock"
                        size={iconPx >= 28 ? 'lg' : 'md'}
                        className="mb-1 pointer-events-none"
                      />
                    ))}
                  {showTicker && (
                    <span
                      className="font-bold text-white leading-none truncate max-w-full px-1 pointer-events-none"
                      style={{ fontSize: tickerSize }}
                    >
                      {item.symbol.replace(/\.BA$/, '').replace(/=F$/, '')}
                    </span>
                  )}
                  {showPct && (
                    <span
                      className="font-mono text-white/85 leading-none mt-1 pointer-events-none"
                      style={{ fontSize: pctSize }}
                    >
                      {formatPercent(item.change)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leyenda térmica + Botón de Pantalla Completa abajo a la derecha */}
        <div className="flex items-center justify-between gap-2 mt-3 text-[10px] font-mono text-dim flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
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

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Ver mapa de calor en pantalla completa'}
            className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-bg2 hover:bg-line border border-line hover:border-gold text-[11px] font-mono text-text hover:text-gold transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={12} />
                <span>Reducir</span>
              </>
            ) : (
              <>
                <Maximize2 size={12} />
                <span>Pantalla completa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
