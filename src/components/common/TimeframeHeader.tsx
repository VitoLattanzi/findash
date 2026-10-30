'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CHANGE_TIMEFRAMES, ChangeTimeframe, getTimeframeOption } from '@/lib/timeframe';

interface TimeframeControlProps {
  timeframe: ChangeTimeframe;
  onTimeframeChange: (tf: ChangeTimeframe) => void;
  sortActive?: boolean;
  sortDir?: 1 | -1;
  onSortClick?: () => void;
  align?: 'left' | 'right';
}

export const TimeframeControl = ({
  timeframe,
  onTimeframeChange,
  sortActive = false,
  sortDir = -1,
  onSortClick,
  align = 'right',
}: TimeframeControlProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = getTimeframeOption(timeframe);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 select-none ${
        align === 'right' ? 'justify-end' : 'justify-start'
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-0.5 font-medium transition-colors hover:text-text ${
          open ? 'text-gold' : 'text-dim'
        }`}
        title="Cambiar período de variación porcentual"
      >
        <span>{current.label} %</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${open ? 'rotate-180 text-gold' : ''}`}
        />
      </button>

      {onSortClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortClick();
          }}
          className={`px-1 py-0.5 rounded text-[10px] leading-none transition-colors hover:bg-bg2 ${
            sortActive ? 'text-gold font-bold' : 'text-dim hover:text-text'
          }`}
          title="Ordenar por variación porcentual"
        >
          {sortActive ? (sortDir === 1 ? '▲' : '▼') : '↕'}
        </button>
      )}

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full mt-1 bg-[#12161e] border border-[#262d3b] rounded-[5px] shadow-xl z-30 py-1 min-w-[110px] text-left normal-case tracking-normal font-mono ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {CHANGE_TIMEFRAMES.map((opt) => {
            const isSelected = opt.key === timeframe;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onTimeframeChange(opt.key);
                  setOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-[11.5px] text-left flex items-center justify-between transition-colors hover:bg-[#1a2030] ${
                  isSelected ? 'text-[#d8ad3f] font-semibold bg-[#161b25]' : 'text-text/90'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="text-[#d8ad3f] text-[10px]">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
