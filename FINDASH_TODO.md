# FinDash — Roadmap Extendido & TODO (borrador para Antigravity)

> Este archivo **complementa** a `FINDASH_SPECS.md`. Ese archivo documenta lo ya implementado (Epics 1–7, sección Cripto cerrada en "10/10"). Este archivo es el punteo ordenado de las **próximas secciones**, listo para que Antigravity lo tome junto con el spec original y vaya marcando `[x]` a medida que avanza. Todavía es un punteo de diseño, no un prompt de implementación línea por línea — conviene confirmar alcance de cada Epic antes de generar código.

## 0. Contexto rápido para el agente
- **Identidad visual:** reusar la Sección 1 de `FINDASH_SPECS.md` — paleta `--bg #0c0f14`, `--bg2 #12161e`, `--card #161b25`, `--line #262d3b`, `--gold #d8ad3f`, `--teal #4fc7bd`, `--red #d9685f`; tipografía Fraunces (números/títulos) + IBM Plex Mono (datos/tablas/UI).
- **Patrón ya validado en Cripto (Epic 7)** que hay que repetir en Bolsa: layout 53/47, popover de temporalidades (12h/24h/1sem/1mes/3meses) con ordenamiento por columna, `<MarketHeatmap />` (treemap propio), toggle `[ Lista | Cards | Mapa ]`.
- **Objetivo general:** que "Bolsa & Materias Primas" quede al mismo nivel que Cripto.

## 1. Referencias de diseño — qué copiar y qué problema evitar

| Plataforma | Qué copiarle | Problema a evitar |
|---|---|---|
| **Fey** (fey.com) | Limpieza visual extrema; tarjetas de Próximos Balances / Valuación sin saturar la pantalla | Cerrada y paga (US$30/mes), solo acciones de EE.UU. → nosotros sumamos commodities, bonos y emergentes gratis |
| **Koyfin** (koyfin.com) | Snapshot de mercado: índices + sectores + bonos del Tesoro + commodities en una sola pantalla | Sobrecarga cognitiva (tabs chicas, tablas apretadas), funciones bloqueadas en el free → mantenemos la jerarquía limpia que ya logramos en Cripto |
| **Finviz** (finviz.com/map.ashx) **/ TradingView Heatmaps** | Mapa de calor agrupado por sector/rubro, lectura del mercado de un vistazo | Finviz: estética vieja, banners invasivos. TradingView: hay que abrir varios menús para pasar del heatmap a precios/calendario → lo embebemos todo en un panel sin ads |
| **Robinhood Legend** | Píldoras de filtro rápido (Mag 7, Semiconductores, Dividendos, Energía); indicador Pre/After-Market con circulito de color | Esconde fundamentales (deuda, PER, flujo de caja) para favorecer el trading impulsivo → nosotros abrimos el `<DetailPanel/>` completo al tocar el activo |
| **Public.com / Quartr** (quartr.com) | Calendario de balances con logo de empresa, BMO/AMC, resultado real vs. esperado | App separada del panel de cotizaciones → lo fusionamos directo en la sección de Noticias |
| **IOL / Balanz / PPI** (brokers locales) | Instrumentos que sigue el inversor argentino: CEDEARs, bonos soberanos (AL30/GD30), Lecaps, ONs | Interfaces lentas, tablas que no actualizan sin F5, sin gráficos en la fila, sin contexto internacional |

## 2. Epic 8 — Sección Bolsa & Materias Primas

**Bloque superior — "El Mercado en Vivo"**
- [x] Izquierda (53%): `<TradingViewStockHeatmap />` adaptado a S&P 500 agrupado por rubro (Tecnología, Finanzas, Salud, Energía, Consumo, Industrial) con modo Pantalla Completa.
- [x] Derecha (47%): Panel "Principales Acciones & Conjuntos (S&P 500)" con scroll interno (`h-[580px]`), píldoras rápidas (`Todas`, `Mag 7 & IA`, `Finanzas`, `Consumo & Salud`, `Energía & Ind.`), popover de temporalidad (`12h` a `3meses`), ordenamiento y búsqueda global Yahoo Finance.

**Bloque inferior — "Mercados Estratégicos & Inteligencia de Bolsa"**
- [x] Izquierda (53%): Panel Triple en 3 columnas paralelas simultáneas (`Oro & Materias Primas` | `Mercado Global` | `Argentina ADRs`) con barra de ordenamiento y temporalidad compartida.
- [x] Derecha (47%): `<BolsaNewsCard />` ("Noticias, Lanzamientos & Habló X Persona") con clasificación automática (`Habló Fed / Líderes`, `Balances & Lanzamientos`, `Mercados`) y sentimiento.

## 3. Epic 9 — Noticias + Calendario Financiero (estilo Quartr)
- [ ] Fusionar `<NewsFeed />` con un calendario de eventos financieros en el mismo panel.
- [ ] Tarjeta de evento estilo Quartr: logo de la empresa, trimestre (ej. "Q3 2026"), fecha exacta, etiqueta Premarket / horario de transmisión, resumen ultra corto de la conferencia o los resultados.
- [ ] Dividir en dos bloques: **"Latest events"** (reportes pasados / resúmenes) y **"Upcoming events"** (próximos lanzamientos y balances).

## 4. Epic 10 — Dashboard General Modular (estilo Koyfin + Robinhood)
- [ ] Vista resumen estilo Koyfin: índices globales, bonos, materias primas y sectores en un solo vistazo, sin sobrecarga cognitiva.
- [ ] Paneles ajustables estilo Robinhood: el usuario puede agregar, quitar, arrastrar y reordenar widgets a gusto.
- [ ] Arranca como banco de pruebas en el Dashboard principal; queda preparado para extenderse después a Cripto/Bolsa/Países.
- [ ] Persistencia de la configuración de widgets por usuario (mismo patrón localStorage que las listas personalizadas de Cripto).

## 5. Epic 11 — Mapas de Calor Avanzados (estilo Finviz) — Futuro
- [ ] Sección dedicada "Heatmaps Globales" con filtros laterales por mercado: S&P 500, Dow Jones, Nasdaq, World, ETFs, Crypto, Futures.
- [ ] Modos de visualización configurables: Map, Bubbles, Matrix.
- [ ] Criterio de tamaño a elección: Market Cap vs. Equal (reutiliza el `sizeBy` ya implementado en `<MarketHeatmap />`).

## 6. Epic 12 — SEO & Metadata
- [ ] Reemplazar el `<title>` genérico ("FinDash") por uno descriptivo con keywords: ej. "FinDash — Terminal financiera en tiempo real: Cripto, Acciones y CEDEARs".
- [ ] Meta description por vista/ruta (hoy hay una sola genérica para toda la app) usando la Metadata API de Next.js (`generateMetadata` o `export const metadata`).
- [ ] Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) y Twitter Card (`twitter:card`, `twitter:title`, `twitter:image`) para que el link se vea bien al compartirlo.
- [ ] `robots.txt` y `sitemap.xml` (Next.js los genera solo con `app/robots.ts` y `app/sitemap.ts`).
- [ ] `canonical` URL por ruta para evitar contenido duplicado.
- [ ] Datos estructurados (JSON-LD, schema `WebApplication` o `FinancialProduct`) para que Google entienda qué es FinDash.
- [ ] Revisar Core Web Vitals (LCP/CLS/INP): el estado "Cargando..." inicial en varias secciones puede estar penalizando el LCP — evaluar skeleton loaders en vez de texto plano.
- [ ] Auditar que todas las imágenes (favicons, íconos de criptomonedas, logos de empresas) tengan `alt` descriptivo en todas las vistas, no solo en Activos Fijados.

## 7. Notas para Antigravity
- Epic 8 es la prioridad inmediata; Epic 10 y Epic 11 están marcados como "futuro" en el punteo original — no asumir que entran en el primer sprint.
- Antes de crear endpoints nuevos, revisar si `/api/market`, `/api/klines`, `/api/news` o `/api/search` ya cubren el dato necesario.
- Todo lo de este archivo es punteo de diseño; confirmar alcance exacto de cada ítem con Vito antes de generar código.
