export function formatPrice(price?: number | null): string {
  if (price == null || !Number.isFinite(price)) return '—';
  if (price >= 1) return price.toLocaleString('es-AR', { maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
}

export function formatPercent(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatVolume(vol?: number | null): string {
  if (vol == null || !Number.isFinite(vol) || vol <= 0) return '—';
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}
