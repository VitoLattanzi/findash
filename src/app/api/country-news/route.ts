import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { classify, Sentiment } from '@/lib/sentiment';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; FinDashBot/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
});

export interface CountryNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment: Sentiment;
}

export interface CountryNews {
  pos: CountryNewsItem[];
  neg: CountryNewsItem[];
  neu: CountryNewsItem[];
}

const gnews = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=es-419&gl=AR&ceid=AR:es-419`;

function splitGoogleTitle(title: string): { title: string; source: string } {
  const idx = title.lastIndexOf(' - ');
  if (idx > 20) return { title: title.slice(0, idx), source: title.slice(idx + 3) };
  return { title, source: 'Google News' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('countries') ?? '';
  const countries = Array.from(
    new Set(
      raw
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    )
  ).slice(0, 12);

  if (countries.length === 0) {
    return NextResponse.json({ error: 'Parámetro "countries" requerido' }, { status: 400 });
  }

  const entries = await Promise.all(
    countries.map(async (country) => {
      try {
        const feed = await parser.parseURL(gnews(`${country} economía política`));
        const items: CountryNewsItem[] = (feed.items ?? [])
          .filter((i) => i.title && i.link)
          .slice(0, 24)
          .map((i) => {
            const parsed = splitGoogleTitle(i.title as string);
            return {
              title: parsed.title,
              link: i.link as string,
              pubDate: i.pubDate ?? i.isoDate ?? '',
              source: parsed.source,
              sentiment: classify(parsed.title),
            };
          });

        const sorted = items.sort(
          (a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
        );

        const result: CountryNews = {
          pos: sorted.filter((i) => i.sentiment === 'pos').slice(0, 4),
          neg: sorted.filter((i) => i.sentiment === 'neg').slice(0, 4),
          neu: sorted.filter((i) => i.sentiment === 'neu').slice(0, 4),
        };
        return [country, result] as const;
      } catch {
        return [country, { pos: [], neg: [], neu: [] }] as const;
      }
    })
  );

  return NextResponse.json(Object.fromEntries(entries), {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' },
  });
}
