import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

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
};

const CATEGORIES = Object.keys(FEEDS);

function splitGoogleTitle(title: string): { title: string; source: string } {
  const idx = title.lastIndexOf(' - ');
  if (idx > 20) {
    return { title: title.slice(0, idx), source: title.slice(idx + 3) };
  }
  return { title, source: 'Google News' };
}

function analyzeSentiment(title: string): 'positivo' | 'negativo' | 'neutral' {
  const t = title.toLowerCase();
  const positive = [
    'sube', 'gana', 'alcista', 'récord', 'ath', 'máximo', 'aprob', 'adopción',
    'listing', 'listado', 'nuevo', 'rally', 'dispara', 'impulsa', 'crece',
    'victoria', 'bull', 'supera', 'aumenta', 'ganancia', 'verde', 'repunta',
    'alianza', 'expande', 'inversión'
  ];
  const negative = [
    'cae', 'baja', 'desploma', 'pérdida', 'hack', 'robo', 'demanda', 'sec',
    'quiebra', 'colapso', 'alerta', 'miedo', 'estafa', 'investig', 'sanción',
    'bajista', 'bear', 'rojo', 'liquid', 'caída', 'retrocede', 'multa', 'fuga'
  ];
  let pos = 0;
  let neg = 0;
  for (const w of positive) if (t.includes(w)) pos++;
  for (const w of negative) if (t.includes(w)) neg++;
  if (pos > neg) return 'positivo';
  if (neg > pos) return 'negativo';
  return 'neutral';
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
      sentiment: analyzeSentiment(a.title),
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
          const title = parsed?.title ?? (item.title as string);
          const rawSource =
            parsed?.source ??
            (typeof item.creator === 'string' ? item.creator : feed.title) ??
            'RSS';
          const isBinance =
            rawSource.toLowerCase().includes('binance') ||
            title.toLowerCase().includes('binance') ||
            item.link?.includes('binance.com');

          return {
            title,
            link: item.link as string,
            pubDate: item.pubDate ?? item.isoDate ?? '',
            source: isBinance ? 'Binance News' : rawSource,
            category: cat,
            sentiment: analyzeSentiment(title),
            isBinance,
          };
        });
    })
  );

  // Si piden 'cripto' o 'todas', consultamos también el portal oficial de Binance
  const shouldFetchBinance = requested === 'cripto' || requested === 'todas';
  const binanceJob = shouldFetchBinance ? fetchBinanceOfficialAnnouncements() : Promise.resolve([]);

  const settled = await Promise.allSettled([...rssJobs, binanceJob]);
  const items = settled
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  const seen = new Set<string>();
  const unique = items.filter((n: { link: string }) => {
    if (!n?.link || seen.has(n.link)) return false;
    seen.add(n.link);
    return true;
  });

  unique.sort(
    (a: { pubDate: string }, b: { pubDate: string }) =>
      new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
  );

  return NextResponse.json(unique);
}
