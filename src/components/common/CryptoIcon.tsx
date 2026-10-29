'use client';
import React, { useState } from 'react';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export const CryptoIcon = ({
  symbol,
  size = 24,
  className = '',
}: CryptoIconProps) => {
  const [hasError, setHasError] = useState(false);

  const clean = (symbol || '')
    .trim()
    .toUpperCase()
    .replace('USDT', '')
    .replace('USD', '');

  const iconUrl = `https://assets.coincap.io/assets/icons/${clean.toLowerCase()}@2x.png`;
  const fallbackLetters = clean.slice(0, 3) || '—';

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  const fontSize =
    size <= 20 ? 'text-[9px]' : size <= 26 ? 'text-[10px]' : 'text-[12px]';

  if (hasError || !clean) {
    return (
      <div
        style={style}
        className={`rounded-full bg-bg2 border border-line text-dim flex items-center justify-center font-mono font-bold select-none uppercase ${fontSize} ${className}`}
        title={clean}
      >
        {fallbackLetters}
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-bg2 border border-line/60 flex items-center justify-center overflow-hidden flex-shrink-0 select-none p-0.5 ${className}`}
      title={clean}
    >
      <img
        src={iconUrl}
        alt={clean}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain rounded-full"
        loading="lazy"
      />
    </div>
  );
};
