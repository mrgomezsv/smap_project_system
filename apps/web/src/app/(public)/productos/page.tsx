import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { api } from '@/lib/api';
import type { Product, ProductsListResponse } from '@/lib/types';
import { type Category } from '@/lib/types';
import { ProductCard } from '@/components/public/ProductCard';

interface SearchParams {
  category?: string;
  search?: string;
  take?: string;
  skip?: string;
}

const ALL_CATEGORIES: Array<{ key: Category; emoji: string }> = [
  { key: 'option1', emoji: '🎪' },
  { key: 'option2', emoji: '⚡' },
  { key: 'option3', emoji: '🪑' },
  { key: 'option4', emoji: '🍿' },
  { key: 'option5', emoji: '🏆' },
  { key: 'option6', emoji: '🎁' },
  { key: 'option7', emoji: '💦' },
];

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const tCatalog = await getTranslations('catalog');
  const tCategories = await getTranslations('categories');

  const selectedCategory = searchParams.category as Category | undefined;
  const search = searchParams.search ?? '';
  const skip = Number(searchParams.skip ?? 0);
  const take = Number(searchParams.take ?? 24);

  let data: ProductsListResponse = { items: [], total: 0, skip, take };
  try {
    const query = new URLSearchParams();
    if (selectedCategory) query.set('category', selectedCategory);
    if (search) query.set('search', search);
    query.set('publicated', 'true');
    query.set('skip', String(skip));
    query.set('take', String(take));

    data = await api.get<ProductsListResponse>(`/api/products?${query.toString()}`);
  } catch (e) {
    console.error('Error cargando productos:', e);
  }

  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              {tCatalog('badge')}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
              {tCatalog('title')}
            </h1>
            <p className="text-white/80 text-lg">
              {data.total} {data.total === 1 ? tCatalog('availableSingle') : tCatalog('availablePlural')}
              {selectedCategory && tCatalog('inCategory', { category: tCategories(selectedCategory) })}
            </p>
          </div>
        </div>
      </section>

      <div className="container py-10">
        {/* Filtros horizontales (chips) */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/productos"
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !selectedCategory
                ? 'bg-primary text-white shadow-soft'
                : 'bg-white text-text-primary border border-border hover:border-primary'
            }`}
          >
            {tCatalog('all')}
          </Link>
          {ALL_CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/productos?category=${cat.key}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat.key
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white text-text-primary border border-border hover:border-primary'
              }`}
            >
              <span className="mr-1">{cat.emoji}</span>
              {tCategories(cat.key)}
            </Link>
          ))}
        </div>

        {/* Grid de productos */}
        {data.items.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4 opacity-40">🎪</div>
            <h3 className="text-xl font-heading font-bold mb-2">
              {tCatalog('notFound')}
            </h3>
            <p className="text-text-muted mb-6">
              {tCatalog('notFoundDesc')}
            </p>
            <Link href="/productos" className="btn btn-primary">
              {tCatalog('viewAll')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.items.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
