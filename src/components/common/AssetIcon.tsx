'use client';
import React, { useState } from 'react';
import { AssetType } from '@/types';

// Mapeo exhaustivo de dominios corporativos para las 100 del S&P 500, CEDEARs, ADRs y ETFs
const DOMAIN_MAP: Record<string, string> = {
  // S&P 500 Top 100
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  NVDA: 'nvidia.com',
  AMZN: 'amazon.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  META: 'meta.com',
  'BRK-B': 'berkshirehathaway.com',
  'BRK.B': 'berkshirehathaway.com',
  BRK: 'berkshirehathaway.com',
  AVGO: 'broadcom.com',
  TSLA: 'tesla.com',
  LLY: 'lilly.com',
  JPM: 'jpmorganchase.com',
  V: 'visa.com',
  UNH: 'unitedhealthgroup.com',
  XOM: 'exxonmobil.com',
  MA: 'mastercard.com',
  JNJ: 'jnj.com',
  PG: 'pg.com',
  HD: 'homedepot.com',
  COST: 'costco.com',
  ABBV: 'abbvie.com',
  WMT: 'walmart.com',
  NFLX: 'netflix.com',
  MRK: 'merck.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  AMD: 'amd.com',
  CRM: 'salesforce.com',
  ORCL: 'oracle.com',
  ADBE: 'adobe.com',
  CVX: 'chevron.com',
  BAC: 'bankofamerica.com',
  TMO: 'thermofisher.com',
  CSCO: 'cisco.com',
  ACN: 'accenture.com',
  ABT: 'abbott.com',
  LIN: 'linde.com',
  MCD: 'mcdonalds.com',
  WFC: 'wellsfargo.com',
  QCOM: 'qualcomm.com',
  INTU: 'intuit.com',
  IBM: 'ibm.com',
  CAT: 'caterpillar.com',
  GE: 'ge.com',
  AMAT: 'appliedmaterials.com',
  VZ: 'verizon.com',
  DIS: 'thewaltdisneycompany.com',
  NOW: 'servicenow.com',
  ISRG: 'intuitive.com',
  TXN: 'ti.com',
  PM: 'pmi.com',
  RTX: 'rtx.com',
  NEE: 'nexteraenergy.com',
  SPGI: 'spglobal.com',
  UBER: 'uber.com',
  PGR: 'progressive.com',
  UNP: 'up.com',
  LOW: 'lowes.com',
  HON: 'honeywell.com',
  BKNG: 'bookingholdings.com',
  T: 'att.com',
  COP: 'conocophillips.com',
  ELV: 'elevancehealth.com',
  SYK: 'stryker.com',
  PLD: 'prologis.com',
  BLK: 'blackrock.com',
  TJX: 'tjx.com',
  VRTX: 'vrtx.com',
  C: 'citigroup.com',
  MU: 'micron.com',
  ADP: 'adp.com',
  LRCX: 'lamresearch.com',
  MDLZ: 'mondelezinternational.com',
  CB: 'chubb.com',
  SBUX: 'starbucks.com',
  AMGN: 'amgen.com',
  GILD: 'gilead.com',
  ADI: 'analog.com',
  ETN: 'eaton.com',
  BSX: 'bostonscientific.com',
  REGN: 'regeneron.com',
  PANW: 'paloaltonetworks.com',
  KLAC: 'kla.com',
  SO: 'southerncompany.com',
  DUK: 'duke-energy.com',
  PFE: 'pfizer.com',
  BA: 'boeing.com',
  MDT: 'medtronic.com',
  SCHW: 'schwab.com',
  CI: 'thecignagroup.com',
  BMY: 'bms.com',
  EQIX: 'equinix.com',
  PLTR: 'palantir.com',
  DE: 'deere.com',
  APH: 'amphenol.com',
  LMT: 'lockheedmartin.com',
  ADSK: 'autodesk.com',
  SNOW: 'snowflake.com',
  CRWD: 'crowdstrike.com',
  NKE: 'nike.com',
  INTC: 'intel.com',

  // Argentina & ADRs
  MELI: 'mercadolibre.com',
  YPF: 'ypf.com',
  YPFD: 'ypf.com',
  GGAL: 'galicia.ar',
  BMA: 'macro.com.ar',
  PAM: 'pampa.com',
  TGS: 'tgs.com.ar',
  CRESY: 'cresud.com.ar',
  CRES: 'cresud.com.ar',
  LOMA: 'lomanegra.com',
  SUPV: 'supervielle.com.ar',
  EDN: 'edenor.com',
  TEO: 'telecom.com.ar',
  TECO2: 'telecom.com.ar',
  DESP: 'despegar.com',
  BIOX: 'biocerescrops.com',
  GLOB: 'globant.com',
  VIST: 'vistaenergy.com',
  ALUA: 'aluar.com.ar',
  TXAR: 'terniumargentina.com',
  BYMA: 'byma.com.ar',

  // Latam & Internacionales populares en CEDEARs
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

// Logos verificados de alta fidelidad para Criptomonedas (CoinGecko CDN)
const CRYPTO_LOGOS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  TRUMP: 'https://assets.coingecko.com/coins/images/31519/small/maga.png',
  WIF: 'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg',
  BONK: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
};

const COMMODITY_ICONS: Record<string, { label: string; bg: string }> = {
  'GC=F': { label: '🪙', bg: 'bg-amber-500/20 text-amber-300' },
  'SI=F': { label: '🥈', bg: 'bg-slate-400/20 text-slate-200' },
  'CL=F': { label: '🛢️', bg: 'bg-stone-600/30 text-stone-200' },
  'NG=F': { label: '🔥', bg: 'bg-orange-500/20 text-orange-400' },
  'ZS=F': { label: '🌱', bg: 'bg-emerald-500/20 text-emerald-400' },
  'HG=F': { label: '🧱', bg: 'bg-amber-700/20 text-amber-500' },
};

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

// Aliases para resolver si el input viene como nombre en vez de ticker
const NAME_ALIASES: Record<string, string> = {
  'BITCOIN': 'BTC',
  'ETHEREUM': 'ETH',
  'SOLANA': 'SOL',
  'BINANCE COIN': 'BNB',
  'DOGECOIN': 'DOGE',
  'CARDANO': 'ADA',
  'SHIBA INU': 'SHIB',
  'PEPE': 'PEPE',
  'OFFICIAL TRUMP': 'TRUMP',
  'DOGWIFHAT': 'WIF',
  'BONK': 'BONK',
  'S&P 500': '^GSPC',
  'NASDAQ COMPOSITE': '^IXIC',
  'DOW JONES': '^DJI',
  'ORO': 'GC=F',
  'PLATA': 'SI=F',
  'PETROLEO': 'CL=F',
  'PETRÓLEO': 'CL=F',
  'GAS NATURAL': 'NG=F',
  'SOJA': 'ZS=F',
  'COBRE': 'HG=F',
  'BONO 20Y USA': 'TLT',
  'BONO 7-10Y USA': 'IEF',
};

function normalizeSymbol(symbol?: string, name?: string): string {
  const s = (symbol || '').trim().toUpperCase();
  const n = (name || '').trim().toUpperCase();

  // 1. Quitar sufijo de mercado .BA o .US si existe (ej: AAPL.BA -> AAPL)
  const cleanS = s.replace(/\.BA$/, '').replace(/\.US$/, '');

  // 2. Revisar si coincide con algún alias de nombre
  if (NAME_ALIASES[cleanS]) return NAME_ALIASES[cleanS];
  if (NAME_ALIASES[n]) return NAME_ALIASES[n];

  // 3. Quitar sufijo USDT para criptomonedas (ej: BTCUSDT -> BTC)
  if (cleanS.endsWith('USDT') && cleanS.length > 4) {
    return cleanS.slice(0, -4);
  }

  return cleanS || n;
}

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

  const clean = normalizeSymbol(symbol, name);

  const dimensions = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-[11px]',
    lg: 'w-8 h-8 text-[13px]',
  }[size];

  // 1. Commodities especiales (Oro, Plata, Petróleo, etc.)
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

  // 3. Índices y Bonos del Tesoro de EE.UU. (^GSPC, ^IXIC, ^DJI, TLT, IEF)
  if (['^GSPC', '^IXIC', '^DJI', 'TLT', 'IEF'].includes(clean)) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden border border-line ${dimensions} ${className}`}
        title={clean}
      >
        <img
          src="https://hatscripts.github.io/circle-flags/flags/us.svg"
          alt="EE.UU."
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  // 4. Pares de Divisas FX (USD/ARS, USD/EUR, USD/BRL, etc.)
  const FX_FLAGS: Record<string, string> = {
    'USD/ARS': 'ar',
    'USD/BRL': 'br',
    'USD/EUR': 'eu',
    'USD/LIB': 'gb',
    'USD/GBP': 'gb',
    'USD/JPY': 'jp',
    'USD/CNY': 'cn',
  };
  if (FX_FLAGS[clean]) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden border border-line ${dimensions} ${className}`}
        title={clean}
      >
        <img
          src={`https://hatscripts.github.io/circle-flags/flags/${FX_FLAGS[clean]}.svg`}
          alt={clean}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  // 4. Criptomonedas (CoinCap CDN oficial con fallback garantizado)
  const isCrypto = type === 'crypto' || CRYPTO_LOGOS[clean] != null;
  if (isCrypto && !imgError) {
    const cryptoUrl = `https://assets.coincap.io/assets/icons/${clean.toLowerCase()}@2x.png`;
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden bg-bg2 border border-line ${dimensions} ${className}`}
      >
        <img
          src={cryptoUrl}
          alt={clean}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
        />
      </span>
    );
  }

  // 5. Acciones / ETFs / CEDEARs (Google Favicon CDN en resolución 128px)
  const domain = DOMAIN_MAP[clean];
  if (domain && !imgError) {
    const faviconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
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

  // 6. Monograma de Respaldo estilizado (Fallback garantizado con iniciales y color)
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
