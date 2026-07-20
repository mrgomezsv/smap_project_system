'use client';

import Link from 'next/link';
import { ProductosList } from '@/components/admin/ProductosList';

export default function AdminProductosPage() {
  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">Productos</h1>
          <p className="text-text-muted mt-1">Gestiona el catálogo de productos</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn btn-primary">
          + Crear producto
        </Link>
      </header>
      <ProductosList />
    </div>
  );
}
