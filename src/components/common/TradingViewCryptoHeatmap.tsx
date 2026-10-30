'use client';
import React, { useEffect, useRef, memo } from 'react';

const TradingViewCryptoHeatmapComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="bg-card border border-line rounded-[6px] h-[580px] overflow-hidden w-full">
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export const TradingViewCryptoHeatmap = memo(TradingViewCryptoHeatmapComponent);
