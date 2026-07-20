'use client';

import { useRef, useState, useEffect, useMemo, ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  overscan?: number;
  renderRow: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

/**
 * Lista virtualizada simple (sin dependencias externas).
 * Solo renderiza las filas visibles + overscan para scroll suave.
 *
 * Útil para tablas admin con miles de filas (productos, eventos, waivers, etc.)
 * donde renderizar todo sería costoso.
 */
export function VirtualList<T>({
  items,
  rowHeight,
  overscan = 5,
  renderRow,
  emptyMessage = 'Sin resultados.',
  className = '',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    setViewportHeight(el.clientHeight);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan,
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  if (items.length === 0) {
    return (
      <div className={`card text-center py-12 text-text-muted ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto border border-border rounded-xl bg-white ${className}`}
      style={{ height: Math.min(viewportHeight, totalHeight + 2) || 600 }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * rowHeight,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: rowHeight }}>
              {renderRow(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
