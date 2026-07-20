import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = { title: 'Crear producto - Admin' };

export default function NuevoProductoPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Nuevo producto</h1>
        <p className="text-text-muted mt-1">Agrega un nuevo producto o servicio al catálogo.</p>
      </header>
      <ProductForm mode="create" />
    </div>
  );
}
