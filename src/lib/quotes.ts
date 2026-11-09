import { ChangeTimeframe } from '@/lib/timeframe';
import type { UnifiedQuote } from '@/hooks/useQuotes';

export async function getQuotes(
  symbolsInput: string | string[],
  options: { timeframe?: ChangeTimeframe; withSpark?: boolean } = {}
): Promise<Record<string, UnifiedQuote>> {
  const { timeframe = '24h', withSpark = false } = options;
  const symbolsStr = Array.isArray(symbolsInput)
    ? Array.from(new Set(symbolsInput.map((s) => s.trim().toUpperCase()).filter(Boolean))).join(',')
    : symbolsInput.trim();

  if (!symbolsStr) return {};

  if (withSpark || timeframe !== '24h') {
    const res = await fetch(
      `/api/market?tickers=${encodeURIComponent(symbolsStr)}&timeframe=${encodeURIComponent(timeframe)}&spark=${withSpark ? '1' : '0'}`
    );
    if (!res.ok) throw new Error('Error consultando /api/market');
    const data = await res.json();
    if (!Array.isArray(data)) return {};

    const map: Record<string, UnifiedQuote> = {};
    for (const item of data) {
      if (!item?.symbol) continue;
      const hasPrice = typeof item.price === 'number' && Number.isFinite(item.price) && item.price > 0;
      const chg =
        hasPrice && typeof item.change === 'number' && Number.isFinite(item.change)
          ? item.change
          : null;
      map[item.symbol] = {
        symbol: item.symbol,
        name: item.name ?? item.symbol,
        price: hasPrice ? item.price : null,
        change: chg,
        changePct: chg,
        volume: typeof item.volume === 'number' ? item.volume : null,
        avgVolume: typeof item.avgVolume === 'number' ? item.avgVolume : null,
        marketCap: typeof item.marketCap === 'number' ? item.marketCap : null,
        marketState: item.marketState ?? 'CLOSED',
        preMarketPrice: item.preMarketPrice ?? null,
        preMarketChangePct: item.preMarketChange ?? null,
        postMarketPrice: item.postMarketPrice ?? null,
        postMarketChangePct: item.postMarketChange ?? null,
        bars: item.bars ?? null,
      };
    }
    return map;
  }

  const res = await fetch(`/api/quotes?s=${encodeURIComponent(symbolsStr)}`);
  if (!res.ok) throw new Error('Error consultando /api/quotes');
  const data = await res.json();
  if (!Array.isArray(data)) return {};

  const map: Record<string, UnifiedQuote> = {};
  for (const q of data) {
    if (!q?.symbol) continue;
    const hasPrice = typeof q.price === 'number' && Number.isFinite(q.price) && q.price > 0;
    const chg =
      hasPrice && typeof q.changePct === 'number' && Number.isFinite(q.changePct)
        ? q.changePct
        : null;
    map[q.symbol] = {
      symbol: q.symbol,
      name: q.name ?? q.symbol,
      price: hasPrice ? q.price : null,
      change: chg,
      changePct: chg,
      volume: typeof q.volume === 'number' ? q.volume : null,
      avgVolume: typeof q.avgVolume === 'number' ? q.avgVolume : null,
      marketCap: typeof q.marketCap === 'number' ? q.marketCap : null,
      marketState: q.marketState ?? 'CLOSED',
      preMarketPrice: q.preMarketPrice ?? null,
      preMarketChangePct: q.preMarketChangePct ?? null,
      postMarketPrice: q.postMarketPrice ?? null,
      postMarketChangePct: q.postMarketChangePct ?? null,
      ts: q.ts ?? null,
    };
  }
  return map;
}
