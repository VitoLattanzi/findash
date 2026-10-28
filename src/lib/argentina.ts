export interface CedearInfo {
  ticker: string;
  underlying: string;
  name: string;
  ratio: number; // Ratio ratio:1 (por ej: 20 para SPY = 20 CEDEARs equivalen a 1 ETF)
  category: 'etf' | 'tech' | 'latam' | 'value';
}

export interface BonoInfo {
  ticker: string;
  name: string;
  legislation: 'Local (Bonares)' | 'Nueva York (Globales)';
  currency: 'USD';
  maturity: string;
  coupon: string;
  paridadRef: number; // Paridad de referencia (%)
  tirRef: number; // TIR estimada (%)
  useCase: string;
}

export interface PesoInstrument {
  ticker: string;
  type: 'Lecap' | 'Boncer' | 'Bopreal' | 'Dual';
  name: string;
  description: string;
  mechanism: string;
}

export const CEDEARS_LIST: CedearInfo[] = [
  // ETFs
  { ticker: 'SPY', underlying: 'SPY', name: 'S&P 500 ETF (SPDR)', ratio: 20, category: 'etf' },
  { ticker: 'QQQ', underlying: 'QQQ', name: 'Invesco Nasdaq 100 ETF', ratio: 20, category: 'etf' },
  { ticker: 'DIA', underlying: 'DIA', name: 'Dow Jones Industrial Average ETF', ratio: 20, category: 'etf' },
  { ticker: 'IWM', underlying: 'IWM', name: 'Russell 2000 Small Caps ETF', ratio: 10, category: 'etf' },
  { ticker: 'EEM', underlying: 'EEM', name: 'iShares MSCI Emerging Markets', ratio: 5, category: 'etf' },
  { ticker: 'XLE', underlying: 'XLE', name: 'Energy Select Sector SPDR', ratio: 2, category: 'etf' },
  { ticker: 'XLF', underlying: 'XLF', name: 'Financial Select Sector SPDR', ratio: 2, category: 'etf' },

  // Big Tech / Growth
  { ticker: 'NVDA', underlying: 'NVDA', name: 'Nvidia Corp', ratio: 24, category: 'tech' },
  { ticker: 'AAPL', underlying: 'AAPL', name: 'Apple Inc', ratio: 10, category: 'tech' },
  { ticker: 'TSLA', underlying: 'TSLA', name: 'Tesla Inc', ratio: 15, category: 'tech' },
  { ticker: 'MSFT', underlying: 'MSFT', name: 'Microsoft Corp', ratio: 30, category: 'tech' },
  { ticker: 'AMZN', underlying: 'AMZN', name: 'Amazon.com Inc', ratio: 144, category: 'tech' },
  { ticker: 'GOOGL', underlying: 'GOOGL', name: 'Alphabet Inc (Google)', ratio: 58, category: 'tech' },
  { ticker: 'META', underlying: 'META', name: 'Meta Platforms (Facebook)', ratio: 24, category: 'tech' },
  { ticker: 'AMD', underlying: 'AMD', name: 'Advanced Micro Devices', ratio: 10, category: 'tech' },

  // Latam & Argentina
  { ticker: 'MELI', underlying: 'MELI', name: 'MercadoLibre Inc', ratio: 60, category: 'latam' },
  { ticker: 'VIST', underlying: 'VIST', name: 'Vista Energy S.A.B.', ratio: 1, category: 'latam' },
  { ticker: 'GLOB', underlying: 'GLOB', name: 'Globant S.A.', ratio: 6, category: 'latam' },
  { ticker: 'PBR', underlying: 'PBR', name: 'Petróleo Brasileiro (Petrobras)', ratio: 1, category: 'latam' },
  { ticker: 'VALE', underlying: 'VALE', name: 'Vale S.A.', ratio: 2, category: 'latam' },
  { ticker: 'BBD', underlying: 'BBD', name: 'Banco Bradesco S.A.', ratio: 1, category: 'latam' },

  // Value / Dividendos
  { ticker: 'KO', underlying: 'KO', name: 'The Coca-Cola Company', ratio: 5, category: 'value' },
  { ticker: 'MCD', underlying: 'MCD', name: "McDonald's Corp", ratio: 24, category: 'value' },
  { ticker: 'DIS', underlying: 'DIS', name: 'The Walt Disney Company', ratio: 12, category: 'value' },
  { ticker: 'WMT', underlying: 'WMT', name: 'Walmart Inc', ratio: 6, category: 'value' },
  { ticker: 'BRK-B', underlying: 'BRK-B', name: 'Berkshire Hathaway Inc', ratio: 22, category: 'value' },
  { ticker: 'JNJ', underlying: 'JNJ', name: 'Johnson & Johnson', ratio: 15, category: 'value' },
];

export const BONOS_SOBERANOS: BonoInfo[] = [
  {
    ticker: 'AL30',
    name: 'Bono República Argentina 2030 (Ley Local)',
    legislation: 'Local (Bonares)',
    currency: 'USD',
    maturity: '09/07/2030',
    coupon: '0.75% semestral step-up',
    paridadRef: 68.5,
    tirRef: 13.8,
    useCase: 'Vehículo principal para operar Dólar MEP (AL30 / AL30D). Máxima liquidez de la plaza local.',
  },
  {
    ticker: 'GD30',
    name: 'Global República Argentina 2030 (Ley NY)',
    legislation: 'Nueva York (Globales)',
    currency: 'USD',
    maturity: '09/07/2030',
    coupon: '0.75% semestral step-up',
    paridadRef: 73.2,
    tirRef: 12.4,
    useCase: 'Vehículo principal de Dólar CCL (GD30 / GD30C) y benchmark de la deuda soberana ante fondos extranjeros.',
  },
  {
    ticker: 'AL35',
    name: 'Bono República Argentina 2035 (Ley Local)',
    legislation: 'Local (Bonares)',
    currency: 'USD',
    maturity: '09/07/2035',
    coupon: '1.50% - 3.50% step-up',
    paridadRef: 57.0,
    tirRef: 14.5,
    useCase: 'Mayor duration que el tramo corto; alta convexidad ante compresión del Riesgo País.',
  },
  {
    ticker: 'GD35',
    name: 'Global República Argentina 2035 (Ley NY)',
    legislation: 'Nueva York (Globales)',
    currency: 'USD',
    maturity: '09/07/2035',
    coupon: '1.50% - 3.50% step-up',
    paridadRef: 61.8,
    tirRef: 13.2,
    useCase: 'Bono preferido por inversores institucionales para apuestas de mediano y largo plazo sobre Argentina.',
  },
  {
    ticker: 'AE38',
    name: 'Bono República Argentina 2038 (Ley Local)',
    legislation: 'Local (Bonares)',
    currency: 'USD',
    maturity: '09/01/2038',
    coupon: '4.25% - 5.00% step-up',
    paridadRef: 62.4,
    tirRef: 14.1,
    useCase: 'Indenture 2005: Cláusulas legales más protectoras contra reestructuraciones y mayor flujo de cupones.',
  },
  {
    ticker: 'GD38',
    name: 'Global República Argentina 2038 (Ley NY)',
    legislation: 'Nueva York (Globales)',
    currency: 'USD',
    maturity: '09/01/2038',
    coupon: '4.25% - 5.00% step-up',
    paridadRef: 66.5,
    tirRef: 13.0,
    useCase: 'Indenture 2005 bajo ley extranjera; excelente flujo de cobro de renta semestral en dólares.',
  },
  {
    ticker: 'AL29',
    name: 'Bono República Argentina 2029 (Ley Local)',
    legislation: 'Local (Bonares)',
    currency: 'USD',
    maturity: '09/07/2029',
    coupon: '1.00% semestral step-up',
    paridadRef: 74.0,
    tirRef: 13.9,
    useCase: 'Tramo corto de la curva local con amortizaciones próximas de capital.',
  },
  {
    ticker: 'GD29',
    name: 'Global República Argentina 2029 (Ley NY)',
    legislation: 'Nueva York (Globales)',
    currency: 'USD',
    maturity: '09/07/2029',
    coupon: '1.00% semestral step-up',
    paridadRef: 78.5,
    tirRef: 12.2,
    useCase: 'Bono corto bajo ley internacional con vencimiento y pagos más inmediatos.',
  },
];

export const INSTRUMENTOS_PESOS: PesoInstrument[] = [
  {
    ticker: 'Lecaps (Letras del Tesoro)',
    type: 'Lecap',
    name: 'Letras Capitalizables a Tasa Fija',
    description: 'Títulos de deuda en pesos a corto plazo que capitalizan intereses mensualmente a una tasa pactada (TNA/TEM).',
    mechanism: 'Utilizadas en Argentina para la estrategia de "Carry Trade": invertir en tasa en pesos esperando que rinda por encima de la devaluación del dólar.',
  },
  {
    ticker: 'Bonos CER (TX26, T2X5, DICP)',
    type: 'Boncer',
    name: 'Títulos Ajustados por Inflación (CER)',
    description: 'El capital del bono se actualiza diariamente según el Coeficiente de Estabilización de Referencia (IPC de INDEC) más un cupón real.',
    mechanism: 'Instrumento clásico de cobertura ante aceleración de precios. Si la inflación sube, el bono compensa el poder adquisitivo.',
  },
  {
    ticker: 'Bopreales (Serie 1, 2, 3)',
    type: 'Bopreal',
    name: 'Bonos del Banco Central para Deuda Comercial',
    description: 'Bonos en USD emitidos por el BCRA para importadores y giro de utilidades retenidas, negociables en el mercado secundario.',
    mechanism: 'Cotizan en pesos y en dólares cable (especie C). Se usan como canal alternativo y formal de dolarización sin afectar reservas líquidas inmediatas.',
  },
];

export interface DolarRate {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export const calculateCedearArs = (usdPrice: number, ratio: number, cclRate: number): number => {
  if (ratio <= 0) return 0;
  return (usdPrice / ratio) * cclRate;
};

export const calculateImplicitCcl = (arsPrice: number, usdPrice: number, ratio: number): number => {
  if (usdPrice <= 0) return 0;
  return (arsPrice * ratio) / usdPrice;
};
