'use client';
import React, { useId } from 'react';

interface SparklineProps {
  data: number[];
  change: number;
  width?: number;
  height?: number;
  className?: string;
}

export const Sparkline = ({ data, change, width = 100, height = 30, className }: SparklineProps) => {
  const gradId = useId().replace(/:/g, '');
  const up = change >= 0;
  const color = up ? 'var(--teal)' : 'var(--red)';

  const values = (data || []).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (values.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--line)" strokeDasharray="2,2" />
      </svg>
    );
  }

  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const lastIndex = values.length - 1;

  const coords = values.map((v, i) => {
    const x = (i / lastIndex) * width;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  const baselineY = pad + (1 - (values[0] - min) / range) * (height - pad * 2);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <line
        x1="0"
        y1={baselineY}
        x2={width}
        y2={baselineY}
        stroke="var(--dim)"
        strokeOpacity="0.5"
        strokeWidth="1"
        strokeDasharray="2,2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
