import React from 'react';

interface SparklineProps {
  data: number[]; // Array of percentage values (0-100)
  change: number; // For color coding
}

export const Sparkline = ({ data, change }: SparklineProps) => {
  const color = change >= 0 ? "var(--teal)" : "var(--red)";
  const width = 100;
  const height = 30;
  
  // Simple path generator for a sparkline
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / 100) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
      <polygon
        fill="url(#grad)"
        points={`0,${height} ${points} ${width},${height}`}
      />
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="var(--line)"
        strokeDasharray="2,2"
      />
    </svg>
  );
};
