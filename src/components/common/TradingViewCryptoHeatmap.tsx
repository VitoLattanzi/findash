'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import { Maximize2, Minimize2, X, SlidersHorizontal } from 'lucide-react';

type BlockSizeOption = 'market_cap_calc' | 'volume';
type BlockColorOption = 'change' | 'Perf.W' | 'Perf.1M' | 'Perf.3M';

const BLOCK_SIZE_OPTIONS: Array<{ value: BlockSizeOption; label: string }> = [
  { value: 'market_cap_calc', label: 'Cap. Mercado' },
  { value: 'volume', label: 'Volumen 24h' },
];

const BLOCK_COLOR_OPTIONS: Array<{ value: BlockColorOption; label: string }> = [
  { value: 'change', label: '24h %' },
  { value: 'Perf.W', label: '1 Sem' },
  { value: 'Perf.1M', label: '1 Mes' },
  { value: 'Perf.3M', label: '3 Meses' },
];

const TradingViewCryptoHeatmapComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blockSize, setBlockSize] = useState<BlockSizeOption>('market_cap_calc');
  const [blockColor, setBlockColor] = useState<BlockColorOption>('change');

  // Cerrar con tecla Escape en modo pantalla completa
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Montaje del widget oficial de TradingView (solo se recarga si cambian blockSize o blockColor;
  // alternar pantalla completa conserva la instancia viva del iframe sin perder zoom ni ajustes).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: 'Crypto',
      blockSize,
      blockColor,
      locale: 'es',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '100%',
    });

    el.appendChild(widgetContainer);
    el.appendChild(script);

    return () => {
      if (el) el.innerHTML = '';
    };
  }, [blockSize, blockColor]);

  return (
    <>
      {/* Backdrop oscuro cuando está en modo Pop-up / Pantalla Completa */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[89] bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Placeholder para mantener la altura de la grilla cuando el mapa pasa a fixed */}
      {isFullscreen && (
        <div className="bg-card/40 border border-line/50 rounded-[6px] h-[580px] w-full flex items-center justify-center text-dim text-[12.5px] font-mono">
          Mapa de Calor abierto en vista completa...
        </div>
      )}

      <div
        className={
          isFullscreen
            ? 'fixed inset-2 sm:inset-5 z-[90] bg-card border border-line rounded-xl shadow-2xl flex flex-col overflow-hidden'
            : 'bg-card border border-line rounded-[6px] h-[580px] flex flex-col overflow-hidden w-full'
        }
      >
        {/* Barra superior de controles + Botón de Pantalla Completa y X arriba a la derecha */}
        <div className="px-3 py-2 bg-bg2 border-b border-line flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-gold" />
            <span className="text-[12px] font-semibold text-text">
              Mapa de Calor Cripto
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de Tamaño de Bloque */}
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-mono text-dim hidden sm:inline">Tamaño:</span>
              <div className="flex bg-card border border-line rounded-[4px] p-0.5 text-[10.5px] font-mono">
                {BLOCK_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBlockSize(opt.value)}
                    className={`px-2 py-0.5 rounded-[3px] transition-colors ${
                      blockSize === opt.value
                        ? 'bg-gold text-bg font-semibold'
                        : 'text-dim hover:text-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Color / Rango */}
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-mono text-dim hidden md:inline">Color:</span>
              <div className="flex bg-card border border-line rounded-[4px] p-0.5 text-[10.5px] font-mono">
                {BLOCK_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBlockColor(opt.value)}
                    className={`px-1.5 py-0.5 rounded-[3px] transition-colors ${
                      blockColor === opt.value
                        ? 'bg-gold text-bg font-semibold'
                        : 'text-dim hover:text-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Abrir / Salir Pantalla Completa */}
            {!isFullscreen ? (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="Ver mapa de calor en pantalla completa"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-card hover:bg-line border border-line hover:border-gold text-[11px] font-mono text-text hover:text-gold transition-colors"
              >
                <Maximize2 size={12} />
                <span className="hidden sm:inline">Pantalla completa</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  title="Restaurar tamaño"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-card hover:bg-line border border-line text-[11px] font-mono text-dim hover:text-text transition-colors"
                >
                  <Minimize2 size={12} />
                  <span className="hidden sm:inline">Reducir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  aria-label="Cerrar pantalla completa"
                  title="Cerrar pantalla completa (Esc)"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] bg-red/15 hover:bg-red text-red hover:text-white border border-red/30 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenedor del Widget de TradingView */}
        <div className="flex-1 w-full min-h-0 relative">
          <div
            ref={containerRef}
            className="tradingview-widget-container w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </>
  );
};

export const TradingViewCryptoHeatmap = memo(TradingViewCryptoHeatmapComponent);
