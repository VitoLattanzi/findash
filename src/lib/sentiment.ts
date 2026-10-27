export type Sentiment = 'pos' | 'neg' | 'neu';

const POSITIVE = [
  'crecimiento',
  'crece',
  'récord',
  'record',
  'acuerdo',
  'inversión',
  'inversiones',
  'superávit',
  'superavit',
  'mejora',
  'mejoran',
  'recuperación',
  'recupera',
  'auge',
  'expansión',
  'expansión',
  'recorte de tasas',
  'baja la inflación',
  'desciende la inflación',
  'desregulación',
  'reforma',
  'estabilidad',
  'confianza',
  'sube la bolsa',
  'rallies',
  'gana',
  'ganó',
  'triunfo',
  'exportaciones récord',
  'empleo récord',
  'grado de inversión',
  'baja el riesgo país',
  'acuerdo con el fmi',
  'fmi',
  'privatización',
  'privatizaciones',
  'balanza comercial positiva',
  'desempleo baja',
  'pobreza baja',
];

const NEGATIVE = [
  'crisis',
  'recesión',
  'recesion',
  'default',
  'devaluación',
  'devaluacion',
  'fuga de capitales',
  'déficit',
  'deficit',
  'desempleo',
  'corrupción',
  'corrupcion',
  'escándalo',
  'escandalo',
  'huelga',
  'protesta',
  'protestas',
  'caída',
  'caida',
  'desplome',
  'derrumbe',
  'se hunde',
  'robo',
  'robos',
  'inseguridad',
  'violencia',
  'narcotráfico',
  'narco',
  'guerra',
  'sanciones',
  'impago',
  'suba de impuestos',
  'ajuste',
  'fraude',
  'quiebre',
  'quiebra',
  'inflación',
  'inflacion',
  'pobreza',
  'saqueo',
  'disturbios',
  'represión',
  'izquierda',
  'populismo',
  'control de precios',
  'cepo',
  'dólar blue',
  'deuda',
  'protesta social',
  'conflicto',
  'tensión',
  'tension',
  'renuncia',
  'estafa',
  'cierre de empresas',
  'despidos',
  'contracción',
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const POS_N = POSITIVE.map(normalize);
const NEG_N = NEGATIVE.map(normalize);

export function scoreText(text: string): number {
  const t = normalize(text);
  let score = 0;
  for (const w of POS_N) if (t.includes(w)) score += 1;
  for (const w of NEG_N) if (t.includes(w)) score -= 1;
  return score;
}

export function classify(text: string): Sentiment {
  const s = scoreText(text);
  if (s > 0) return 'pos';
  if (s < 0) return 'neg';
  return 'neu';
}
