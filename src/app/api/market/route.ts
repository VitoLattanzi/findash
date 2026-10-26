import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers');

  if (!tickers) {
    return NextResponse.json({ error: 'El parámetro "tickers" es requerido (ej: ?tickers=AAPL,NVDA)' }, { status: 400 });
  }

  const tickerArray = tickers.split(',');

  try {
    const results = await Promise.all(
      tickerArray.map(async (ticker) => {
        const symbol = ticker.trim();
        try {
          const quote: any = await yahooFinance.quote(symbol);
          return {
            symbol,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChangePercent,
            name: quote.displayName || quote.shortName,
            currency: quote.currency,
            error: null
          };
        } catch (e) {
          return { symbol, data: null, error: `No se pudo obtener data para ${symbol}` };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno al consultar Yahoo Finance' }, { status: 500 });
  }
}
