const make = (min: number, max = min) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: 'always', // fuerza el punto de miles también en 4 dígitos (ej. $2.119,12)
  });

const f2 = make(2);
const f3 = make(3);
const f4 = make(4);

const ok = (n?: number | null): n is number => n != null && Number.isFinite(n);

function formatNumericValue(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';

  // Micro-precios cripto (< 0.001, ej: PEPE, SHIB, BONK: 0,0000123)
  if (abs > 0 && abs < 0.001) {
    const str = abs.toFixed(18);
    const match = str.match(/^0\.(0*)([1-9]\d*)/);
    if (match) {
      const leadingZeros = match[1];
      const decimals = Math.max(4, leadingZeros.length + 3);
      let rounded = abs.toFixed(decimals);
      while (
        rounded.endsWith('0') &&
        (rounded.split('.')[1]?.length || 0) > Math.max(4, leadingZeros.length + 1)
      ) {
        rounded = rounded.slice(0, -1);
      }
      return `${sign}${rounded.replace('.', ',')}`;
    }
  }

  const f = abs < 1 ? f4 : abs < 10 ? f3 : f2;
  return `${sign}${f.format(abs)}`;
}

export const fmtPrice = (n?: number | null, cur = '$'): string => {
  if (!ok(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  return `${sign}${cur}${formatNumericValue(abs)}`;
};

export const fmtPct = (n?: number | null, withArrow = false): string => {
  if (!ok(n)) return '—';
  const arrow = withArrow ? (n > 0 ? '▲ ' : n < 0 ? '▼ ' : '') : '';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${arrow}${sign}${f2.format(Math.abs(n))}%`;
};

export const fmtCompact = (n?: number | null): string =>
  !ok(n)
    ? '—'
    : new Intl.NumberFormat('es-AR', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n);

// Helpers compatibles con componentes existentes (unificados con fmtPrice / fmtPct / fmtCompact)
export function formatPrice(price?: number | null): string {
  if (!ok(price)) return '—';
  return formatNumericValue(price);
}

export function formatPercent(value?: number | null, withArrow = false): string {
  return fmtPct(value, withArrow);
}

export function formatVolume(vol?: number | null): string {
  if (!ok(vol) || vol <= 0) return '—';
  if (vol >= 1_000_000_000_000) return `$${f2.format(vol / 1_000_000_000_000)}T`;
  if (vol >= 1_000_000_000) return `$${make(1).format(vol / 1_000_000_000)}B`;
  if (vol >= 1_000_000) return `$${make(1).format(vol / 1_000_000)}M`;
  if (vol >= 1_000) return `$${make(1).format(vol / 1_000)}K`;
  return `$${make(0).format(vol)}`;
}

export function formatCompactNumber(val?: number | null): string {
  if (!ok(val)) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '−' : '';
  if (abs >= 1_000_000_000_000) return `${sign}$${f2.format(abs / 1_000_000_000_000)}T`;
  if (abs >= 1_000_000_000) return `${sign}$${f2.format(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}$${make(1).format(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}$${make(0).format(abs / 1_000)}K`;
  return `${sign}$${f2.format(abs)}`;
}
