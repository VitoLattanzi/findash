'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Layout, LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import { RotateCcw } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

export type ModularBreakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

export const MODULAR_BREAKPOINTS: Record<ModularBreakpoint, number> = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

export const MODULAR_COLS: Record<ModularBreakpoint, number> = {
  lg: 12,
  md: 12,
  sm: 6,
  xs: 4,
  xxs: 2,
};

export type ModularLayoutItem = Pick<
  LayoutItem,
  'i' | 'x' | 'y' | 'w' | 'h' | 'minW' | 'minH' | 'maxW' | 'maxH' | 'isResizable' | 'isDraggable'
>;

export interface ModularGridProps {
  children: React.ReactNode;
  layoutId: string;
  defaultLayout: ModularLayoutItem[];
  defaultLayouts?: Partial<Record<ModularBreakpoint, ModularLayoutItem[]>>;
  rowHeight?: number;
  margin?: readonly [number, number];
  containerPadding?: readonly [number, number];
  className?: string;
  showResetButton?: boolean;
}

const STORAGE_PREFIX = 'findash:layout:';

/**
 * Adapta un layout base de 12 columnas a cualquier breakpoint respetando minW/minH
 * sin desbordar las columnas disponibles del viewport.
 */
function buildBreakpointLayout(
  items: readonly ModularLayoutItem[],
  cols: number,
  stackVertical: boolean
): LayoutItem[] {
  let cursorY = 0;

  return items.map((item) => {
    const safeMinW = item.minW != null ? Math.min(item.minW, cols) : undefined;
    const safeW = stackVertical
      ? cols
      : Math.max(safeMinW ?? 1, Math.min(Math.round((item.w / 12) * cols) || 1, cols));
    const safeX = stackVertical ? 0 : Math.min(Math.round((item.x / 12) * cols), Math.max(0, cols - safeW));
    const safeY = stackVertical ? cursorY : item.y;

    if (stackVertical) {
      cursorY += item.h;
    }

    return {
      ...item,
      x: safeX,
      y: safeY,
      w: safeW,
      minW: safeMinW,
      maxW: item.maxW != null ? Math.min(item.maxW, cols) : undefined,
    };
  });
}

function buildDefaultResponsiveLayouts(
  defaultLayout: ModularLayoutItem[],
  customDefaults?: Partial<Record<ModularBreakpoint, ModularLayoutItem[]>>
): ResponsiveLayouts<ModularBreakpoint> {
  const clampList = (list: ModularLayoutItem[], cols: number): LayoutItem[] =>
    list.map((item) => ({
      ...item,
      w: Math.min(item.w, cols),
      x: Math.min(item.x, Math.max(0, cols - Math.min(item.w, cols))),
      minW: item.minW != null ? Math.min(item.minW, cols) : undefined,
      maxW: item.maxW != null ? Math.min(item.maxW, cols) : undefined,
    }));

  return {
    lg: customDefaults?.lg
      ? clampList(customDefaults.lg, MODULAR_COLS.lg)
      : defaultLayout.map((i) => ({ ...i })),
    md: customDefaults?.md
      ? clampList(customDefaults.md, MODULAR_COLS.md)
      : defaultLayout.map((i) => ({ ...i })),
    sm: customDefaults?.sm
      ? clampList(customDefaults.sm, MODULAR_COLS.sm)
      : buildBreakpointLayout(defaultLayout, MODULAR_COLS.sm, false),
    xs: customDefaults?.xs
      ? clampList(customDefaults.xs, MODULAR_COLS.xs)
      : buildBreakpointLayout(defaultLayout, MODULAR_COLS.xs, true),
    xxs: customDefaults?.xxs
      ? clampList(customDefaults.xxs, MODULAR_COLS.xxs)
      : buildBreakpointLayout(defaultLayout, MODULAR_COLS.xxs, true),
  };
}

/**
 * Fusiona un layout restaurado desde localStorage con el schema por defecto
 * para asegurar que se respeten minW/minH y aparezcan widgets nuevos si se agregan.
 */
function mergeStoredLayouts(
  stored: Partial<Record<ModularBreakpoint, LayoutItem[]>>,
  defaults: ResponsiveLayouts<ModularBreakpoint>
): ResponsiveLayouts<ModularBreakpoint> {
  const result: ResponsiveLayouts<ModularBreakpoint> = { ...defaults };

  (Object.keys(MODULAR_COLS) as ModularBreakpoint[]).forEach((bp) => {
    const defList = defaults[bp] ?? [];
    const savedList = stored[bp];
    if (!Array.isArray(savedList) || savedList.length === 0) return;

    const savedById = new Map(savedList.map((item) => [item.i, item]));
    const cols = MODULAR_COLS[bp];

    const merged: LayoutItem[] = defList.map((defItem) => {
      const saved = savedById.get(defItem.i);
      if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') {
        return defItem;
      }
      const w = Math.max(
        defItem.minW ?? 1,
        Math.min(typeof saved.w === 'number' ? saved.w : defItem.w, cols)
      );
      const h = Math.max(
        defItem.minH ?? 1,
        typeof saved.h === 'number' ? saved.h : defItem.h
      );
      const x = Math.max(0, Math.min(saved.x, Math.max(0, cols - w)));
      const y = Math.max(0, saved.y);

      return {
        ...defItem,
        x,
        y,
        w,
        h,
      };
    });

    result[bp] = merged;
  });

  return result;
}

export const ModularGrid: React.FC<ModularGridProps> = ({
  children,
  layoutId,
  defaultLayout,
  defaultLayouts,
  rowHeight = 32,
  margin = [14, 14],
  containerPadding = [0, 0],
  className = '',
  showResetButton = true,
}) => {
  const storageKey = `${STORAGE_PREFIX}${layoutId}`;

  const baseLayouts = useMemo(
    () => buildDefaultResponsiveLayouts(defaultLayout, defaultLayouts),
    [defaultLayout, defaultLayouts]
  );

  const [layouts, setLayouts] = useState<ResponsiveLayouts<ModularBreakpoint>>(baseLayouts);
  const [hasCustomLayout, setHasCustomLayout] = useState(false);
  const canPersistRef = useRef(false);

  // Hidrata el layout guardado de localStorage sin afectar el prerender SSR
  useEffect(() => {
    canPersistRef.current = false;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<ModularBreakpoint, LayoutItem[]>>;
          if (parsed && typeof parsed === 'object') {
            setLayouts(mergeStoredLayouts(parsed, baseLayouts));
            setHasCustomLayout(true);
          } else {
            setLayouts(baseLayouts);
            setHasCustomLayout(false);
          }
        } else {
          setLayouts(baseLayouts);
          setHasCustomLayout(false);
        }
      } catch {
        setLayouts(baseLayouts);
        setHasCustomLayout(false);
      } finally {
        // Habilita el guardado luego de completar la lectura inicial
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            canPersistRef.current = true;
          }
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey, baseLayouts]);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts<string>) => {
      if (!canPersistRef.current) return;
      const typedLayouts = allLayouts as ResponsiveLayouts<ModularBreakpoint>;
      setLayouts(typedLayouts);
      setHasCustomLayout(true);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(typedLayouts));
      } catch {
        // Ignora errores de cuota en modo privado
      }
    },
    [storageKey]
  );

  const handleResetLayout = useCallback(() => {
    setLayouts(baseLayouts);
    setHasCustomLayout(false);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignora error de storage
    }
  }, [baseLayouts, storageKey]);

  return (
    <div className={`w-full ${className}`}>
      {showResetButton && hasCustomLayout && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={handleResetLayout}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-bg2 hover:bg-card border border-line hover:border-gold/40 text-[11px] font-mono text-dim hover:text-gold transition-colors cursor-pointer"
            title="Restaurar posiciones y tamaños originales de los módulos"
          >
            <RotateCcw size={11} />
            <span>Restablecer diseño</span>
          </button>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={MODULAR_BREAKPOINTS}
        cols={MODULAR_COLS}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={containerPadding}
        draggableHandle=".draggable-handle"
        draggableCancel="button, input, select, a, textarea, [data-no-drag]"
        resizeHandles={['se']}
        isDraggable
        isResizable
        allowMobileScroll
        useCSSTransforms
        onLayoutChange={handleLayoutChange}
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
};
