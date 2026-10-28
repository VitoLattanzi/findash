# FinDash — Master Specification & Roadmap (v2.0)

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
- [x] **Menú Desplegable de Sentimiento Mundial:** Popover/modal interactivo al clickear el widget de mercados, mostrando si cada plaza cotiza **Alcista** (`TrendingUp`) o **Bajista** (`TrendingDown`) según su índice representativo (S&P 500, Merval, FTSE 100, Nikkei 225, Hang Seng, Bitcoin) con barra de balance diario.

### Epic 3: Análisis Fundamental (Requerimientos de Pepo)
- [ ] **Sistema de Pestañas en DetailPanel:** Dividir la información inferior en tres tabs: `[ Gráfico ]`, `[ Fundamentales ]`, `[ Perfil ]`.
- [ ] **Tab 'Perfil':** Mostrar descripción de la empresa, nombre del CEO, sector y sitio web (extraído de `yahoo-finance2` module `assetProfile`).
- [ ] **Tab 'Fundamentales':** Diseñar una grilla de métricas contables:
  - Beneficio por Acción (BPA / Trailing EPS) y PER.
  - Capitalización de Mercado y Rendimiento del Dividendo (Dividend Yield).
  - Fecha del próximo Balance (Earnings Date) e Informes.
  - Expectativas del Mercado: Precio Objetivo (Target Mean Price).
- [ ] **Deuda y Liquidez (FCF y CAPEX):** Incluir métricas de Free Cash Flow (FCE), Cash Flow Operativo (FCC) y CAPEX (Inversión en activos fijos). Mostrar un mini-gráfico o barra comparativa de Deuda Total vs. Liquidez (Total Cash).

### Epic 4: Instrumentos Adicionales y Educación (FinDash Academy)
- [x] **Ampliación de Activos:** Asegurar soporte en `/api/market` para Bonos (ej. US10Y `^TNX`, AL30, GD30) y CEDEARs con ratios de conversión oficiales BYMA.
- [ ] **Sección 'Aprender' (FinDash Academy):** Crear una nueva vista en el Sidebar.
- [ ] Diseñar grilla de tarjetas educativas (explicadas de forma simple, para principiantes):
  - ¿Qué es una Acción y un Bono?
  - ¿Qué es el CAPEX y el FCE (Flujo de Caja Libre)?
  - Tipos de perfiles de riesgo.

### Epic 5: Noticias, Multigráficos y Cartera
- [x] **Noticias:** Completar `/api/news` y `<NewsFeed />` categorizado (Macro, Política, Fintech, Cripto, IA) conectando a RSS reales con análisis de sentimiento.
- [x] **Multigráficos:** Vista con grilla 2x2 y 4x4 para ver hasta 4 instancias de `lightweight-charts` en simultáneo.
- [ ] **Mi Cartera:** CRUD local (localStorage `findash_cartera`) para agregar tenencias manuales, calculando total invertido vs valor actual (módulo en pausa temporal).
