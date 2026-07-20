import { notFound } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { ProductForm } from '@/components/admin/ProductForm';
import type { Product } from '@/lib/types';

interface PageProps {
  params: { id: string };
}

export default async function EditarProductoPage({ params }: PageProps) {
  let product: Product;
  try {
    product = await api.get<Product>(`/api/products/${params.id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Editar producto</h1>
        <p className="text-text-muted mt-1 truncate">{product.title}</p>
      </header>
      <ProductForm mode="edit" initial={product} />
    </div>
  );
}
