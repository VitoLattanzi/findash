import { AssetType } from '@/types';

/**
 * Genera la URL directa al gráfico interactivo oficial de TradingView para cualquier activo
 * (Acciones de Wall Street, Cripto de Binance, Bonos argentinos de BCBA, Commodities e Índices).
 */
export function getTradingViewUrl(symbol?: string, type?: AssetType): string {
  if (!symbol) return 'https://www.tradingview.com';

  const clean = symbol.trim().toUpperCase();

  // Criptomonedas (vía Binance)
  if (
    type === 'crypto' ||
    ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'PEPE', 'SHIB', 'TRUMP', 'WIF', 'BONK'].includes(clean)
  ) {
    const pair = clean.endsWith('USDT') ? clean : `${clean}USDT`;
    return `https://www.tradingview.com/chart/?symbol=BINANCE:${pair}`;
  }

  // Commodities (Futuros)
  const commodityMap: Record<string, string> = {
    'GC=F': 'TVC:GOLD',
    'SI=F': 'TVC:SILVER',
    'CL=F': 'TVC:USOIL',
    'NG=F': 'NYMEX:NG1!',
    'ZS=F': 'CBOT:ZS1!',
    'HG=F': 'COMEX:HG1!',
  };
  if (commodityMap[clean]) {
    return `https://www.tradingview.com/chart/?symbol=${commodityMap[clean]}`;
  }

  // Índices bursátiles
  const indexMap: Record<string, string> = {
    '^GSPC': 'SP:SPX',
    '^IXIC': 'NASDAQ:IXIC',
    '^DJI': 'DJ:DJI',
    'TLT': 'NASDAQ:TLT',
    'IEF': 'NASDAQ:IEF',
  };
  if (indexMap[clean]) {
    return `https://www.tradingview.com/chart/?symbol=${indexMap[clean]}`;
  }

  // Bonos soberanos argentinos (BCBA / Bolsas y Mercados Argentinos)
  if (['AL30', 'GD30', 'AL35', 'GD35', 'AE38', 'GD38', 'AL29', 'GD29', 'AL41', 'GD41'].includes(clean)) {
    return `https://www.tradingview.com/chart/?symbol=BCBA:${clean}`;
  }

  // Acciones y ETFs (ej: AAPL, NVDA, SPY, MELI)
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(clean)}`;
}
