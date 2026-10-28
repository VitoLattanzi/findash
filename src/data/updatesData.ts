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
    version: 'v2.4',
    date: 'Octubre 2026',
    title: 'FinDash Academy, Perfiles de Inversor y Top 10 Altcoins',
    isLatest: true,
    highlight: 'Educación financiera sin tecnicismos en 0ms y medición del mercado cripto por las 10 altcoins líderes.',
    items: [
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
      {
        type: 'mejora',
        title: 'Deslinde de Responsabilidad y Reserva de Derechos',
        description:
          'Marco legal formal aclarando que FinDash es una herramienta 100% informativa y analítica, sin custodia de fondos ni operaciones transaccionales.',
      },
    ],
  },
  {
    version: 'v2.3',
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
    version: 'v2.2',
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
    version: 'v2.1',
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
];
