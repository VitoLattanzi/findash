export interface UpdateItem {
  type: 'nuevo' | 'mejora' | 'fix';
  title: string;
  description: string;
}

export interface ReleaseUpdate {
  version: string;
  date: string;
  title: string;
  isLatest?: boolean;
  highlight: string;
  items: UpdateItem[];
}

export const PLATFORM_UPDATES: ReleaseUpdate[] = [
  {
    version: 'v1.6',
    date: 'Octubre 2026',
    title: 'Mapas de Calor, Temporalidades Dinámicas y Ordenamiento',
    isLatest: true,
    highlight: 'Mapa de Calor oficial de TradingView en Cripto, Treemap nativo en Bolsa/Dashboard/Países y menú desplegable de 5 temporalidades (12h a 3 meses) con actualización real de % y Sparklines.',
    items: [
      {
        type: 'nuevo',
        title: 'Nuevo Layout Cripto: Mapa de Calor TradingView + Listas Scrolleables',
        description:
          'Widget interactivo oficial de Mapa de Calor de Criptomonedas de TradingView a la izquierda (con zoom y bloques por Market Cap) y paneles apilados de Altcoins & Capa 1 (ampliado) y Meme Coins Líderes con scroll interno compacto a la derecha.',
      },
      {
        type: 'nuevo',
        title: 'Popover de Temporalidades (12h, 24h, 1sem, 1 mes, 3meses)',
        description:
          'Menú desplegable flotante al tocar el encabezado de % en todas las tablas (Cripto, Dashboard, Bolsa, Arg/CEDEARs y Países) que recalcula en tiempo real el porcentaje de variación y redibuja las curvas Sparkline.',
      },
      {
        type: 'nuevo',
        title: 'Ordenamiento Completo por Columnas',
        description:
          'Encabezados interactivos para ordenar cualquier tabla alfabéticamente por Activo (A-Z / Z-A) o numéricamente por Precio, Variación % (con botón rápido ▲/▼) y Volumen.',
      },
      {
        type: 'nuevo',
        title: 'Componente Treemap Nativo (Squarified Heatmap)',
        description:
          'Mapa de calor propio en TypeScript con escala térmica FinDash (--teal y --red) y 3 modos de tamaño (Cap. de Mercado, Peso Igualitario y Volatilidad) en Dashboard, Bolsa y Países.',
      },
      {
        type: 'mejora',
        title: 'Iconografía Resiliente (<CryptoIcon />) y Gráficos a 3 Meses',
        description:
          'CDN de íconos cripto con fallback circular automático ante errores 404 y apertura por defecto en rango de 3 meses (3M) en todos los gráficos de la aplicación.',
      },
    ],
  },
  {
    version: 'v1.5',
    date: 'Octubre 2026',
    title: 'Criptomercado 2.0: Altcoins, Memecoins y Radar de Ballenas',
    highlight: 'Tablero dual en 2 columnas, análisis fundamental y perfil de red para cripto, noticias dedicadas y radar de ballenas en tiempo real vía WebSocket.',
    items: [
      {
        type: 'nuevo',
        title: 'Monitor Dual Cripto (2 Columnas: Altcoins & Memecoins)',
        description:
          'Estructura organizada en dos columnas paralelas para seguir simultáneamente las mayores Altcoins de capa 1 y las principales Memecoins del mercado con precios y variación en tiempo real.',
      },
      {
        type: 'nuevo',
        title: 'Modal de Detalle Completo, Fundamentales y Perfil Cripto',
        description:
          'Al tocar cualquier moneda se abre el panel interactivo con gráfico de velas/área, métricas de red (ATH, Supply circulante/total, Capitalización, Rango 24h) y ficha técnica (red base, consenso, creador y descripción en criollo).',
      },
      {
        type: 'nuevo',
        title: 'Radar de Ballenas en Vivo (Whale Tracker)',
        description:
          'Detector de transacciones masivas conectado al stream @aggTrade de Binance, identificando en tiempo real compras y ventas superiores a $50k/$100k USD con medidor de presión de mercado.',
      },
      {
        type: 'nuevo',
        title: 'Noticias Criptomercado con Análisis de Sentimiento',
        description:
          'Card integrada con los últimos artículos de Cointelegraph y medios económicos especializados, clasificados con etiquetas de sentimiento alcista, bajista o neutral.',
      },
      {
        type: 'mejora',
        title: 'Buscador Integrado y Personalización de Listas',
        description:
          'Filtro en vivo por ticker o red blockchain, con opción de agregar nuevos pares de Binance o quitar activos según tus preferencias, guardándose en tu navegador de forma persistente.',
      },
    ],
  },
  {
    version: 'v1.4',
    date: 'Octubre 2026',
    title: 'FinDash Academy, Buscador Global y Top 10 Altcoins',
    highlight: 'Búsqueda ilimitada en todo el mercado global, educación financiera en 0ms y medición cripto por las 10 altcoins líderes.',
    items: [
      {
        type: 'nuevo',
        title: 'Buscador Global Universal (Ctrl + K)',
        description:
          'Command Palette flotante estilo Spotlight para buscar y abrir cualquier acción, bono, ETF o criptomoneda del mundo al instante con precios en vivo.',
      },
      {
        type: 'nuevo',
        title: 'Búsqueda Ilimitada en Bolsa (vía /api/search)',
        description:
          'Se superó la limitación de los 100 activos fijos: ahora puedes buscar y operar con cualquier ticker internacional (TSM, BABA, ARM, SMCI, etc.) en tiempo real.',
      },
      {
        type: 'nuevo',
        title: 'FinDash Academy (Sección Aprender)',
        description:
          'Guías financieras en criollo con analogías de la vida real (Acciones vs Bonos, CEDEARs, FCF, CAPEX, PER) con carga local instantánea en 0 milisegundos.',
      },
      {
        type: 'nuevo',
        title: 'Test Interactivo de Perfil de Riesgo',
        description:
          'Cuestionario de 3 preguntas que diagnostica si tu perfil es Conservador, Moderado o Agresivo, recomendando instrumentos específicos para tu seguimiento analítico.',
      },
      {
        type: 'nuevo',
        title: 'Índice Top 10 Altcoins Líderes',
        description:
          'El mercado cripto ahora se mide a través del promedio ponderado en tiempo real de las 10 altcoins con mayor capitalización (ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, LINK, DOT, NEAR).',
      },
    ],
  },
  {
    version: 'v1.3',
    date: 'Octubre 2026',
    title: 'Análisis Fundamental Corporativo y UX Mobile Nativa',
    highlight: 'Métricas de balance (PER, BPA, Deuda vs Caja) y navegación táctil en celulares.',
    items: [
      {
        type: 'nuevo',
        title: 'Pestañas de Balance y Perfil Corporativo',
        description:
          'Información contable completa en el modal de detalle: PER, BPA/EPS, Market Cap, Próxima fecha de balance, Deuda Total vs Liquidez y Flujo de Caja Libre.',
      },
      {
        type: 'mejora',
        title: 'Dividendos Inteligentes',
        description:
          'Detección automática de la frecuencia de pago (Trimestral, Mensual, Semestral) o etiqueta explicativa "No distribuye / Reinvierte ganancias" para empresas que no pagan dividendos.',
      },
      {
        type: 'nuevo',
        title: 'Gesto Táctil Swipe-to-Back en Celulares',
        description:
          'En dispositivos móviles ahora puedes deslizar desde el borde izquierdo hacia la derecha para volver atrás al dashboard de forma natural.',
      },
      {
        type: 'nuevo',
        title: 'Precio Objetivo de Wall Street (Upside Potencial)',
        description:
          'Cálculo en porcentaje del potencial alcista proyectado por analistas e instituciones de Wall Street frente a la cotización actual.',
      },
    ],
  },
  {
    version: 'v1.2',
    date: 'Octubre 2026',
    title: 'Modal Central Cinemático y Rotador de Mercados Mundiales',
    highlight: 'Visualización ampliada de gráficos y estado en vivo de las principales bolsas del mundo.',
    items: [
      {
        type: 'mejora',
        title: 'Card Modal Central en Pantalla',
        description:
          'El panel de detalle se transformó en un modal central amplio tipo popup en desktop (mayor altura y resolución para velas y volumen) y pantalla completa en mobile.',
      },
      {
        type: 'nuevo',
        title: 'Rotador de Mercados Globales con Horarios en Vivo',
        description:
          'Widget inferior en el Sidebar con cálculo horario de Wall St, BCBA/BYMA, Londres, Tokio, Hong Kong y Cripto 24/7 con código de colores (Abierto, Cierra pronto, Abre pronto, Cerrado).',
      },
      {
        type: 'nuevo',
        title: 'Menú Desplegable de Sentimiento Diario (Alcista / Bajista)',
        description:
          'Diagnóstico del pulso del mercado mundial por índice representativo (S&P 500, Merval, FTSE, Nikkei, Hang Seng, Altcoins) con barra de balance global.',
      },
      {
        type: 'nuevo',
        title: 'Pre-Market y After-Hours en Tiempo Real',
        description:
          'Visualización de cotizaciones en sesiones extendidas en gris atenuado si la sesión regular de la bolsa está cerrada.',
      },
    ],
  },
  {
    version: 'v1.1',
    date: 'Octubre 2026',
    title: 'Identidad Visual, Micro-Precios y Enlaces a TradingView',
    highlight: 'Logos oficiales de activos, formato de fracciones microscópicas y navegación fluida.',
    items: [
      {
        type: 'nuevo',
        title: 'Logos y Banderas en Formato [Logo] - Nombre',
        description:
          'Integración de logos corporativos, cripto y banderas circulares SVG para más de 100 activos del S&P 500, CEDEARs y divisas.',
      },
      {
        type: 'mejora',
        title: 'Formato Dinámico en Crosshair para Tokens Pequeños',
        description:
          'Corte automático en el tercer dígito no cero para valores menores a 1 dólar (ej: $0,0000123), evitando que queden en cero o truncados.',
      },
      {
        type: 'mejora',
        title: 'Redirección Oficial a TradingView',
        description:
          'Botón directo que abre el gráfico interactivo completo en TradingView resolviendo automáticamente el ticker y exchange exacto.',
      },
      {
        type: 'mejora',
        title: 'Barra Superior Ticker y Sidebar Sticky',
        description:
          'La barra de cotizaciones y el panel lateral se mantienen siempre a la vista al hacer scroll en cualquier pantalla.',
      },
    ],
  },
  {
    version: 'v1.0b',
    date: 'Octubre 2026',
    title: 'Lanzamiento Inicial FinDash Beta',
    highlight: 'Dashboard financiero integral con datos en tiempo real de cripto, bolsa argentina e internacional y divisas.',
    items: [
      {
        type: 'nuevo',
        title: 'Dashboard Cripto 24/7 en Vivo',
        description:
          'Cotizaciones y libros de órdenes conectadas a Binance vía WebSocket nativo con latencia ultrabaja.',
      },
      {
        type: 'nuevo',
        title: 'Catálogo de Bolsa & CEDEARs',
        description:
          'Monitor de acciones del S&P 500, CEDEARs de empresas globales y bonos soberanos con cotizaciones de Yahoo Finance.',
      },
      {
        type: 'nuevo',
        title: 'Monitoreo Cambiario Argentino',
        description:
          'Seguimiento en vivo del Dólar Blue, MEP, Contado con Liquidación (CCL), Oficial y Cripto con cálculo de brecha cambiaria.',
      },
      {
        type: 'nuevo',
        title: 'Gráficos Interactivos Profesionales',
        description:
          'Motor financiero de Lightweight Charts v5 con series de velas y áreas, rangos temporales (1D a 5A) y selector de escala.',
      },
      {
        type: 'nuevo',
        title: 'Agregador de Noticias Financieras',
        description:
          'Feeds RSS de portales líderes económicos y cripto con análisis de sentimiento en tiempo real.',
      },
    ],
  },
];
