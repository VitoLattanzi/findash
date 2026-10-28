import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export interface FundamentalData {
  symbol: string;
  name: string | null;
  profile: {
    description: string | null;
    ceo: string | null;
    sector: string | null;
    industry: string | null;
    website: string | null;
    country: string | null;
    city: string | null;
    employees: number | null;
  } | null;
  metrics: {
    eps: number | null; // Trailing EPS
    forwardEps: number | null;
    pe: number | null; // Trailing P/E
    forwardPe: number | null;
    marketCap: number | null;
    dividendYield: number | null; // en porcentaje (ej 0.015 -> 1.5%)
    targetPrice: number | null;
    targetHigh: number | null;
    targetLow: number | null;
    recommendation: string | null;
    freeCashFlow: number | null;
    operatingCashFlow: number | null;
    totalCash: number | null;
    totalDebt: number | null;
    debtToEquity: number | null;
    earningsDate: string | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim();

  if (!symbol) {
    return NextResponse.json({ error: 'Falta el parámetro "symbol"' }, { status: 400 });
  }

  try {
    const summary: any = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'assetProfile',
        'defaultKeyStatistics',
        'financialData',
        'summaryDetail',
        'calendarEvents',
      ],
    });

    if (!summary) {
      return NextResponse.json({ error: `Sin datos para ${symbol}` }, { status: 404 });
    }

    const ap = summary.assetProfile;
    const ks = summary.defaultKeyStatistics;
    const fd = summary.financialData;
    const sd = summary.summaryDetail;
    const ce = summary.calendarEvents;

    // Obtener nombre del CEO
    let ceoName: string | null = null;
    if (Array.isArray(ap?.companyOfficers) && ap.companyOfficers.length > 0) {
      const ceoOfficer = ap.companyOfficers.find(
        (o: any) =>
          typeof o?.title === 'string' &&
          (o.title.toLowerCase().includes('ceo') ||
            o.title.toLowerCase().includes('chief executive') ||
            o.title.toLowerCase().includes('director general'))
      );
      ceoName = (ceoOfficer?.name || ap.companyOfficers[0]?.name) ?? null;
    }

    // Próxima fecha de balance
    let earningsDateStr: string | null = null;
    if (ce?.earnings?.earningsDate && Array.isArray(ce.earnings.earningsDate) && ce.earnings.earningsDate.length > 0) {
      const rawDate = ce.earnings.earningsDate[0];
      try {
        earningsDateStr = new Date(rawDate).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        earningsDateStr = null;
      }
    }

    const dividendYieldPercent =
      typeof sd?.dividendYield === 'number'
        ? sd.dividendYield * 100
        : typeof sd?.trailingAnnualDividendYield === 'number'
        ? sd.trailingAnnualDividendYield * 100
        : null;

    const result: FundamentalData = {
      symbol,
      name: ap?.shortName || ap?.longName || null,
      profile: ap
        ? {
            description: ap.longBusinessSummary || null,
            ceo: ceoName,
            sector: ap.sector || null,
            industry: ap.industry || null,
            website: ap.website || null,
            country: ap.country || null,
            city: ap.city || null,
            employees: typeof ap.fullTimeEmployees === 'number' ? ap.fullTimeEmployees : null,
          }
        : null,
      metrics: {
        eps: typeof ks?.trailingEps === 'number' ? ks.trailingEps : null,
        forwardEps: typeof ks?.forwardEps === 'number' ? ks.forwardEps : null,
        pe: typeof sd?.trailingPE === 'number' ? sd.trailingPE : null,
        forwardPe: typeof sd?.forwardPE === 'number' ? sd.forwardPE : null,
        marketCap: typeof sd?.marketCap === 'number' ? sd.marketCap : null,
        dividendYield: dividendYieldPercent,
        targetPrice: typeof fd?.targetMeanPrice === 'number' ? fd.targetMeanPrice : null,
        targetHigh: typeof fd?.targetHighPrice === 'number' ? fd.targetHighPrice : null,
        targetLow: typeof fd?.targetLowPrice === 'number' ? fd.targetLowPrice : null,
        recommendation: fd?.recommendationKey || null,
        freeCashFlow: typeof fd?.freeCashflow === 'number' ? fd.freeCashflow : null,
        operatingCashFlow: typeof fd?.operatingCashflow === 'number' ? fd.operatingCashflow : null,
        totalCash: typeof fd?.totalCash === 'number' ? fd.totalCash : null,
        totalDebt: typeof fd?.totalDebt === 'number' ? fd.totalDebt : null,
        debtToEquity: typeof fd?.debtToEquity === 'number' ? fd.debtToEquity : null,
        earningsDate: earningsDateStr,
        fiftyTwoWeekHigh: typeof sd?.fiftyTwoWeekHigh === 'number' ? sd.fiftyTwoWeekHigh : null,
        fiftyTwoWeekLow: typeof sd?.fiftyTwoWeekLow === 'number' ? sd.fiftyTwoWeekLow : null,
      },
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error al obtener fundamentales de Yahoo Finance' },
      { status: 500 }
    );
  }
}
