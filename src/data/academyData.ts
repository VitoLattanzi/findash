export interface AcademyModule {
  id: string;
  category: 'Básicos' | 'Métricas & Balances' | 'Mercado Argentino';
  title: string;
  description: string;
  analogy: string;
  content: string;
  readTime?: string;
}

export interface RiskOption {
  text: string;
  points: number;
}

export interface RiskQuestion {
  question: string;
  options: RiskOption[];
}

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 'acciones-vs-bonos',
    category: 'Básicos',
    title: 'Acciones vs. Bonos',
    description: 'La diferencia fundamental entre ser dueño y ser prestamista.',
    readTime: '2 min',
    analogy:
      'Acción: Ponés plata con un amigo para abrir una cervecería; si les va bien, ganan mucho, si quiebra, pierden todo. Bono: Le prestás plata al banco a plazo fijo; no te importa si el banco gana millones, a vos te pagan tu tasa fija pactada y listo.',
    content:
      'Una **Acción (Renta Variable)** representa una fracción del capital de una empresa. Al comprarla, te volvés socio. No hay ganancias garantizadas; ganás si la empresa crece o si reparte dividendos. Un **Bono (Renta Fija)** es deuda. Un gobierno o empresa te pide plata prestada y firma un contrato comprometiéndose a devolverte el capital más intereses en fechas específicas.',
  },
  {
    id: 'cedears',
    category: 'Mercado Argentino',
    title: '¿Qué son los CEDEARs?',
    description: 'Cómo comprar Apple o Nvidia con pesos desde Argentina.',
    readTime: '2 min',
    analogy:
      'Es como comprar un voucher en un local de Buenos Aires que representa unas zapatillas guardadas en una caja fuerte en Nueva York. El valor del voucher se ajusta por el precio de la zapatilla en dólares y por el precio del dólar.',
    content:
      'Los CEDEARs (Certificados de Depósito Argentinos) son instrumentos que cotizan en la bolsa local (en pesos) pero representan fracciones de acciones extranjeras. Tienen una doble ventaja: te permiten invertir en las mejores empresas del mundo y, al mismo tiempo, su precio está atado al Dólar CCL, cubriéndote de la devaluación local.',
  },
  {
    id: 'fcf-capex',
    category: 'Métricas & Balances',
    title: 'Flujo de Caja Libre (FCF) y CAPEX',
    description: 'La diferencia entre la plata que entra y la plata real que sobra.',
    readTime: '3 min',
    analogy:
      'CAPEX es la plata que gastás en comprar hornos nuevos para tu pizzería. El FCF es la plata que te quedó limpia en la caja a fin de mes después de pagarle a los empleados, los impuestos y los hornos nuevos. Esa es la plata real que te podés llevar a tu casa.',
    content:
      '**CAPEX (Capital Expenditure):** Es la inversión que hace la empresa en activos físicos (máquinas, edificios, tecnología) para mantener o expandir su negocio.\n\n**FCF (Free Cash Flow):** Es el efectivo real que genera la empresa después de mantener sus operaciones y pagar el CAPEX. Si el FCF es positivo y creciente, la empresa es una máquina de generar billetes y no necesita endeudarse.',
  },
  {
    id: 'per-eps',
    category: 'Métricas & Balances',
    title: 'PER y BPA (Beneficio Por Acción)',
    description: '¿Cómo saber si una acción está cara o barata?',
    readTime: '3 min',
    analogy:
      'Si un kiosco te cuesta $10.000 (Precio) y te deja $1.000 de ganancia al año (BPA), tu PER es 10. Significa que vas a tardar 10 años en recuperar tu inversión. Si te lo venden a $50.000, el PER es 50 (está muy caro respecto a lo que produce).',
    content:
      '**BPA (EPS en inglés):** Es la ganancia neta total de la empresa dividida por la cantidad de acciones que existen. Cuánto ganó la empresa por cada acción que tenés.\n\n**PER (Price-to-Earnings Ratio):** Es el Precio de la acción dividido su BPA. Te dice cuántos dólares estás pagando por cada dólar de ganancia que genera la empresa. Un PER muy alto suele indicar que la acción está "cara" o que el mercado espera que crezca muchísimo en el futuro.',
  },
  {
    id: 'perfiles-riesgo',
    category: 'Básicos',
    title: 'Horizonte Temporal y Volatilidad',
    description: 'Por qué el tiempo es el mejor amigo del inversor.',
    readTime: '2 min',
    analogy:
      'Si salís en barco a pescar por 2 horas y hay tormenta, la pasás pésimo y te podés hundir (corto plazo). Pero si vas en un crucero de 5 años con paradas programadas, las olas del primer mes ni las sentís cuando llegás a destino (largo plazo).',
    content:
      'El riesgo financiero no es simplemente que una cotización baje; es verte obligado a vender con pérdidas cuando necesitás el dinero con urgencia. El dinero que vas a usar el mes que viene no debe ir a acciones ni cripto; el dinero que no vas a tocar por 5 años se beneficia del interés compuesto en activos productivos.',
  },
];

export const RISK_TEST_QUESTIONS: RiskQuestion[] = [
  {
    question: 'En tu planificación financiera personal, ¿cuál es tu horizonte temporal habitual?',
    options: [
      { text: 'Corto plazo (menos de 1 año: busco instrumentos de bajo riesgo y liquidez).', points: 1 },
      { text: 'Mediano plazo (entre 2 y 5 años: busco equilibrio entre rendimiento y estabilidad).', points: 2 },
      { text: 'Largo plazo (más de 5 años: busco maximizar el crecimiento patrimonial).', points: 3 },
    ]
  },
  {
    question: 'Cuando observas que un activo cae un 20% en un mes en el mercado, ¿cómo reaccionas?',
    options: [
      { text: 'Me genera mucha inquietud; prefiero monitorear solo activos estables sin sobresaltos.', points: 1 },
      { text: 'Entiendo que la volatilidad es natural y prefiero esperar su evolución con calma.', points: 2 },
      { text: 'Lo analizo como una oportunidad atractiva de compra a precios de descuento.', points: 3 },
    ]
  },
  {
    question: '¿Cuál es tu objetivo principal de consulta y seguimiento en FinDash?',
    options: [
      { text: 'Seguir instrumentos de cobertura (Dólares, Bonos conservadores e inflación).', points: 1 },
      { text: 'Analizar índices líderes mundiales (S&P 500) y empresas consolidadas.', points: 2 },
      { text: 'Monitorear activos de alto crecimiento, empresas tecnológicas y el mercado cripto.', points: 3 },
    ]
  }
];

export interface ProfileRecommendation {
  name: string;
  type: 'Conservador' | 'Moderado' | 'Agresivo';
  color: string;
  badgeBg: string;
  description: string;
  suggestedAssets: {
    category: string;
    items: string[];
  }[];
  tips: string;
}

export const PROFILE_RECOMMENDATIONS: Record<'conservador' | 'moderado' | 'agresivo', ProfileRecommendation> = {
  conservador: {
    name: 'Perfil Conservador',
    type: 'Conservador',
    color: 'text-teal',
    badgeBg: 'bg-teal/15 border-teal/30 text-teal',
    description:
      'Tu prioridad es la preservación del capital y la previsibilidad. Prefieres instrumentos de renta fija con cronogramas claros de cobro y baja volatilidad.',
    suggestedAssets: [
      {
        category: 'Renta Fija en USD (Para monitoreo)',
        items: ['Obligaciones Negociables (ONs de YPF, Pampa, Telecom)', 'Bonos del Tesoro de EE.UU. (^TNX)'],
      },
      {
        category: 'Mercado Local & Cobertura',
        items: ['Dólar MEP / CCL para seguimiento cambiario', 'Lecaps cortas y Bonos CER para inflación'],
      },
    ],
    tips: 'En FinDash podés consultar la sección "Arg / CEDEARs" (pestañas Dólares y Bonos) y "Países". Recuerda que FinDash es 100% informativa: para operar deberás utilizar tu broker autorizado.',
  },
  moderado: {
    name: 'Perfil Moderado',
    type: 'Moderado',
    color: 'text-gold',
    badgeBg: 'bg-gold/15 border-gold/30 text-gold',
    description:
      'Buscas un equilibrio sano entre rendimiento y estabilidad. Aceptas fluctuaciones en el corto plazo a cambio de ganarle a la inflación en un plazo de 2 a 5 años.',
    suggestedAssets: [
      {
        category: 'ETFs de Índices Mundiales (Para análisis)',
        items: ['SPY (S&P 500 - Las 500 mayores empresas de EE.UU.)', 'DIA (Dow Jones Industrial)'],
      },
      {
        category: 'CEDEARs de Empresas Estables',
        items: ['Coca Cola (KO)', 'Walmart (WMT)', 'Johnson & Johnson (JNJ)', 'Berkshire Hathaway (BRKB)'],
      },
      {
        category: 'Cripto Blue-Chips',
        items: ['Bitcoin (BTC) en una porción reducida (5% - 10%) como reserva de valor'],
      },
    ],
    tips: 'En FinDash puedes analizar la vista "Bolsa" filtrando por SPY y CEDEARs defensivos. Recuerda que FinDash es informativa y no gestiona transacciones ni custodia fondos.',
  },
  agresivo: {
    name: 'Perfil Agresivo',
    type: 'Agresivo',
    color: 'text-red',
    badgeBg: 'bg-red/15 border-red/30 text-red',
    description:
      'Tu horizonte es de largo plazo (+5 años) y buscas maximizar el crecimiento. La volatilidad no te altera y entiendes los ciclos de los activos de mayor riesgo.',
    suggestedAssets: [
      {
        category: 'Acciones Tecnológicas de Crecimiento',
        items: ['Nvidia (NVDA)', 'Apple (AAPL)', 'Microsoft (MSFT)', 'Mercado Libre (MELI)', 'Tesla (TSLA)'],
      },
      {
        category: 'Criptomercado & Web3',
        items: ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)', 'Tokens líderes del ecosistema'],
      },
      {
        category: 'Renta Variable Local de Alto Rendimiento',
        items: ['ADRs de Energía (YPF, Vista Energy VIST)', 'Bonos soberanos AL30 / GD30'],
      },
    ],
    tips: 'En FinDash aprovecha la vista "Cripto" (con cotizaciones WebSocket en vivo) y "Multigráficos". FinDash es una plataforma exclusivamente analítica y de consulta.',
  },
};
