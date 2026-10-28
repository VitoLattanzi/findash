import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export interface SearchResultItem {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf' | 'index' | 'bond';
  exchange?: string;
  price?: number | null;
  change?: number | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  try {
    const raw: any = await yahooFinance.search(q, {
      newsCount: 0,
      quotesCount: 12,
    });

    const quotes: any[] = Array.isArray(raw?.quotes) ? raw.quotes : [];

    // Filtramos y normalizamos los resultados
    const validQuotes = quotes.filter(
      (item) =>
        item &&
        item.symbol &&
        (item.isYahooFinance !== false || item.quoteType)
    );

    // Mapeamos los resultados
    const results: SearchResultItem[] = validQuotes.map((item) => {
      let type: SearchResultItem['type'] = 'stock';
      const qt = (item.quoteType || '').toUpperCase();

      if (qt === 'CRYPTOCURRENCY') type = 'crypto';
      else if (qt === 'ETF' || qt === 'MUTUALFUND') type = 'etf';
      else if (qt === 'INDEX') type = 'index';
      else if (item.symbol.includes('=F') || item.symbol.startsWith('^')) type = 'index';

      const displayName = item.shortname || item.longname || item.name || item.symbol;

      return {
        symbol: item.symbol,
        name: displayName,
        type,
        exchange: item.exchange || item.exchDisp || undefined,
      };
    });

    // Para los primeros 8 resultados, intentamos traer precio y variación rápida
    const topSymbols = results.slice(0, 8).map((r) => r.symbol);
    if (topSymbols.length > 0) {
      try {
        const quoteBatch: any = await yahooFinance.quote(topSymbols);
        const quotesArr = Array.isArray(quoteBatch) ? quoteBatch : [quoteBatch];
        const quoteMap = new Map<string, any>();
        for (const qItem of quotesArr) {
          if (qItem?.symbol) quoteMap.set(qItem.symbol, qItem);
        }

        for (const r of results) {
          const qData = quoteMap.get(r.symbol);
          if (qData) {
            r.price = typeof qData.regularMarketPrice === 'number' ? qData.regularMarketPrice : null;
            r.change =
              typeof qData.regularMarketChangePercent === 'number'
                ? qData.regularMarketChangePercent
                : null;
            if (qData.shortName && r.name === r.symbol) {
              r.name = qData.shortName;
            }
          }
        }
      } catch {
        // Si falla la consulta de precios no bloqueamos los resultados
      }
    }

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error en búsqueda' },
      { status: 500 }
    );
  }
}
