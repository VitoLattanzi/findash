# FinDash — Master Specification & Roadmap (v1.6)

## 1. Identidad Visual y UI/UX (Estricto)
- **Regla de Oro:** Respetar la paleta oscura: `--bg: #0c0f14`, `--bg2: #12161e`, `--card: #161b25`, `--line: #262d3b`, `--gold: #d8ad3f`, `--teal: #4fc7bd`, `--red: #d9685f`.
- **Tipografía:** `Fraunces` para números/precios grandes y títulos. `IBM Plex Mono` para datos, tablas y UI general.
- **Estructura Base:** Ticker superior animado (loop) + Sidebar izquierdo fijo (220px) + Área central de Vistas + Detail Panel derecho deslizable (420px).

## 2. Roadmap de Desarrollo (El Agente DEBE marcar con [x] lo completado)

### Epic 1: Estructura Base y Conectividad (Data Core)
- [x] Configurar Next.js + Tailwind + TypeScript.
- [x] Implementar Ticker superior consumiendo `useBinanceWebSocket`.
- [x] Implementar Sidebar de navegación.
- [x] Implementar Dashboard base con componente `<AssetList />` y `<Sparkline />` SVG.
- [x] Crear Route Handler `/api/market` con `yahoo-finance2` (evita CORS).

### Epic 2: Panel de Detalle (DetailPanel) y Gráficos Avanzados
- [x] Construir `<DetailPanel />` deslizable (Drawer) al clickear activos.
- [x] Integrar `lightweight-charts` con tabs para alternar entre "Área" y "Velas", y selectores temporales (1D a 2A / ALL).
- [x] **Crosshair Tooltip:** Implementar `chart.subscribeCrosshairMove` para mostrar O, H, L, C, Vol y Fecha exactos al pasar el cursor sobre el gráfico.
- [x] **Pre/Post Market:** Modificar la cabecera del panel para mostrar el precio de pre-market o after-market en gris (`text-dim`) si el mercado está cerrado.
- [x] **Widget de Mercados Globales Dinámico:** Rotador inferior en Sidebar con estados en vivo (Verde = abierto, Amarillo = cierra pronto, Azul = abre pronto, Rojo = cerrado) para EE.UU., Argentina, Londres, Tokio, Hong Kong y Cripto 24/7 con hora local y selector.
- [x] **Menú Desplegable de Sentimiento Mundial:** Popover/modal interactivo al clickear el widget de mercados, mostrando si cada plaza cotiza **Alcista** (`TrendingUp`) o **Bajista** (`TrendingDown`) según su índice representativo (S&P 500, Merval, FTSE 100, Nikkei 225, Hang Seng, y el **Índice Top 10 Altcoins líderes por capitalización**: ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, LINK, DOT, NEAR) con barra de balance diario.

### Epic 3: Análisis Fundamental (Requerimientos de Pepo)
- [x] **Detail Modal Card:** Modal central espacioso tipo Popup en Desktop (`max-w-4xl`, backdrop blur) y pantalla completa dedicada en Mobile con botón "Volver" y gesto swipe.
- [x] **Sistema de Pestañas en DetailPanel:** Dividir la información en tres tabs: `[ Gráfico ]`, `[ Fundamentales ]`, `[ Perfil ]`.
- [x] **Gesto Mobile Swipe-to-Close:** Deslizar con el dedo desde la izquierda hacia la derecha para volver atrás y cerrar el panel de forma nativa en celulares.
- [x] **Tab 'Perfil':** Mostrar descripción de la empresa, nombre del CEO, sector, industria, empleados y sitio web oficial (extraído de `yahoo-finance2` vía `/api/fundamentals`).
- [x] **Tab 'Fundamentales':** Diseñar una grilla de métricas contables:
  - Beneficio por Acción (BPA / Trailing EPS) y PER (Trailing y Forward).
  - Capitalización de Mercado y Rendimiento del Dividendo (Dividend Yield).
  - Fecha del próximo Balance (Earnings Date) y Consenso de analistas de Wall Street.
  - Expectativas del Mercado: Precio Objetivo (Target Mean Price) con porcentaje de upside/downside proyectado.
- [x] **Deuda y Liquidez (FCF y CAPEX):** Métricas de Free Cash Flow (FCE), Cash Flow Operativo (FCC) y barra visual comparativa de Deuda Total vs. Liquidez (Total Cash). Rango de 52 semanas relativo.

### Epic 4: Instrumentos Adicionales y Educación (FinDash Academy)
- [x] **Ampliación de Activos:** Asegurar soporte en `/api/market` para Bonos (ej. US10Y `^TNX`, AL30, GD30) y CEDEARs con ratios de conversión oficiales BYMA.
- [x] **Sección 'Aprender' (FinDash Academy):** Crear una nueva vista en el Sidebar con tecla rápida '8'.
- [x] **Diseñar grilla de tarjetas educativas** (explicadas de forma simple, para principiantes con datos locales en 0ms):
  - ¿Qué es una Acción y un Bono? (Diferencia entre dueño y prestamista).
  - ¿Qué son los CEDEARs? (Comprar acciones de Wall St en pesos con cobertura CCL).
  - ¿Qué es el CAPEX y el FCF (Flujo de Caja Libre)? (Inversión en fierros vs caja libre).
  - PER y BPA / EPS (¿Cómo saber si una acción está cara o barata?).
  - Horizonte temporal y volatilidad.
- [x] **Test Interactivo de Perfil de Riesgo (`<RiskProfiler />`):** Cuestionario interactivo secuencial de 3 preguntas que calcula el puntaje y categoriza al inversor en Conservador, Moderado o Agresivo, recomendando instrumentos específicos de FinDash.
- [x] **Aviso Legal, Exactitud y Reserva de Derechos (Disclaimer):** Bloque legal formal en FinDash Academy, footer permanente en el DetailPanel y documentación en README deslindando responsabilidad por demoras o inexactitudes de fuentes públicas de terceros, aclarando el propósito puramente educativo y la reserva de derechos de software.
- [x] **Centro de Novedades & Actualizaciones (Changelog / Release Notes):** Modal interactivo (`UpdatesModal`) y botón en Sidebar/Academy con el historial cronológico de versiones estructurado desde la versión inicial `v1.0b` (Beta) hasta `v1.6` (máximo 5 mejoras por versión), destacando nuevas funciones, mejoras y correcciones.
- [x] **Buscador Global Universal & Búsqueda Híbrida en Bolsa:** Endpoint `/api/search` para buscar cualquier acción, ETF, bono o cripto mundial en tiempo real (más allá del catálogo base de 100). Command Palette flotante accesible globalmente con `Ctrl + K` / `Cmd + K` o botón en Ticker, y buscador enriquecido en `BolsaView` con resultados de mercado en vivo.

### Epic 5: Noticias, Multigráficos y Cartera
- [x] **Noticias:** Completar `/api/news` y `<NewsFeed />` categorizado (Macro, Política, Fintech, Cripto, IA) conectando a RSS reales con análisis de sentimiento.
- [x] **Multigráficos:** Vista con grilla 2x2 y 4x4 para ver hasta 4 instancias de `lightweight-charts` en simultáneo.
- [ ] **Mi Cartera:** CRUD local (localStorage `findash_cartera`) para agregar tenencias manuales, calculando total invertido vs valor actual (módulo en pausa temporal).

### Epic 6: Criptomercado 2.0 (v1.5)
- [x] **Monitor Dual en 2 Columnas (Altcoins vs Meme Coins):** Layout paralelo con tablas en tiempo real conectadas a Binance WebSocket (`MiniTicker`) con sparklines de 48h, variación 24h y volumen.
- [x] **Modal de Detalle Completo para Cripto:** Gráficos interactivos de Lightweight Charts, métricas fundamentales de red (ATH, Supply circulante/total, Market Cap, Rango 24h) y perfil de red (Ethereum, Solana, Base, etc. con creador y descripción en criollo).
- [x] **Radar de Ballenas en Tiempo Real (Whale Tracker):** Stream WebSocket `@aggTrade` de Binance para capturar transacciones masivas $\ge \$50.000$ USD en vivo con indicador de balance de presión compradora vs vendedora.
- [x] **Noticias Cripto Dedicadas:** Card inferior con feed RSS de Cointelegraph y medios económicos con análisis de sentimiento.
- [x] **Buscador y Personalización de Listas:** Búsqueda en vivo por ticker/red y selector para sumar o quitar monedas con persistencia en `localStorage`.

### Epic 7: Mapa de Calor Financiero, Temporalidades & Ordenamiento (v1.6)
- [x] **Datos de Market Cap y Volumen:** Asegurar que `/api/market` devuelva `marketCap` y `volume` desde `yahoo-finance2` y que el estado de Cripto calcule o reciba la capitalización aproximada (`estimateCryptoMarketCap`) para ponderar el tamaño de los bloques.
- [x] **Componente `<MarketHeatmap />` (`src/components/common/MarketHeatmap.tsx`):**
  - Implementar algoritmo *Squarified Treemap* ligero en TypeScript sin librerías externas pesadas.
  - Soportar 3 modos de dimensionamiento (`sizeBy`): `'marketCap'` (por capitalización), `'equal'` (peso igualitario) y `'volatility'` (por magnitud de variación diaria para vistas mixtas con commodities/ETFs en el Dashboard).
  - Escala de color dinámica: interpolar tonos de `--teal` (`#2b9e93`) para subas y `--red` (`#c94a42`) para bajas según la magnitud del porcentaje (`change`), con `#161b25` para neutros.
  - Cada celda muestra centrados: Logo (`<CryptoIcon />` o `<AssetIcon />`), Ticker en bold, y porcentaje de cambio (`+X.XX%`), adaptando tipografía e ícono según el tamaño del bloque.
  - Al hacer clic en un bloque, disparar `onItemClick(asset)` para abrir el `<DetailPanel />`.
- [x] **Nuevo Layout en la Sección Cripto (Mapa de Calor TradingView + Listas Scrolleables):**
  - Columna izquierda (50%-55% en desktop): Widget oficial de Mapa de Calor de Criptomonedas de TradingView (`embed-widget-crypto-coins-heatmap.js`) en contenedor `bg-card border border-line rounded-[6px] h-[580px] overflow-hidden`, con opción de **Pantalla Completa / Pop-up** (`fixed inset-2 sm:inset-5 z-[90]`) que preserva la instancia activa y todos los botones de ajustes (Tamaño: Cap. Mercado / Volumen 24h, Color: 24h% / 1 Sem / 1 Mes / 3 Meses, más barra nativa de TradingView) y botón `X` arriba a la derecha para salir.
  - Columna derecha (45%-50% en desktop): 2 paneles apilados verticalmente (**Altcoins & Capa 1** ampliada + **Meme Coins Líderes**) con scroll interno (`max-h-[265px] overflow-y-auto`) y cabecera `sticky top-0 bg-card z-20`.
- [x] **Menú Desplegable (Popover) de Temporalidades (`12h`, `24h`, `1sem`, `1 mes`, `3meses`) y Ordenamiento por Columnas:**
  - En todas las tablas y listas de activos (Cripto, Dashboard, Bolsa, Arg/CEDEARs y Países), mostrar el rango activo con `ChevronDown` en el encabezado de `%` y abrir un popover flotante con las 5 temporalidades resaltando la activa en `--gold`, más botón de ordenamiento adyacente (`▲`/`▼`) y ordenamiento en `ACTIVO`, `PRECIO` y `VOLUMEN`.
  - Actualización real de `%` y `<Sparkline />` según el rango elegido tanto en Cripto (`/api/klines` -> Binance `/api/v3/klines`) como en Bolsa, CEDEARs y Países (`/api/market?timeframe=...` con `yahoo-finance2`).
- [x] **Pulso General de Ballenas en Cripto (`/api/crypto-pulse` + `<WhaleTracker />`):**
  - Endpoint serverless con caché de 60s que consulta en paralelo Binance Futures (`topLongShortPositionRatio` para BTC/ETH/SOL, `takerlongshortRatio` 1h y `premiumIndex` para Funding Rate) y `api.alternative.me/fng/`.
  - Bloque superior "Pulso General de Ballenas" integrado en la card del Radar de Ballenas con 3 KPIs rápidos (Posicionamiento Top Traders Long/Short, Presión Taker 1h, Sentimiento & Fondeo), Lectura Crítica automática, filtro de umbral ampliado (`$50k | $100k | $250k | $500k`) y badge dinámico de flujo en vivo por activo.
- [x] **Integración en Vistas:**
  - En **Dashboard**, **Cripto**, **Bolsa** y **Países**, actualizar el toggle de visualización a `[ Lista | Cards | Mapa ]`.
