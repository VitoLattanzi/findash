# FinDash — Master Specification & Roadmap (v1.4)

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
- [x] **Centro de Novedades & Actualizaciones (Changelog / Release Notes):** Modal interactivo (`UpdatesModal`) y botón en Sidebar/Academy con el historial cronológico de versiones estructurado desde la versión inicial `v1.0b` (Beta) hasta `v1.4` (máximo 5 mejoras por versión), destacando nuevas funciones, mejoras y correcciones.
- [x] **Buscador Global Universal & Búsqueda Híbrida en Bolsa:** Endpoint `/api/search` para buscar cualquier acción, ETF, bono o cripto mundial en tiempo real (más allá del catálogo base de 100). Command Palette flotante accesible globalmente con `Ctrl + K` / `Cmd + K` o botón en Ticker, y buscador enriquecido en `BolsaView` con resultados de mercado en vivo.

### Epic 5: Noticias, Multigráficos y Cartera
- [x] **Noticias:** Completar `/api/news` y `<NewsFeed />` categorizado (Macro, Política, Fintech, Cripto, IA) conectando a RSS reales con análisis de sentimiento.
- [x] **Multigráficos:** Vista con grilla 2x2 y 4x4 para ver hasta 4 instancias de `lightweight-charts` en simultáneo.
- [ ] **Mi Cartera:** CRUD local (localStorage `findash_cartera`) para agregar tenencias manuales, calculando total invertido vs valor actual (módulo en pausa temporal).
