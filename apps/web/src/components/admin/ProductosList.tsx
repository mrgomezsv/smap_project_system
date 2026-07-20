'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { VirtualList } from '@/components/ui/VirtualList';
import { api, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import { CATEGORY_LABELS, type Product } from '@/lib/types';

const VIRTUAL_THRESHOLD = 100;

export function ProductosList() {
  const tPh = useTranslations('placeholders');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<{ items: Product[] }>('/api/products?take=200');
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
    <div>
      <div className="mb-4 max-w-md">
        <input
          type="search"
          placeholder={tPh('searchProducts')}
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filtered.length > VIRTUAL_THRESHOLD && (
          <p className="text-xs text-text-muted mt-2">
            ⚡ {filtered.length} filas — usando virtualización para mejor performance
          </p>
        )}
      </div>

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
  );
}
