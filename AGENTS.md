<!-- BEGIN:nextjs-agent-rules -->

opencode -s ses_e869823a5ffeLILvGoHtWUqFdt

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Directrices para Agentes de FinDash 🤖

## Descripción del Proyecto
FinDash es una terminal financiera desktop-first (con soporte móvil adaptativo) desarrollada en Next.js (App Router), TypeScript y Tailwind CSS v4. Funciona 100% con fuentes de datos públicas sin requerir claves de API.

## Pautas Críticas de Desarrollo

1. **Lightweight Charts (v5)**:
   - Utilizar siempre `chart.addSeries(AreaSeries, options)` o `chart.addSeries(CandlestickSeries, options)`.
   - **Nunca** invocar métodos descontinuados de v4 como `addAreaSeries` o `addCandlestickSeries`, ya que lanzan `TypeError` en tiempo de ejecución.

2. **Fuentes de Datos y Route Handlers**:
   - El cliente nunca debe consultar a Yahoo Finance directamente debido a restricciones de CORS. Usar el proxy interno `GET /api/market`.
   - Los datos cripto en tiempo real usan Binance WebSocket (`useBinanceWebSocket.ts`) con fallback automático a `wss://data-stream.binance.vision`.
   - Consultar [`docs/FUENTES-DE-DATOS.md`](docs/FUENTES-DE-DATOS.md) para detalles completos de endpoints, caché y rate limits.

3. **Diseño Responsivo y Mobile-First**:
   - En mobile (`< 768px`), el sidebar de navegación se oculta y se activa una barra de navegación inferior fija (`fixed bottom-0`).
   - Evitar contenedores con anchos rígidos (`min-w-[340px]` o similares). Emplear `w-full` y `min-w-0`.
   - Usar `100svh` / `100dvh` para alturas de pantalla para respetar las barras de herramientas de navegadores móviles.
   - Mantener el tamaño de fuente en inputs/selects de al menos `16px` en vista móvil para prevenir el zoom involuntario en iOS.

4. **Persistencia Local**:
   - El almacenamiento de preferencias de usuario y datos de portafolio se gestiona a través de `localStorage` con las claves:
     - `findash_pinned`: Lista de activos fijados en el dashboard.
     - `findash_countries`: Selección de países/ETFs.
     - `findash_cartera`: Portafolio y transacciones de tenencias personales.
