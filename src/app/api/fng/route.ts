import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      next: { revalidate: 900 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('bad status');
    const json: any = await res.json();
    const item = json?.data?.[0];
    const value = Number(item?.value);
    if (!Number.isFinite(value)) throw new Error('bad payload');

    return NextResponse.json(
      {
        value,
        classification: item?.value_classification ?? '',
        updatedAt: item?.timestamp ? Number(item.timestamp) * 1000 : null,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } }
    );
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el índice' }, { status: 502 });
  }
}
