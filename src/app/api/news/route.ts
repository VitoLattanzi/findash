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
  fintech: [gnews('fintech Argentina'), 'https://www.ipro-up.com/rss'],
  ia: [gnews('inteligencia artificial')],
  cripto: [gnews('bitcoin criptomonedas'), 'https://cointelegraph.com/rss/tag/bitcoin'],
};

const CATEGORIES = Object.keys(FEEDS);

function splitGoogleTitle(title: string): { title: string; source: string } {
  const idx = title.lastIndexOf(' - ');
  if (idx > 20) {
    return { title: title.slice(0, idx), source: title.slice(idx + 3) };
  }
  return { title, source: 'Google News' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get('category') || 'todas';
  const categories = CATEGORIES.includes(requested) ? [requested] : CATEGORIES;

  const jobs = categories.flatMap((cat) =>
    FEEDS[cat].map(async (url) => {
      const feed = await parser.parseURL(url);
      return (feed.items ?? [])
        .filter((item) => item.title && item.link)
        .map((item) => {
          const isGoogle = url.includes('news.google.com');
          const parsed = isGoogle ? splitGoogleTitle(item.title as string) : null;
          return {
            title: parsed?.title ?? (item.title as string),
            link: item.link as string,
            pubDate: item.pubDate ?? item.isoDate ?? '',
            source:
              parsed?.source ??
              (typeof item.creator === 'string' ? item.creator : feed.title) ??
              'RSS',
            category: cat,
          };
        });
    })
  );

  const settled = await Promise.allSettled(jobs);
  const items = settled
    .filter((r): r is PromiseFulfilledResult<ReturnType<typeof Object>[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  const seen = new Set<string>();
  const unique = items.filter((n: { link: string }) => {
    if (seen.has(n.link)) return false;
    seen.add(n.link);
    return true;
  });

  unique.sort(
    (a: { pubDate: string }, b: { pubDate: string }) =>
      new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
  );

  return NextResponse.json(unique);
}
