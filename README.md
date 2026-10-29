# FinDash 📈
Tu terminal financiera, desktop-first, sin dramas.

FinDash es una terminal diseñada para seguir mercados, activos y noticias en tiempo real. ¿La mejor parte? No necesitás configurar ninguna API Key ni pagar una suscripción para obtener datos de calidad.

## ¿Qué tiene bajo el capó? 🛠️

*   **Framework:** Next.js (App Router + TypeScript)
*   **Estilos:** Tailwind CSS v4
*   **Data Engine:** Yahoo Finance (Acciones/ETFs) + Binance (WebSocket Real-time + Historial 10 años)
*   **Noticias:** Agregador RSS con análisis de sentimiento automático (Buenas/Malas)
*   **Gráficos:** Lightweight Charts v5 (Zoom por selección, Watermarks, Leyendas dinámicas)
*   **UI/UX:** Atajos de teclado (1-7), modo Responsivo (Mobile-first), tema Dark fluido.
*   **Identidad Visual:** Logos vectoriales para cripto, favicons en alta resolución para acciones/CEDEARs y banderas SVG para países, estructurados en formato `[logo] - nombre` con fallback garantizado.

## ¿Cómo usarlo? 🚀

1.  **Cloná el repo:**
    ```bash
    git clone https://github.com/VitoLattanzi/findash.git
    cd findash
    ```
2.  **Instalá todo:**
    ```bash
    npm install
    ```
3.  **¡Despegá!:**
    ```bash
    npm run dev
    ```
    *Abrí [http://localhost:3000](http://localhost:3000) y empezá a tradear.*

---

## Auditoría y Mejoras Responsivas
Resumen de los cambios implementados para adaptar el diseño a dispositivos móviles (375px) y tablets (768px), priorizando la experiencia desktop original.

| Prioridad | Hallazgo | Solución |
| :--- | :--- | :--- |
| **Crítica** | Sidebar bloqueaba pantalla en mobile | Implementada `hidden md:flex` + Navegación inferior fija en mobile. |
| **Crítica** | Contenedores `min-w-[340px]` causaban desbordamiento | `flex-wrap` eliminado, `flex-col` + `min-w-0` y `w-full` en mobile. |
| **Crítica** | Tablas de datos (Bolsa/Crypto/Cartera) overflow horizontal | Columnas secundarias ocultas (`hidden sm:table-cell`). |
| **Importante** | Panel de detalle desbordaba / z-index incorrecto | `w-full` en mobile, z-index ajustado sobre navegación. |
| **Importante** | Alturas `100vh` causaban recortes de interfaz | Uso de `100svh`/`100dvh` en contenedores dinámicos. |
| **Importante** | Inputs <16px causaban zoom automático en iOS | Regla global de `font-size: 16px` en mobile para inputs/selects (sin bloquear zoom general). |
| **Menor** | Cards de activos, países y gráficos | Grid responsivo (`grid-cols-1 sm:grid-cols-2`), padding y fuentes ajustadas. |
| **Menor** | Sidebar y accesibilidad visual | Interfaz limpia sin indicadores numéricos rígidos, preservando listeners de teclado. |
| **Menor** | Identidad Visual y Reconocimiento Rápido | Sistema modular de logos corporativos, cripto y banderas circulares SVG en formato `[logo] - nombre`. |
| **Menor** | Layout Fijo y Scroll Independiente | Barra superior (Ticker) fijada en `sticky top-0 z-30` acoplada al panel lateral izquierdo (`sticky top-9 z-20`), manteniendo el flujo de datos siempre a la vista al hacer scroll. |
| **UX Mobile** | Volver atrás en celulares | Gesto nativo de deslizamiento (*Swipe right to close*): al arrastrar el panel hacia la derecha con el dedo, se cierra fluidamente volviendo al dashboard. |

---

## Atajos de Teclado ⌨️
Navegá toda la terminal sin despegar las manos del teclado (los atajos funcionan en segundo plano de forma global):

| Tecla | Vista | Descripción |
| :---: | :--- | :--- |
| `1` | **Dashboard** | Resumen general, activos fijados (S&P 500, bonos), sparklines y Fear & Greed. |
| `2` | **Cripto** | Precios en vivo vía WebSocket de Binance y análisis de velas con historial. |
| `3` | **Bolsa** | Acciones líderes de EE.UU. (S&P 500) y ADRs argentinos con tablas ordenables. |
| `4` | **Arg / CEDEARs** | Dólares (Blue, MEP, CCL), ratios de CEDEARs, curva de bonos (AL30/GD30) y calculadoras. |
| `5` | **Países** | ETFs de economías clave, divisas globales y comparador macroeconómico. |
| `6` | **Noticias** | Feeds RSS financieros clasificados por categorías (con apartado de Política) y análisis de sentimiento. |
| `7` | **Multigráficos** | Vista simultánea de múltiples activos para comparar tendencias. |
| `8` | **Aprender** | FinDash Academy: conceptos en criollo (Acciones vs Bonos, CEDEARs, FCF, PER) y Test de Perfil de Riesgo interactivo. |
| `Ctrl + K` / `/` | **Buscador Global** | Command Palette Spotlight para buscar cualquier acción, bono, ETF o cripto del mundo al instante. |

---

## Módulos y Funcionalidades 🧭

*   **FinDash Academy (Educación Financiera en 0ms):** Centro de aprendizaje estático local (sin scraping ni latencia) con explicaciones simples, analogías de la vida real (resaltadas en `--teal`) y un **Test de Perfil de Riesgo** interactivo secuencial que clasifica al usuario en Conservador, Moderado o Agresivo recomendando activos específicos de la plataforma.
*   **Centro de Novedades & Actualizaciones (Changelog / Release Notes):** Modal accesible desde el Sidebar y Academy que documenta la evolución cronológica del producto con un máximo de 5 mejoras por versión (desde la inicial `v1.0b` Beta hasta `v1.4`), detallando nuevas funciones, mejoras y correcciones con etiquetas interactivas.

*   **Dashboard Principal:** Vista integral con rotador dinámico de los mercados más relevantes del mundo (Wall St, BCBA/BYMA, Londres, Tokio, Hong Kong y Cripto 24/7 con estados en vivo: Abierto, Cierra pronto, Abre pronto, Cerrado), menú desplegable interactivo con diagnóstico de tendencia diaria (**Alcista / Bajista** por índice representativo y el **Índice Top 10 Altcoins** líderes por capitalización, junto a la barra de balance global), índice Fear & Greed, activos destacados y gráficos rápidos con selector de temporalidades.
*   **Panel de Detalle y Análisis Fundamental (Modal Card & Pantalla Dedicada):** Al seleccionar cualquier activo, se abre una tarjeta modal central tipo popup en desktop (`max-w-4xl`) y una pantalla completa dedicada en mobile con botón "Volver" y navegación en tres solapas:
    *   *Gráfico:* Lightweight Charts con switch entre Área y Velas japonesas, mayor altura y resolución visual, timeframes de 1h a ALL y redirección oficial a TradingView.
    *   *Fundamentales:* Extracción de balances contables vía `/api/fundamentals`: PER (Trailing y Forward), Beneficio por Acción (BPA/EPS), Capitalización de Mercado, Rendimiento de Dividendos con periodicidad de pago (**Trimestral, Mensual, Semestral, Anual o "No distribuye"** si reinvierte ganancias), Próxima fecha de balance (Earnings Date), Precio Objetivo medio de analistas con potencial de suba (*Upside*) y comparativa visual de Deuda Total vs. Liquidez (Caja) y Flujo de Caja Libre (FCF).
    *   *Perfil Corporativo:* Resumen de la empresa, CEO, Sector, Industria, Empleados, Sede y enlace oficial a su sitio web.
*   **Pre/Post Market en Tiempo Real:** Soporte para cotizaciones extendidas (Pre-Market y After-Hours) en gris atenuado si el mercado regular se encuentra cerrado.
*   **Criptomercado en Vivo:** Conexión continua a Binance WebSocket con fallback automático a endpoints alternativos para evitar restricciones geográficas.
*   **Bolsa & ADRs (Búsqueda Global Ilimitada):** Catálogo curado del S&P 500, materias primas (oro, plata, petróleo, soja) y ADRs argentinos, potenciado con un **motor de búsqueda híbrido en tiempo real** que consulta toda la base de datos bursátil mundial vía `/api/search` para encontrar cualquier ticker internacional (TSM, BABA, ARM, SMCI, etc.) más allá del catálogo fijo.
*   **Buscador Universal Global (`Ctrl + K` / `Cmd + K`):** Barra de búsqueda Spotlight flotante accesible desde cualquier pantalla para localizar y abrir al instante el gráfico y análisis fundamental de cualquier acción, bono soberano o criptomoneda.
*   **Mercado Argentino (CEDEARs, Bonos & Dólares):** Módulo dedicado al nicho financiero de Argentina:
    *   *Monitoreo cambiario:* Dólar Blue, MEP (Bolsa), CCL (Cable) y Oficial con cálculo en vivo de brechas y tasa de canje.
    *   *CEDEARs BYMA:* Ratios oficiales de conversión (SPY, QQQ, NVDA, AAPL, MELI, VIST, etc.), precio subyacente en USD y valor teórico en pesos al CCL.
    *   *Curva Soberana en USD:* Bonos Bonares vs Globales (AL30, GD30, AL35, GD35, AE38, GD38) con legislación, paridad, cupones y explicación operativa de parking.
    *   *Deuda en Pesos & BCRA:* Análisis de Lecaps (estrategia de carry trade / tasa en pesos), Bonos CER (cobertura inflacionaria) y Bopreales.
    *   *Calculadoras financieras:* Conversor de capital en pesos a cantidad de CEDEARs y simulador de liquidación neta de Dólar MEP.
*   **Macro & Países:** Monitoreo global mediante ETFs representativos de las principales economías mundiales e indicadores macroeconómicos locales de Argentina (Riesgo País y dólar en todas sus cotizaciones).
*   **Agregador de Noticias:** Cobertura de medios locales e internacionales con clasificación por categorías (Macro, Política, Fintech, IA, Cripto) e inferencia de sentimiento (positivo/negativo/neutro).
*   **Multigráficos:** Comparador visual basado en `lightweight-charts` v5 con selector de rango temporal (de 1h a más de 10 años de datos).
*   **Mi Cartera (En Pausa):** Módulo temporalmente desactivado para una posterior implementación con sincronización óptima.

---

## Arquitectura de Datos y Web Scraping ⚙️
FinDash utiliza una arquitectura distribuida de **Server Route Handlers** (Next.js) que actúan como capa intermedia (proxy) para normalizar y cachear datos de terceros, garantizando performance y evitando restricciones de CORS.

### 1. Integración de Datos (APIs)
*   **Criptomonedas (Binance):**
    *   *Real-time:* Conexión persistente mediante `WebSocket` (vía `hooks/useBinanceWebSocket`) para cotizaciones en vivo (MiniTicker).
    *   *Histórico:* Paginación automática en `/api/history` que realiza múltiples requests en cascada (para obtener hasta 10 años de historia) mediante `REST API`.
*   **Acciones y ETFs (Yahoo Finance):**
    *   Uso de la librería `yahoo-finance2` dentro de los endpoints `/api/history` y `/api/market`.
    *   Fetching optimizado por lotes (*batching*) de hasta 50 activos simultáneos para maximizar la velocidad en las vistas de Bolsa.
*   **Macro y Local:** Integración de endpoints (`DolarAPI`, `ArgentinaDatos`) para divisas locales y riesgo país con manejo de fallbacks automáticos.

### 2. Capa de Proxy y Caché
*   **Server Route Handlers:** Todas las consultas externas están encapsuladas en la carpeta `/api/` para centralizar la lógica, manejar errores y normalizar respuestas.
*   **Estrategia de Caché:** Implementamos headers `Cache-Control` (`public, s-maxage=..., stale-while-revalidate=...`) aprovechando el CDN de Vercel. Esto reduce drásticamente las llamadas directas a las APIs gratuitas y acelera la carga para el usuario final.

### 3. Agregación y Análisis (NLP)
*   **RSS Aggregator:** Uso de `rss-parser` en endpoints centralizados (`/api/news`, `/api/country-news`) que consultan feeds de Google News (economía, política, fintech, IA, cripto) y medios especializados como Ámbito Financiero (economía y política), Cointelegraph e iProUP.
*   **Análisis de Sentimiento:** Motor ligero en `lib/sentiment.ts` basado en detección de keywords que clasifica cada titular como "Buenas" o "Malas" (positivo/negativo) en tiempo real al consumir los feeds.

### 4. Motor Gráfico & TradingView
*   **Lightweight Charts:** Renderizado acelerado por hardware diseñado para series temporales densas. La carga de datos se desacopla del motor mediante el hook `useSeriesData`, que normaliza los formatos de Binance y Yahoo antes de alimentar el motor de renderizado.
*   **Formato Dinámico en Crosshair y Escala:** Soporte para tokens y activos de micro-precio (`< 1`), cortando automáticamente en el tercer dígito significativo tras los ceros iniciales (ej. `$0,0000123`) para evitar notaciones truncadas o valores en cero.
*   **Redirección Dinámica a TradingView:** Botones de acceso directo al gráfico interactivo oficial de TradingView (`tradingview.com/chart`), resolviendo automáticamente el ticker y exchange correspondiente:
    *   *Criptomonedas:* `BINANCE:BTCUSDT`, `BINANCE:ETHUSDT`, etc.
    *   *Bonos Soberanos Argentinos:* `BCBA:AL30`, `BCBA:GD30`, etc.
    *   *Acciones y ETFs:* `NASDAQ:AAPL`, `SP:SPX`, etc.
    *   *Commodities:* `TVC:GOLD`, `TVC:SILVER`, `TVC:USOIL`, etc.


---

## Privacidad y Persistencia 🔒
Tu información financiera te pertenece. FinDash no utiliza bases de datos remotas ni servicios de tracking:
*   Toda tu configuración personalizada (activos fijados y países elegidos) se almacena de forma exclusiva en el `localStorage` de tu navegador (`findash_pinned`, `findash_countries`).

---

## Disclaimer & Términos Legales ⚠️
*   **Fines Educativos e Informativos:** FinDash es una plataforma diseñada exclusivamente con propósitos educativos, ilustrativos y de consulta personal. Ningún análisis, cálculo, ratio o cotización provisto constituye recomendación de inversión, asesoramiento financiero ni oferta de compra o venta de ningún instrumento financiero.
*   **Exactitud de la Información y Demoras:** Los datos de mercado provienen de fuentes públicas, feeds RSS y APIs de terceros sujetas a fluctuaciones, demoras (*delayed market data*) o posibles inexactitudes técnicas. FinDash no garantiza la exactitud, integridad ni actualidad de la información, y no asume responsabilidad alguna por decisiones comerciales o financieras tomadas en base a ella.
*   **Reserva de Derechos:** FinDash se reserva el derecho de modificar, actualizar o discontinuar cualquier componente, activo o funcionalidad sin previo aviso. Todos los derechos de autor, identidad visual y diseño de software están reservados. El rendimiento histórico de los activos no garantiza rendimientos futuros.
