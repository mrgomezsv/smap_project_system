'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { VirtualList } from '@/components/ui/VirtualList';
import { api, ApiError } from '@/lib/api';
import { CATEGORY_LABELS, type Product } from '@/lib/types';

const VIRTUAL_THRESHOLD = 100;
type ViewMode = 'table' | 'kanban';

export function ProductosList() {
  const tPh = useTranslations('placeholders');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<{ items: Product[] }>('/api/products?take=100');
        if (!cancelled) setProducts(res.items);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Error al cargar productos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  // Agrupar por categorías para la vista Kanban
  const kanbanColumns = useMemo(() => {
    const categories = Array.from(new Set(products.map((p) => p.category)));
    return categories.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      items: filtered.filter((p) => p.category === cat),
    }));
  }, [products, filtered]);

  const useVirtual = filtered.length > VIRTUAL_THRESHOLD;

  const columns: Column<Product>[] = [
    {
      key: 'title',
      label: 'Producto',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
            {p.img && !p.img.includes('default') ? (
              <img src={`/media/${p.img}`} alt={p.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">🎪</div>
            )}
          </div>
          <a href={`/productos/${p.id}`} className="font-semibold text-text-primary hover:text-primary">
            {p.title}
          </a>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (p) => (
        <span className="text-text-muted">{CATEGORY_LABELS[p.category] ?? p.category}</span>
      ),
    },
    {
      key: 'price',
      label: 'Precio',
      align: 'right',
      render: (p) => (
        <span className="font-semibold text-text-primary">
          {p.price ? `$${p.price.toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'publicated',
      label: 'Estado',
      render: (p) =>
        p.publicated ? (
          <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            Publicado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            Borrador
          </span>
        ),
    },
  ];

  if (loading) {
    return <div className="card text-center py-12 text-text-muted">Cargando productos…</div>;
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
        ⚠ {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de Búsqueda y Selector de Vista */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="max-w-md flex-1">
          <input
            type="search"
            placeholder={tPh('searchProducts')}
            className="input w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'table' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span>📋</span> Tabla
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'kanban' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span>📊</span> Kanban por Categoría
          </button>
        </div>
      </div>

      {/* VISTA KANBAN */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => (
            <div key={col.category} className="bg-surface rounded-2xl border border-border p-4 flex flex-col h-[calc(100vh-280px)] min-w-[280px]">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <h3 className="font-heading font-extrabold text-sm text-text-primary truncate">
                  {col.label}
                </h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {col.items.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {col.items.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-muted">Sin productos</div>
                ) : (
                  col.items.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-border p-3 shadow-xs hover:shadow-medium hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="aspect-[16/9] rounded-lg bg-gray-100 overflow-hidden mb-2 relative">
                        {p.img && !p.img.includes('default') ? (
                          <img src={`/media/${p.img}`} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🎪</div>
                        )}
                        <span className="absolute top-2 right-2">
                          {p.publicated ? (
                            <span className="bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              Publicado
                            </span>
                          ) : (
                            <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              Borrador
                            </span>
                          )}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                        {p.title}
                      </h4>

                      <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-border">
                        <span className="font-extrabold text-primary">
                          {p.price ? `$${p.price.toFixed(2)}` : '—'}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`/productos/${p.id}`}
                            className="p-1 text-text-muted hover:text-primary rounded"
                            title="Ver"
                            target="_blank"
                          >
                            👁
                          </a>
                          <a
                            href={`/admin/productos/${p.id}/editar`}
                            className="p-1 text-text-muted hover:text-primary rounded"
                            title="Editar"
                          >
                            ✏️
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISTA TABLA ORIGINAL */
        <div>
          {useVirtual ? (
            <div className="card p-0 overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_120px_140px_80px] gap-0 bg-surface border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">
                <div>Producto</div>
                <div>Categoría</div>
                <div className="text-right">Precio</div>
                <div>Estado</div>
                <div></div>
              </div>
              <VirtualList
                items={filtered}
                rowHeight={64}
                renderRow={(p) => (
                  <div className="grid grid-cols-[2fr_1fr_120px_140px_80px] gap-0 items-center px-4 border-b border-border h-16 hover:bg-surface transition">
                    {columns.slice(0, 4).map((c) => (
                      <div key={c.key} className={c.align === 'right' ? 'text-right' : ''}>
                        {c.render ? c.render(p) : null}
                      </div>
                    ))}
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/productos/${p.id}`}
                        className="text-text-muted hover:text-primary p-1"
                        title="Ver en sitio público"
                        target="_blank"
                      >
                        👁
                      </a>
                      <a
                        href={`/admin/productos/${p.id}/editar`}
                        className="text-text-muted hover:text-primary p-1"
                        title="Editar"
                      >
                        ✏️
                      </a>
                    </div>
                  </div>
                )}
                emptyMessage="No hay productos que coincidan con la búsqueda."
              />
            </div>
          ) : (
            <DataTable
              rows={filtered}
              columns={columns}
              rowKey={(p) => p.id}
              selectable
              emptyMessage="No hay productos que coincidan con la búsqueda."
              rowActions={(p) => (
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={`/productos/${p.id}`}
                    className="text-text-muted hover:text-primary p-1"
                    title="Ver en sitio público"
                    target="_blank"
                  >
                    👁
                  </a>
                  <a
                    href={`/admin/productos/${p.id}/editar`}
                    className="text-text-muted hover:text-primary p-1"
                    title="Editar"
                  >
                    ✏️
                  </a>
                </div>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
