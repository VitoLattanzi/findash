export interface Asset {
  name: string;
  price: number;
  change: number;
  open?: number;
  high?: number;
  low?: number;
  vol?: string;
  cap?: string;
  ath?: number;
  bars: number[];
}

export interface News {
  cat: "todas" | "macro" | "fintech" | "ia" | "cripto";
  text: string;
  src: string;
}

export interface Holding {
  activo: string;
  cantidad: number;
  precio: number;
}

export interface Country {
  name: string;
  etf: string;
  bars: number[];
}

export interface BinanceMiniTicker {
  s: string; // Symbol
  c: string; // Close price
  o: string; // Open price
}
