'use client';
import React, { useState } from 'react';
import { AssetIcon } from '@/components/common/AssetIcon';
import { AssetType } from '@/types';

export interface AssetLogoProps {
  symbol?: string;
  name?: string;
  type?: AssetType;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  className?: string;
}

export const AssetLogo = ({
  symbol = '',
  name,
  type,
  src,
  size = 'sm',
  className = '',
}: AssetLogoProps) => {
  const [failed, setFailed] = useState(false);

  const normalizedSize: 'xs' | 'sm' | 'md' | 'lg' =
    typeof size === 'number'
      ? size <= 16
        ? 'xs'
        : size <= 22
        ? 'sm'
        : size <= 28
        ? 'md'
        : 'lg'
      : size;

  const dimensions = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-[11px]',
    lg: 'w-8 h-8 text-[13px]',
  }[normalizedSize];

  // Si se pasa una URL directa (`src`), la envolvemos con fallback seguro a iniciales
  if (src && !failed) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden bg-bg2 border border-line ${dimensions} ${className}`}
      >
        <img
          src={src}
          alt={symbol || name || 'Logo'}
          onError={() => setFailed(true)}
          className="w-full h-full object-contain rounded-full"
          loading="lazy"
        />
      </span>
    );
  }

  if (src && failed) {
    const clean = (symbol || name || '—').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || '—';
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 bg-bg2 border border-line text-text font-mono font-semibold select-none uppercase ${dimensions} ${className}`}
      >
        {clean}
      </span>
    );
  }

  return <AssetIcon symbol={symbol} name={name} type={type} size={normalizedSize} className={className} />;
};
