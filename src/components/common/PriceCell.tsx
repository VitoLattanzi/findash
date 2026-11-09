'use client';
import React from 'react';
import { fmtPct, fmtPrice } from '@/lib/format';

interface PriceCellProps {
  price?: number | null;
  currency?: string;
  suffix?: string;
  loading?: boolean;
  className?: string;
}

export const PriceCell = ({
  price,
  currency = '$',
  suffix = '',
  loading = false,
  className = '',
}: PriceCellProps) => {
  const isValid = typeof price === 'number' && Number.isFinite(price) && price > 0;

  if (!isValid) {
    if (loading) {
      return (
        <span
          aria-label="Cargando precio"
          className="inline-block h-4 w-16 animate-pulse rounded bg-white/10 align-middle"
        />
      );
    }
    return <span className={`text-dim font-mono ${className}`}>—</span>;
  }

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {fmtPrice(price, currency)}
      {suffix}
    </span>
  );
};

interface ChangeCellProps {
  change?: number | null;
  withArrow?: boolean;
  loading?: boolean;
  className?: string;
}

export const ChangeCell = ({
  change,
  withArrow = true,
  loading = false,
  className = '',
}: ChangeCellProps) => {
  const isValid = typeof change === 'number' && Number.isFinite(change);

  if (!isValid) {
    if (loading) {
      return (
        <span
          aria-label="Cargando variación"
          className="inline-block h-4 w-14 animate-pulse rounded bg-white/10 align-middle"
        />
      );
    }
    return <span className={`text-dim font-mono ${className}`}>—</span>;
  }

  const tone = change > 0 ? 'text-teal' : change < 0 ? 'text-red' : 'text-dim';

  return (
    <span className={`font-mono font-semibold tabular-nums whitespace-nowrap ${tone} ${className}`}>
      {fmtPct(change, withArrow)}
    </span>
  );
};
