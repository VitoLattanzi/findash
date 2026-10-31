'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import { Maximize2, X } from 'lucide-react';

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
        {/* Botón integrado nativamente en la barra superior de TradingView (justo a la izquierda del engranaje ⚙️) */}
        {!isFullscreen ? (
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            aria-label="Ver en pantalla completa"
            title="Ver en pantalla completa"
            className="absolute top-[5px] right-[42px] z-20 h-[28px] px-2 rounded-[6px] bg-transparent hover:bg-[#2a2e39] text-[#d1d4dc] hover:text-white flex items-center gap-1.5 text-[12px] font-sans transition-colors cursor-pointer"
          >
            <Maximize2 size={14} strokeWidth={1.8} />
            <span className="hidden sm:inline text-[12px] leading-none">Expandir</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            aria-label="Salir de pantalla completa"
            title="Salir de pantalla completa (Esc)"
            className="absolute top-[5px] right-[42px] z-30 h-[28px] px-2.5 rounded-[6px] bg-[#2a2e39] hover:bg-red text-white flex items-center gap-1.5 text-[12px] font-sans transition-colors cursor-pointer shadow-sm"
          >
            <X size={15} strokeWidth={2} />
            <span className="text-[12px] font-medium leading-none">Cerrar</span>
          </button>
        )}

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
