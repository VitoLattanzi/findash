import { NextResponse } from 'next/server';

export interface ArIndicatorsResponse {
  oficial: number | null;
  blue: number | null;
  mep: number | null;
  ccl: number | null;
  mayorista: number | null;
  brechaMep: number | null;
  brechaCcl: number | null;
  brechaBlue: number | null;
  dolares: {
    oficial: number | null;
    blue: number | null;
    mep: number | null;
    ccl: number | null;
    mayorista: number | null;
    brechaMep: number | null;
    brechaCcl: number | null;
    brechaBlue: number | null;
  };
  dolaresList: Array<{
    casa: string;
    nombre: string;
    compra: number;
    venta: number;
    fechaActualizacion?: string;
  }>;
  riesgoPais: number | null;
  inflacionMensual: number | null;
  updatedAt: string;
}

let cachedPayload: { ts: number; data: ArIndicatorsResponse } | null = null;
const CACHE_TTL_MS = 300_000; // 300s (5 minutos)

const getJson = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(url);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
};

export async function GET() {
  if (cachedPayload && Date.now() - cachedPayload.ts < CACHE_TTL_MS) {
    return NextResponse.json(cachedPayload.data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  }

  const [dolares, riesgo, inflacion] = await Promise.allSettled([
    getJson('https://dolarapi.com/v1/dolares'),
    getJson('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo'),
    getJson('https://api.argentinadatos.com/v1/finanzas/indices/inflacion'),
  ]);

  const dolaresList =
    dolares.status === 'fulfilled' && Array.isArray(dolares.value) ? dolares.value : [];

  const findVenta = (casa: string): number | null => {
    const found = dolaresList.find((d: any) => d?.casa === casa);
    return typeof found?.venta === 'number' && found.venta > 0 ? found.venta : null;
  };

  const oficial = findVenta('oficial');
  const mep = findVenta('bolsa');
  const ccl = findVenta('contadoconliqui');
  const blue = findVenta('blue');
  const mayorista = findVenta('mayorista');

  const brechaMep = oficial && mep ? (mep / oficial - 1) * 100 : null;
  const brechaCcl = oficial && ccl ? (ccl / oficial - 1) * 100 : null;
  const brechaBlue = oficial && blue ? (blue / oficial - 1) * 100 : null;

  const inflacionList =
    inflacion.status === 'fulfilled' && Array.isArray(inflacion.value) ? inflacion.value : [];
  const ultimaInflacion = inflacionList.length ? inflacionList[inflacionList.length - 1] : null;

  const payload: ArIndicatorsResponse = {
    oficial,
    blue,
    mep,
    ccl,
    mayorista,
    brechaMep,
    brechaCcl,
    brechaBlue,
    dolares: {
      oficial,
      blue,
      mep,
      ccl,
      mayorista,
      brechaMep,
      brechaCcl,
      brechaBlue,
    },
    dolaresList,
    riesgoPais:
      riesgo.status === 'fulfilled' && typeof riesgo.value?.valor === 'number'
        ? riesgo.value.valor
        : null,
    inflacionMensual:
      typeof ultimaInflacion?.valor === 'number' ? ultimaInflacion.valor : null,
    updatedAt: new Date().toISOString(),
  };

  cachedPayload = { ts: Date.now(), data: payload };

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
