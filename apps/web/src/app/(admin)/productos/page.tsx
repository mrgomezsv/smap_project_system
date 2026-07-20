'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { api, ApiError } from '@/lib/api';
import { CATEGORY_LABELS, type Product } from '@/lib/types';

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

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
          <Link href={`/productos/${p.id}`} className="font-semibold text-text-primary hover:text-primary">
            {p.title}
          </Link>
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

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">Productos</h1>
          <p className="text-text-muted mt-1">
            {filtered.length} producto{filtered.length === 1 ? '' : 's'} en catálogo
          </p>
        </div>
        <Link href="/productos/nuevo" className="btn btn-primary">
          + Crear producto
        </Link>
      </header>

      <div className="mb-4 max-w-md">
        <input
          type="search"
          placeholder="Buscar por nombre…"
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando productos…</div>
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(p) => p.id}
          selectable
          emptyMessage="No hay productos que coincidan con la búsqueda."
          rowActions={(p) => (
            <div className="flex items-center justify-end gap-1">
              <Link
                href={`/productos/${p.id}`}
                className="text-text-muted hover:text-primary p-1"
                title="Ver en sitio público"
                target="_blank"
              >
                👁
              </Link>
              <Link
                href={`/productos/${p.id}/editar`}
                className="text-text-muted hover:text-primary p-1"
                title="Editar"
              >
                ✏️
              </Link>
            </div>
          )}
        />
      )}
    </div>
  );
}
