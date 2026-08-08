'use client';

import { ReactNode, useState } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  selectable?: boolean;
  emptyMessage?: string;
  bulkActions?: (selected: T[]) => ReactNode;
  rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectable = false,
  emptyMessage = 'Sin resultados.',
  bulkActions,
  rowActions,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map(rowKey)));
    }
  }

  function toggleRow(key: string | number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const selectedRows = rows.filter((r) => selected.has(rowKey(r)));

  return (
    <div className="card p-0 overflow-hidden">
      {selectedRows.length > 0 && bulkActions && (
        <div className="bg-primary/5 border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-text-primary font-medium">
            {selectedRows.length} seleccionado{selectedRows.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">{bulkActions(selectedRows)}</div>
        </div>
      )}

      {/* Vista de Tarjetas para Pantallas Móviles (< md) */}
      <div className="block md:hidden divide-y divide-border">
        {rows.length === 0 ? (
          <div className="text-center py-12 text-text-muted px-4">{emptyMessage}</div>
        ) : (
          rows.map((row) => {
            const key = rowKey(row);
            const isSelected = selected.has(key);
            return (
              <div
                key={key}
                className={[
                  'p-4 space-y-3 transition',
                  isSelected ? 'bg-primary/5' : 'bg-white',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(key)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      aria-label="Seleccionar fila"
                    />
                  )}
                  {rowActions && <div className="ml-auto flex items-center gap-2">{rowActions(row)}</div>}
                </div>

                <div className="space-y-2 text-sm">
                  {columns.map((c) => (
                    <div key={c.key} className="flex justify-between items-baseline gap-4">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider shrink-0">
                        {c.label}
                      </span>
                      <div className="text-right text-text-primary font-medium break-all">
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista de Tabla para Escritorio (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              {selectable && (
                <th className="w-12 py-3 px-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={[
                    'py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  ].join(' ')}
                >
                  {c.label}
                </th>
              ))}
              {rowActions && <th className="w-20 py-3 px-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="text-center py-12 text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = rowKey(row);
                const isSelected = selected.has(key);
                return (
                  <tr
                    key={key}
                    className={[
                      'border-b border-border last:border-b-0 hover:bg-surface transition',
                      isSelected ? 'bg-primary/5' : '',
                    ].join(' ')}
                  >
                    {selectable && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          aria-label="Seleccionar fila"
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={[
                          'py-3 px-4',
                          c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                        ].join(' ')}
                      >
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                      </td>
                    ))}
                    {rowActions && <td className="py-3 px-4 text-right">{rowActions(row)}</td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
