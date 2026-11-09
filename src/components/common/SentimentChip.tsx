'use client';
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type SentimentValue = 'positivo' | 'negativo' | 'neutral' | null | undefined;

export function classifyFinancialSentiment(title: string): 'positivo' | 'negativo' | 'neutral' {
  const t = title.toLowerCase();

  // Contextos macro donde "sube / récord / máximo / supera" es BAJISTA (Riesgo País, Inflación, Desempleo, Déficit)
  const invertedMacroTerms = ['riesgo país', 'riesgo pais', 'inflación', 'inflacion', 'desempleo', 'déficit', 'deficit', 'pobreza'];
  const upwardWords = ['sube', 'subió', 'récord', 'record', 'máximo', 'maximo', 'trepa', 'salta', 'dispara', 'supera', 'arriba de', 'acelera', 'escala'];
  const downwardWords = ['baja', 'bajó', 'cae', 'cayó', 'desploma', 'retrocede', 'perfora', 'mínimo', 'minimo', 'desacelera', 'cede', 'alivio'];

  for (const macro of invertedMacroTerms) {
    if (t.includes(macro)) {
      if (upwardWords.some((w) => t.includes(w))) return 'negativo';
      if (downwardWords.some((w) => t.includes(w))) return 'positivo';
    }
  }

  const strongNegative = [
    'cae ',
    'caen ',
    'cayó',
    'caída',
    'baja ',
    'bajan ',
    'desploma',
    'desplome',
    'derrumba',
    'derrumbe',
    'hunde',
    'pérdida',
    'perdida',
    'recorta proyecciones',
    'recorte de proyecciones',
    'no alcanza estimaciones',
    'debajo de lo esperado',
    'quiebra',
    'colapso',
    'recesión',
    'recesion',
    'estafa',
    'sanción',
    'multa',
    'bajista',
    'bear',
    'en rojo',
    'retrocede',
    'castiga',
    'temor',
    'incertidumbre',
    'liquidación',
    'guerra comercial',
    'default',
  ];

  const strongPositive = [
    'sube ',
    'suben ',
    'subió',
    'gana ',
    'ganan ',
    'alcista',
    'récord de ganancias',
    'récord de ingresos',
    'máximo histórico',
    'ath',
    'rally',
    'se dispara',
    'impulsa',
    'crece ',
    'crecen ',
    'supera estimaciones',
    'supera expectativas',
    'bate récord',
    'bull',
    'repunta',
    'rebota',
    'en verde',
    'sólidos resultados',
    'fuerte demanda',
    'aprobación',
  ];

  let pos = 0;
  let neg = 0;

  for (const w of strongPositive) {
    if (t.includes(w)) pos++;
  }
  for (const w of strongNegative) {
    if (t.includes(w)) neg++;
  }

  // Solo devolvemos positivo o negativo cuando la señal es inequívoca
  if (pos > neg && pos >= 1) return 'positivo';
  if (neg > pos && neg >= 1) return 'negativo';
  return 'neutral';
}

interface SentimentChipProps {
  sentiment?: SentimentValue;
  title?: string;
}

export const SentimentChip = ({ sentiment, title }: SentimentChipProps) => {
  const resolved = title ? classifyFinancialSentiment(title) : sentiment;

  if (resolved !== 'positivo' && resolved !== 'negativo') {
    return null;
  }

  const isPos = resolved === 'positivo';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-semibold border ${
        isPos
          ? 'bg-teal/15 text-teal border-teal/30'
          : 'bg-red/15 text-red border-red/30'
      }`}
    >
      {isPos ? (
        <>
          <TrendingUp size={10} />
          <span>▲ Alcista</span>
        </>
      ) : (
        <>
          <TrendingDown size={10} />
          <span>▼ Bajista</span>
        </>
      )}
    </span>
  );
};
