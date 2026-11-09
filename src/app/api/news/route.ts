import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { classifyFinancialSentiment } from '@/components/common/SentimentChip';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; FinDashBot/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
});

const gnews = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=es-419&gl=AR&ceid=AR:es-419`;

const FEEDS: Record<string, string[]> = {
  macro: [gnews('economía Argentina'), 'https://www.ambito.com/rss/economia.xml'],
  politica: [gnews('política Argentina'), 'https://www.ambito.com/rss/politica.xml'],
  fintech: [gnews('fintech Argentina'), 'https://www.ipro-up.com/rss'],
  ia: [gnews('inteligencia artificial')],
  cripto: [
    gnews('Binance portal noticias criptomonedas'),
    gnews('bitcoin criptomonedas'),
    'https://cointelegraph.com/rss/tag/binance',
    'https://cointelegraph.com/rss/tag/bitcoin',
  ],
  bolsa: [
    gnews('Wall Street S&P 500 Nasdaq acciones mercados'),
    gnews('Jerome Powell Reserva Federal Fed tasas interés declaraciones'),
    gnews('balance trimestral ganancias ingresos acciones Apple Nvidia Microsoft Tesla'),
    gnews('oro petróleo commodities ADRs acciones argentinas YPF MercadoLibre'),
    'https://www.ambito.com/rss/finanzas.xml',
  ],
};

const CATEGORIES = Object.keys(FEEDS);

// Patrones de relleno diario genérico que debemos descartar del feed
const FILLER_PATTERNS = [
  'minuto a minuto',
  'finanzas al día',
  'novedades de bancos',
  'a cuánto cotiza este',
  'a cuánto opera este',
  'quiniela',
  'horóscopo',
  'feriado',
  'pronóstico del tiempo',
];

function isFillerHeadline(title: string): boolean {
  const t = title.toLowerCase();
  return FILLER_PATTERNS.some((p) => t.includes(p));
}

function splitGoogleTitle(title: string): { title: string; source: string } {
  const idx = title.lastIndexOf(' - ');
  if (idx > 20) {
    return { title: title.slice(0, idx).trim(), source: title.slice(idx + 3).trim() };
  }
  return { title: title.trim(), source: 'Google News' };
}

function normalizeSourceName(rawSource: string, feedUrl: string): string {
  const s = (rawSource || '').trim();
  const lower = s.toLowerCase();

  if (feedUrl.includes('ambito.com') || lower === 'finanzas' || lower === 'economía' || lower === 'economia' || lower === 'política') {
    return 'Ámbito';
  }
  if (feedUrl.includes('ipro-up.com') || lower.includes('iproup')) {
    return 'iProUP';
  }
  if (feedUrl.includes('cointelegraph.com') || lower.includes('cointelegraph')) {
    return 'Cointelegraph';
  }
  // Evita "Finanzas · Finanzas" si el origen viene duplicado con separadores
  const parts = s.split(/[·•|-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
    return parts[0];
  }
  return s || 'Mercados';
}

function normalizeTitleFingerprint(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 7)
    .join(' ');
}

async function fetchBinanceOfficialAnnouncements(): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/cms/article/catalog/list/query?catalogId=48&pageNo=1&pageSize=12',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const json = await res.json();
    const articles = json?.data?.articles || json?.data?.catalogs?.[0]?.articles || [];
    if (!Array.isArray(articles)) return [];

    return articles.map((a: any) => ({
      title: a.title,
      link: `https://www.binance.com/es/support/announcement/${a.code}`,
      pubDate: a.releaseDate ? new Date(a.releaseDate).toISOString() : new Date().toISOString(),
      source: 'Binance Portal',
      category: 'cripto',
      sentiment: classifyFinancialSentiment(a.title),
      isBinance: true,
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get('category') || 'todas';
  const categories = CATEGORIES.includes(requested) ? [requested] : CATEGORIES;

  const rssJobs = categories.flatMap((cat) =>
    FEEDS[cat].map(async (url) => {
      const feed = await parser.parseURL(url);
      return (feed.items ?? [])
        .filter((item) => item.title && item.link)
        .map((item) => {
          const isGoogle = url.includes('news.google.com');
          const parsed = isGoogle ? splitGoogleTitle(item.title as string) : null;
          const title = (parsed?.title ?? (item.title as string)).trim();
          const rawSource =
            parsed?.source ??
            (typeof item.creator === 'string' ? item.creator : feed.title) ??
            'RSS';
          const cleanSource = normalizeSourceName(rawSource, url);
          const isBinance =
            cleanSource.toLowerCase().includes('binance') ||
            title.toLowerCase().includes('binance') ||
            item.link?.includes('binance.com');

          return {
            title,
            link: item.link as string,
            pubDate: item.pubDate ?? item.isoDate ?? '',
            source: isBinance ? 'Binance News' : cleanSource,
            category: cat,
            sentiment: classifyFinancialSentiment(title),
            isBinance,
          };
        })
        .filter((item) => !isFillerHeadline(item.title));
    })
  );

  // Si piden 'cripto' o 'todas', consultamos también el portal oficial de Binance
  const shouldFetchBinance = requested === 'cripto' || requested === 'todas';
  const binanceJob = shouldFetchBinance ? fetchBinanceOfficialAnnouncements() : Promise.resolve([]);

  const settled = await Promise.allSettled([...rssJobs, binanceJob]);
  const items = settled
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  const seenLinks = new Set<string>();
  const seenFingerprints = new Set<string>();

  const unique = items.filter((n: { link: string; title: string }) => {
    if (!n?.link || !n?.title || seenLinks.has(n.link)) return false;
    const fp = normalizeTitleFingerprint(n.title);
    if (fp.length > 10 && seenFingerprints.has(fp)) return false;
    seenLinks.add(n.link);
    if (fp.length > 10) seenFingerprints.add(fp);
    return true;
  });

  unique.sort(
    (a: { pubDate: string }, b: { pubDate: string }) =>
      new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
  );

  return NextResponse.json(unique);
}
