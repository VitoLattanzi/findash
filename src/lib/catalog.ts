export type AssetType = 'crypto' | 'stock';

export interface CatalogItem {
  symbol: string;
  label: string;
  type: AssetType;
  group: 'sp500' | 'argentina' | 'commodities' | 'crypto';
}

export interface PinnedAsset {
  symbol: string;
  label: string;
  type: AssetType;
}

const sp500Symbols = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'GOOG', 'META', 'BRK-B', 'AVGO', 'TSLA',
  'LLY', 'JPM', 'V', 'UNH', 'XOM', 'MA', 'JNJ', 'PG', 'HD', 'COST',
  'ABBV', 'WMT', 'NFLX', 'MRK', 'KO', 'PEP', 'AMD', 'CRM', 'ORCL', 'ADBE',
  'CVX', 'BAC', 'TMO', 'CSCO', 'ACN', 'ABT', 'LIN', 'MCD', 'WFC', 'QCOM',
  'INTU', 'IBM', 'CAT', 'GE', 'AMAT', 'VZ', 'DIS', 'NOW', 'ISRG', 'TXN',
  'PM', 'RTX', 'NEE', 'SPGI', 'UBER', 'PGR', 'UNP', 'LOW', 'HON', 'BKNG',
  'T', 'COP', 'ELV', 'SYK', 'PLD', 'BLK', 'TJX', 'VRTX', 'C', 'MU',
  'ADP', 'LRCX', 'MDLZ', 'CB', 'SBUX', 'AMGN', 'GILD', 'ADI', 'ETN', 'BSX',
  'REGN', 'PANW', 'KLAC', 'SO', 'DUK', 'PFE', 'BA', 'MDT', 'SCHW', 'CI',
  'BMY', 'EQIX', 'PLTR', 'DE', 'APH', 'LMT', 'ADSK', 'MELI', 'SNOW', 'CRWD',
];

const argentinaSymbols = [
  'MELI', 'YPF', 'GGAL', 'PAM', 'BMA', 'TGS', 'CRESY', 'LOMA', 'SUPV', 'EDN', 'TEO', 'DESP', 'BIOX',
];

const commoditySymbols = ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'ZS=F', 'HG=F'];

const cryptoList: Array<[string, string]> = [
  ['BTC', 'Bitcoin'],
  ['ETH', 'Ethereum'],
  ['BNB', 'BNB'],
  ['SOL', 'Solana'],
  ['XRP', 'XRP'],
  ['ADA', 'Cardano'],
  ['DOGE', 'Dogecoin'],
  ['PEPE', 'Pepe'],
  ['SHIB', 'Shiba Inu'],
  ['TRUMP', 'Official Trump'],
  ['WIF', 'dogwifhat'],
  ['BONK', 'Bonk'],
];

export const CATALOG: CatalogItem[] = [
  ...sp500Symbols.map((symbol) => ({ symbol, label: symbol, type: 'stock' as const, group: 'sp500' as const })),
  ...argentinaSymbols.map((symbol) => ({ symbol, label: symbol, type: 'stock' as const, group: 'argentina' as const })),
  ...commoditySymbols.map((symbol) => ({ symbol, label: symbol, type: 'stock' as const, group: 'commodities' as const })),
  ...cryptoList.map(([symbol, label]) => ({ symbol, label, type: 'crypto' as const, group: 'crypto' as const })),
];

export const CATALOG_GROUPS = [
  { key: 'crypto', title: 'Cripto' },
  { key: 'sp500', title: 'S&P 500' },
  { key: 'argentina', title: 'Argentina' },
  { key: 'commodities', title: 'Commodities' },
] as const;

export const SP500_TICKERS = sp500Symbols.join(',');
export const ARGENTINA_TICKERS = argentinaSymbols.join(',');
export const COMMODITY_TICKERS = commoditySymbols.join(',');

export const DEFAULT_PINNED: PinnedAsset[] = [
  { symbol: 'BTC', label: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', label: 'Ethereum', type: 'crypto' },
  { symbol: 'NVDA', label: 'NVDA', type: 'stock' },
  { symbol: 'AAPL', label: 'AAPL', type: 'stock' },
  { symbol: 'MELI', label: 'MELI', type: 'stock' },
  { symbol: 'YPF', label: 'YPF', type: 'stock' },
];

export const labelFor = (symbol: string): string =>
  CATALOG.find((c) => c.symbol === symbol)?.label ?? symbol;
