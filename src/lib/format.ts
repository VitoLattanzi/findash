export function formatPrice(price?: number | null): string {
  if (price == null || !Number.isFinite(price)) return '—';
  if (price === 0) return '0,00';

  const abs = Math.abs(price);
  const sign = price < 0 ? '-' : '';

  if (abs >= 1) {
    return `${sign}${abs.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Para valores < 1 (ej. altcoins, memecoins: 0,0000123...)
  // Corta en el tercer dígito a partir del primer no-cero preservando los ceros iniciales
  const str = abs.toFixed(18);
  const match = str.match(/^0\.(0*)([1-9]\d*)/);
  if (!match) {
    return `${sign}${abs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const leadingZeros = match[1];
  const decimals = Math.max(2, leadingZeros.length + 3);
  let rounded = abs.toFixed(decimals);

  // Evita ceros superfluos al final en números con pocos decimales (ej. 0.500 -> 0.50)
  while (rounded.endsWith('0') && (rounded.split('.')[1]?.length || 0) > Math.max(2, leadingZeros.length + 1)) {
    rounded = rounded.slice(0, -1);
  }

  return `${sign}${rounded.replace('.', ',')}`;
}

export function formatPercent(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatVolume(vol?: number | null): string {
  if (vol == null || !Number.isFinite(vol) || vol <= 0) return '—';
  if (vol >= 1_000_000_000_000) return `$${(vol / 1_000_000_000_000).toFixed(2)}T`;
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

export function formatCompactNumber(val?: number | null): string {
  if (val == null || !Number.isFinite(val)) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}
