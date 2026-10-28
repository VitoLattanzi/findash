'use client';
import React, { useState } from 'react';
import { AssetType } from '@/types';

const DOMAIN_MAP: Record<string, string> = {
  // Big Tech
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  NVDA: 'nvidia.com',
  AMZN: 'amazon.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  META: 'meta.com',
  TSLA: 'tesla.com',
  AMD: 'amd.com',
  INTC: 'intel.com',
  AVGO: 'broadcom.com',
  CRM: 'salesforce.com',
  ORCL: 'oracle.com',
  ADBE: 'adobe.com',
  IBM: 'ibm.com',
  QCOM: 'qualcomm.com',
  NFLX: 'netflix.com',
  PLTR: 'palantir.com',
  SNOW: 'snowflake.com',
  CRWD: 'crowdstrike.com',
  NOW: 'servicenow.com',
  UBER: 'uber.com',

  // Consumo / Salud / Finanzas
  KO: 'coca-colacompany.com',
  PEP: 'pepsico.com',
  MCD: 'mcdonalds.com',
  WMT: 'walmart.com',
  COST: 'costco.com',
  DIS: 'thewaltdisneycompany.com',
  SBUX: 'starbucks.com',
  NKE: 'nike.com',
  JPM: 'jpmorganchase.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  BAC: 'bankofamerica.com',
  WFC: 'wellsfargo.com',
  GS: 'goldmansachs.com',
  MS: 'morganstanley.com',
  BLK: 'blackrock.com',
  BRK: 'berkshirehathaway.com',
  'BRK-B': 'berkshirehathaway.com',
  JNJ: 'jnj.com',
  LLY: 'lilly.com',
  PFE: 'pfizer.com',
  UNH: 'unitedhealthgroup.com',
  CAT: 'caterpillar.com',
  BA: 'boeing.com',
  GE: 'ge.com',
  LMT: 'lockheedmartin.com',
  XOM: 'exxonmobil.com',
  CVX: 'chevron.com',

  // Argentina & Latam
  MELI: 'mercadolibre.com',
  YPF: 'ypf.com',
  GGAL: 'galicia.ar',
  BMA: 'macro.com.ar',
  PAM: 'pampa.com',
  TGS: 'tgs.com.ar',
  CRESY: 'cresud.com.ar',
  LOMA: 'lomanegra.com',
  SUPV: 'supervielle.com.ar',
  EDN: 'edenor.com',
  TEO: 'telecom.com.ar',
  DESP: 'despegar.com',
  BIOX: 'biocerescrops.com',
  GLOB: 'globant.com',
  VIST: 'vistaenergy.com',
  PBR: 'petrobras.com.br',
  VALE: 'vale.com',
  BBD: 'banco.bradesco',

  // ETFs
  SPY: 'ssga.com',
  QQQ: 'invesco.com',
  DIA: 'ssga.com',
  IWM: 'ishares.com',
  EEM: 'ishares.com',
  XLE: 'ssga.com',
  XLF: 'ssga.com',
  ARGT: 'globalxetfs.com',
  EWZ: 'ishares.com',
  EWP: 'ishares.com',
  VGK: 'vanguard.com',
  FXI: 'ishares.com',
  EWJ: 'ishares.com',
  EWW: 'ishares.com',
  INDA: 'ishares.com',
  EWG: 'ishares.com',
};

const COMMODITY_ICONS: Record<string, { label: string; bg: string }> = {
  'GC=F': { label: '🪙', bg: 'bg-amber-500/20 text-amber-300' },
  'SI=F': { label: '🥈', bg: 'bg-slate-400/20 text-slate-200' },
  'CL=F': { label: '🛢️', bg: 'bg-stone-600/30 text-stone-200' },
  'NG=F': { label: '🔥', bg: 'bg-orange-500/20 text-orange-400' },
  'ZS=F': { label: '🌱', bg: 'bg-emerald-500/20 text-emerald-400' },
  'HG=F': { label: '🧱', bg: 'bg-amber-700/20 text-amber-500' },
};

const CRYPTO_COINS = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'PEPE', 'SHIB', 'TRUMP', 'WIF', 'BONK'
]);

const BRAND_COLORS: Record<string, string> = {
  AAPL: 'bg-zinc-700 text-white',
  MSFT: 'bg-sky-600 text-white',
  NVDA: 'bg-emerald-600 text-white',
  AMZN: 'bg-amber-600 text-white',
  GOOGL: 'bg-red-500 text-white',
  META: 'bg-blue-600 text-white',
  TSLA: 'bg-rose-600 text-white',
  MELI: 'bg-yellow-400 text-black',
  YPF: 'bg-blue-700 text-white',
  GGAL: 'bg-orange-600 text-white',
  KO: 'bg-red-600 text-white',
  BTC: 'bg-amber-500 text-black',
  ETH: 'bg-indigo-600 text-white',
  SOL: 'bg-purple-600 text-white',
};

interface AssetIconProps {
  symbol?: string;
  name?: string;
  type?: AssetType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetIcon = ({
  symbol = '',
  name,
  type,
  size = 'sm',
  className = '',
}: AssetIconProps) => {
  const [imgError, setImgError] = useState(false);

  const clean = (symbol || name || '').toUpperCase().trim();
  const baseCrypto = clean.replace(/USDT$/, '');

  const dimensions = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-[11px]',
    lg: 'w-8 h-8 text-[13px]',
  }[size];

  // 1. Commodities especiales
  if (COMMODITY_ICONS[clean]) {
    const item = COMMODITY_ICONS[clean];
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 font-sans select-none ${dimensions} ${item.bg} ${className}`}
      >
        {item.label}
      </span>
    );
  }

  // 2. Bonos soberanos argentinos (AL30, GD30, etc.)
  if (['AL30', 'GD30', 'AL35', 'GD35', 'AE38', 'GD38', 'AL29', 'GD29', 'AL41', 'GD41'].includes(clean)) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden border border-line ${dimensions} ${className}`}
        title="Bono Soberano Argentino"
      >
        <img
          src="https://hatscripts.github.io/circle-flags/flags/ar.svg"
          alt="Bandera Argentina"
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  // 3. Índices bursátiles (^GSPC, ^IXIC, ^DJI)
  if (clean === '^GSPC' || clean === 'SP500') {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden border border-line ${dimensions} ${className}`}
        title="S&P 500 (EE.UU.)"
      >
        <img
          src="https://hatscripts.github.io/circle-flags/flags/us.svg"
          alt="EE.UU."
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  // 4. Criptomonedas (CoinCap / Crypto CDN)
  const isCrypto = type === 'crypto' || CRYPTO_COINS.has(baseCrypto);
  if (isCrypto && !imgError) {
    const iconUrl = `https://assets.coincap.io/assets/icons/${baseCrypto.toLowerCase()}@2x.png`;
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden bg-bg2 border border-line ${dimensions} ${className}`}
      >
        <img
          src={iconUrl}
          alt={baseCrypto}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
        />
      </span>
    );
  }

  // 5. Acciones / ETFs / CEDEARs (Google Favicon CDN)
  const domain = DOMAIN_MAP[clean];
  if (domain && !imgError) {
    const faviconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`;
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden bg-white/5 border border-line/70 p-0.5 ${dimensions} ${className}`}
      >
        <img
          src={faviconUrl}
          alt={clean}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain rounded-full"
          loading="lazy"
        />
      </span>
    );
  }

  // 6. Monograma de Respaldo (Fallback garantizado con iniciales)
  const fallbackColor = BRAND_COLORS[clean] || 'bg-bg2 border border-line text-gold';
  const label = clean.replace(/[^A-Z0-9]/g, '').slice(0, 3) || '—';

  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 font-mono font-bold select-none uppercase ${dimensions} ${fallbackColor} ${className}`}
    >
      {label}
    </span>
  );
};
