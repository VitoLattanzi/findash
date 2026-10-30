export type ChangeTimeframe = '12h' | '24h' | '1sem' | '1mes' | '3meses';

export interface TimeframeOption {
  key: ChangeTimeframe;
  label: string;
  shortLabel: string;
  binanceInterval: string;
  binanceLimit: number;
}

export const CHANGE_TIMEFRAMES: TimeframeOption[] = [
  { key: '12h', label: '12h', shortLabel: '12h', binanceInterval: '30m', binanceLimit: 24 },
  { key: '24h', label: '24h', shortLabel: '24h', binanceInterval: '1h', binanceLimit: 24 },
  { key: '1sem', label: '1sem', shortLabel: '1sem', binanceInterval: '4h', binanceLimit: 42 },
  { key: '1mes', label: '1 mes', shortLabel: '1 mes', binanceInterval: '1d', binanceLimit: 30 },
  { key: '3meses', label: '3meses', shortLabel: '3meses', binanceInterval: '3d', binanceLimit: 30 },
];

export function getTimeframeOption(tf: ChangeTimeframe): TimeframeOption {
  return CHANGE_TIMEFRAMES.find((o) => o.key === tf) ?? CHANGE_TIMEFRAMES[1];
}
