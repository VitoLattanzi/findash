'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

const TradingViewCryptoHeatmapComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: 'Crypto',
      blockSize: 'market_cap_calc',
      blockColor: 'change',
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
  }, []);

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
        <div className="bg-card/40 border border-line/50 rounded-[6px] h-[580px] w-full flex items-center justify-center text-dim text-[12.5px] font-mono">
          Mapa de Calor abierto en pantalla completa...
        </div>
      )}

      <div
        className={
          isFullscreen
            ? 'fixed inset-2 sm:inset-5 z-[90] bg-card border border-line rounded-[8px] shadow-2xl overflow-hidden'
            : 'relative bg-card border border-line rounded-[6px] h-[580px] overflow-hidden w-full'
        }
      >
        {/* Botón X arriba a la derecha cuando está en modo pantalla completa */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            aria-label="Salir de pantalla completa"
            title="Salir de pantalla completa (Esc)"
            className="absolute top-1.5 right-12 z-30 w-7 h-7 rounded-[4px] bg-[#131722]/95 hover:bg-red text-text hover:text-white border border-[#2a2e39] hover:border-red flex items-center justify-center shadow-lg transition-colors"
          >
            <X size={15} />
          </button>
        )}

        {/* Botón flotante de Pantalla Completa integrado en la columna derecha de controles (+ / -) */}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          aria-label={isFullscreen ? 'Reducir pantalla completa' : 'Ver en pantalla completa'}
          title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Ampliar a pantalla completa'}
          className="absolute right-[10px] top-[44%] -translate-y-[52px] z-20 w-[28px] h-[28px] rounded-[4px] bg-[#131722]/90 hover:bg-[#2a2e39] text-[#d1d4dc] hover:text-gold border border-[#2a2e39] hover:border-gold/60 flex items-center justify-center shadow-md transition-colors"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        <div
          ref={containerRef}
          className="tradingview-widget-container w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </>
  );
};

export const TradingViewCryptoHeatmap = memo(TradingViewCryptoHeatmapComponent);
