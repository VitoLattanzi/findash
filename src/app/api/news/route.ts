import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const FEEDS = {
  macro: 'https://www.ambito.com/rss/economia.xml',
  fintech: 'https://www.ipro-up.com/rss/fintech.xml',
  ia: 'https://news.google.com/rss/search?q=inteligencia+artificial&hl=es-419&gl=AR&ceid=AR:es-419',
  cripto: 'https://cointelegraph.com/rss/tag/bitcoin',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as keyof typeof FEEDS || 'todas';

  try {
    const categories = category === 'todas' ? Object.keys(FEEDS) : [category];
    const feeds = await Promise.all(
      categories.map(async (cat) => {
        const feed = await parser.parseURL(FEEDS[cat as keyof typeof FEEDS]);
        return feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: item.creator || 'RSS',
          category: cat
        }));
      })
    );

    return NextResponse.json(feeds.flat().sort((a, b) => new Date(b.pubDate || '').getTime() - new Date(a.pubDate || '').getTime()));
  } catch (error) {
    console.error('RSS Error:', error);
    return NextResponse.json({ error: 'Error al obtener noticias' }, { status: 500 });
  }
}
