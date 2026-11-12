'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Envoltorio modular para hacer arrastrable y reordenable cualquier widget del Dashboard.
 * Usa `useSortable` de @dnd-kit/sortable y expone un handle en la esquina superior derecha
 * para no interferir con clics, links ni inputs internos de la tarjeta.
 */
export const SortableWidget = ({ id, children, className = '' }: SortableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const normalizedTransform = transform
    ? { ...transform, scaleX: 1, scaleY: 1 }
    : null;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(normalizedTransform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group h-full transition-shadow ${
        isDragging
          ? 'z-30 opacity-90 shadow-2xl ring-1 ring-gold/60 rounded-[6px]'
          : ''
      } ${className}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar tarjeta"
        title="Arrastrar para mover tarjeta"
        className="absolute top-2.5 right-2.5 z-20 p-1 rounded-[4px] text-dim/60 opacity-60 group-hover:opacity-100 group-hover:text-dim hover:!text-gold hover:bg-bg2/90 transition-all cursor-grab active:cursor-grabbing touch-none"
      >
        <GripHorizontal size={15} />
      </button>

      {children}
    </div>
  );
};
