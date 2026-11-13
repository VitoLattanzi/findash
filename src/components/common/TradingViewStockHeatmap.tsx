'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import { Maximize2, Minimize2, X, Grid } from 'lucide-react';

const TradingViewStockHeatmapComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMonoSize, setIsMonoSize] = useState(false);

  // Cerrar con tecla Escape en modo pantalla completa
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: 'SPX500',
      grouping: 'sector',
      blockSize: isMonoSize ? 'mono' : 'market_cap_basic',
      blockColor: 'change',
      locale: 'es',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize,
      width: '100%',
      height: '100%',
    });

    el.appendChild(widgetContainer);
    el.appendChild(script);

    return () => {
      if (el) el.innerHTML = '';
    };
  }, [isMonoSize]);

  return (
    <>
      {/* Backdrop oscuro cuando está en modo Pop-up / Pantalla Completa */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[89] bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Placeholder para mantener la grilla intacta cuando pasa a pantalla completa */}
      {isFullscreen && (
        <div className="bg-card/40 border border-line/50 rounded-[6px] h-full w-full flex items-center justify-center text-dim text-[12.5px] font-mono">
          Mapa de Calor Bursátil abierto en pantalla completa...
        </div>
      )}

      <div
        className={
          isFullscreen
            ? 'fixed inset-2 sm:inset-5 z-[90] bg-card border border-line rounded-[8px] shadow-2xl overflow-hidden flex flex-col'
            : 'relative bg-card border border-line rounded-[6px] h-full min-h-[380px] overflow-hidden w-full flex flex-col'
        }
      >
        {/* Barra superior de control del Heatmap con toggle Tamaño Igual (Mono) */}
        <div className="draggable-handle flex items-center justify-between px-3 py-1.5 bg-bg2 border-b border-line flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 text-[11.5px] font-mono text-dim">
            <span className="text-gold font-semibold">S&amp;P 500 Heatmap</span>
            <span className="hidden sm:inline text-[10.5px]">
              · {isMonoSize ? 'Celdas de igual tamaño (Mono)' : 'Ponderado por Market Cap'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMonoSize((prev) => !prev)}
              title="Alternar entre tamaño proporcional a capitalización o tamaño igualitario para ver sectores chicos"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-mono border transition-colors cursor-pointer ${
                isMonoSize
                  ? 'bg-gold text-bg border-gold font-semibold'
                  : 'bg-card text-dim border-line hover:text-text hover:border-gold/50'
              }`}
            >
              <Grid size={12} />
              <span>⊞ Tamaño igual (Mono)</span>
            </button>

            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="Salir de pantalla completa"
                title="Salir de pantalla completa (Esc)"
                className="h-[26px] w-[26px] rounded-[5px] bg-[#2a2e39] hover:bg-red text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Contenedor del Widget de TradingView */}
        <div className="relative flex-1 min-h-0 w-full">
          {/* Botón de Zoom / Pantalla Completa abajo a la derecha del todo (en la barra del indicador de colores) */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Ver en pantalla completa'}
            className="absolute bottom-[4px] right-[8px] z-20 h-[22px] px-2 rounded-[4px] bg-[#131722]/90 hover:bg-[#2a2e39] text-[#d1d4dc] hover:text-gold border border-[#2a2e39] hover:border-gold/50 flex items-center gap-1.5 text-[11px] font-mono transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={12} />
                <span>Reducir</span>
              </>
            ) : (
              <>
                <Maximize2 size={12} />
                <span className="hidden sm:inline">Pantalla completa</span>
              </>
            )}
          </button>

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

export const TradingViewStockHeatmap = memo(TradingViewStockHeatmapComponent);
export const StockHeatmap = TradingViewStockHeatmap;
