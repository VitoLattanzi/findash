# Fuentes de datos de FinDash

Todas las fuentes usadas son **públicas y gratuitas (sin API key)**. El navegador nunca llama directo a Yahoo Finance (bloquea por CORS); se pasa por Route Handlers de Next.js.

## 1. Cripto — Binance

| Dato | Endpoint | Uso |
| --- | --- | --- |
| Precios en vivo | `wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/...` | `useBinanceWebSocket` (Ticker, Cripto, Dashboard) |
| Host alternativo | `wss://data-stream.binance.vision/stream?streams=...` | Fallback automático si el host principal falla |
| Velas / historial | `GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=180` | Proxy interno `/api/klines` |

Notas:
- El stream combinado requiere el formato `/stream?streams=a@miniTicker/b@miniTicker` (el formato `/ws/a@miniTicker/b@miniTicker` **no** es válido y cierra la conexión).
- `/api/klines` devuelve `{ [SYMBOL]: [{ time, open, high, low, close }] }` y prueba `api.binance.com` y `data-api.binance.vision`.
- Pares usados: BTC, ETH, BNB, SOL, XRP, ADA, DOGE, PEPE, SHIB, TRUMP, WIF, BONK (todos contra USDT).

## 2. Acciones, ETFs, índices y commodities — Yahoo Finance

Proxy interno: `GET /api/market?tickers=AAPL,NVDA&spark=1`

- Librería: `yahoo-finance2` (server-side).
- `quote()` en lotes de 50 símbolos para traer precio, variación % y nombre.
- `chart()` (intervalo `1d`, ~120 días) cuando `spark=1` → devuelve `series` (`{ time, value }[]`) y `bars` (`number[]`) para los sparklines.
- Caché HTTP: `s-maxage=60, stale-while-revalidate=300`.

Universos incluidos en `src/lib/catalog.ts`:

| Grupo | Contenido |
| --- | --- |
| `sp500` | Top 100 del S&P 500 por capitalización (AAPL, MSFT, NVDA, AMZN, GOOGL, META, …) |
| `argentina` | ADRs argentinos: MELI, YPF, GGAL, PAM, BMA, TGS, CRESY, LOMA, SUPV, EDN, TEO, DESP, BIOX |
| `commodities` | `GC=F` oro, `SI=F` plata, `CL=F` WTI, `NG=F` gas, `ZS=F` soja, `HG=F` cobre |
| `crypto` | Los 12 pares listados arriba |

## 3. Noticias — RSS públicos

Proxy interno: `GET /api/news?category=todas|macro|fintech|ia|cripto`

- `rss-parser` con `Promise.allSettled` (si un feed cae, el resto sigue).
- Fuentes: Google News RSS (búsqueda por categoría en `es-419`/AR), Ámbito (`ambito.com/rss/economia.xml`), iProUP (`ipro-up.com/rss`), Cointelegraph (`cointelegraph.com/rss/tag/bitcoin`).
- Respuesta: `[{ title, link, pubDate, source, category }]`, deduplicada por link y ordenada por fecha.

## 4. Indicadores Argentina

Llamadas directas desde el cliente (CORS permitido):

- `https://dolarapi.com/v1/dolares` → oficial, blue, MEP (`bolsa`), CCL (`contadoconliqui`).
- `https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo` → último riesgo país.

## 5. Persistencia (localStorage)

| Clave | Contenido |
| --- | --- |
| `findash_pinned` | Activos fijados en el Dashboard (`{ symbol, label, type }`) |
| `findash_countries` | Países/ETFs del panel Países (`{ name, etf }`) |
| `findash_cartera` | Tenencias de Mi Cartera (`{ activo, cantidad, precio }`) |

## 6. Gráficos

- `lightweight-charts` **v5**: las series se crean con `chart.addSeries(AreaSeries | CandlestickSeries, options)`.
  Los helpers `addAreaSeries` / `addCandlestickSeries` fueron eliminados en v5 y provocan `TypeError` en runtime.
- Datos: cripto = velas reales de Binance; acciones/ETFs = cierres diarios de Yahoo (para velas se sintetiza OHLC con el cierre previo).

## 7. Límites y consideraciones

- Yahoo Finance no es oficial: puede limitar requests o cambiar campos. Por eso hay fallback a consultas individuales y caché.
- Binance puede bloquear regiones; de ahí el fallback a `data-stream.binance.vision`.
- Los sparklines de acciones se piden solo para activos fijados/países visibles, nunca para listas de 100, para evitar decenas de llamadas a Yahoo.
