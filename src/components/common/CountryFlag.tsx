'use client';
import React, { useState } from 'react';

const COUNTRY_CODES: Record<string, string> = {
  argentina: 'ar',
  brasil: 'br',
  'ee.uu.': 'us',
  'estados unidos': 'us',
  usa: 'us',
  españa: 'es',
  europa: 'eu',
  alemania: 'de',
  china: 'cn',
  japón: 'jp',
  japon: 'jp',
  méxico: 'mx',
  mexico: 'mx',
  india: 'in',
  'reino unido': 'gb',
  italia: 'it',
  francia: 'fr',
  canadá: 'ca',
  canada: 'ca',
};

interface CountryFlagProps {
  country: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const CountryFlag = ({
  country,
  size = 'sm',
  className = '',
}: CountryFlagProps) => {
  const [error, setError] = useState(false);
  const normalized = (country || '').toLowerCase().trim();
  const code = COUNTRY_CODES[normalized];

  const dimensions = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-[11px]',
    lg: 'w-8 h-8 text-[13px]',
  }[size];

  if (!code || error) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 bg-bg2 border border-line text-dim font-mono text-[9px] uppercase ${dimensions} ${className}`}
      >
        {country.slice(0, 2)}
      </span>
    );
  }

  const flagUrl = `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;

  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden border border-line/60 ${dimensions} ${className}`}
      title={country}
    >
      <img
        src={flagUrl}
        alt={`Bandera de ${country}`}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </span>
  );
};
