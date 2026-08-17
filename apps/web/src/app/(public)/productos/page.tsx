import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { api } from '@/lib/api';
import type { Product, ProductsListResponse } from '@/lib/types';
import { CATEGORY_LABELS, type Category } from '@/lib/types';
import { ProductCard } from '@/components/public/ProductCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParams {
  category?: string;
  search?: string;
  take?: string;
  skip?: string;
  prompt?: string;
}

const ALL_CATEGORIES: Array<{ key: Category; emoji: string }> = [
  { key: 'option1', emoji: '🎪' },
  { key: 'option2', emoji: '⚡' },
  { key: 'option3', emoji: '🪑' },
  { key: 'option4', emoji: '🍿' },
  { key: 'option5', emoji: '🏆' },
  { key: 'option6', emoji: '🎁' },
  { key: 'option7', emoji: '💦' },
  { key: 'toros_mecanicos', emoji: '🐂' },
  { key: 'trenes_electricos', emoji: '🚂' },
  { key: 'kiddie_ride', emoji: '🎠' },
  { key: 'maquina_espuma', emoji: '🫧' },
  { key: 'game_trailer', emoji: '🎮' },
  { key: 'robots_led', emoji: '🤖' },
  { key: 'shots_carts', emoji: '🍹' },
  { key: 'obstacle_course', emoji: '🏃' },
];

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const tCatalog = await getTranslations('catalog');
  const tCategories = await getTranslations('categories');
  const locale = await getLocale();

  const selectedCategory = searchParams.category as Category | undefined;
  const search = searchParams.search ?? '';
  const skip = Number(searchParams.skip ?? 0);
  const take = Number(searchParams.take ?? 100);
  const isBookPrompt = searchParams.prompt === 'book';

  let data: ProductsListResponse = { items: [], total: 0, skip, take };
  let dbCategories: Array<{ key: string; name: string; emoji: string }> = [];

  try {
    const query = new URLSearchParams();
    if (selectedCategory) query.set('category', selectedCategory);
    if (search) query.set('search', search);
    query.set('publicated', 'true');
    query.set('skip', String(skip));
    query.set('take', String(take));
    query.set('lang', locale);

    const [productsRes, categoriesRes] = await Promise.all([
      api.get<ProductsListResponse>(`/api/products?${query.toString()}`),
      api.get<Array<{ id: number; slug: string; name: string; emoji: string }>>(`/api/categories?lang=${locale}`).catch(() => []),
    ]);

    data = productsRes;
    if (categoriesRes && categoriesRes.length > 0) {
      dbCategories = categoriesRes.map((c) => ({
        key: c.slug,
        name: c.name,
        emoji: c.emoji,
      }));
    }
  } catch (e) {
    console.error('Error cargando productos:', e);
  }

  // Si se obtuvieron categorías de la BD, usarlas; de lo contrario fallback a ALL_CATEGORIES
  const visibleCategories = dbCategories.length > 0
    ? dbCategories
    : ALL_CATEGORIES.map((c) => ({
        key: c.key,
        name: tCategories.has(c.key) ? tCategories(c.key) : (c.key in CATEGORY_LABELS ? CATEGORY_LABELS[c.key as keyof typeof CATEGORY_LABELS] : c.key),
        emoji: c.emoji,
      }));

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
        {/* Burbuja informativa cuando se pulsa en "Reservar" */}
        {isBookPrompt && (
          <div className="mb-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-brand-yellow/20 via-primary/10 to-party-pink/20 border-2 border-brand-yellow/60 shadow-medium flex items-center gap-4 animate-bounce-short">
            <span className="text-3xl shrink-0">💡</span>
            <div className="flex-1">
              <p className="text-sm md:text-base font-bold text-text-primary">
                {tCatalog('bookPrompt')}
              </p>
            </div>
            <Link
              href="/productos"
              className="text-xs text-text-muted hover:text-text-primary underline font-medium shrink-0"
            >
              ✕
            </Link>
          </div>
        )}
        {/* Filtros horizontales (chips) con scroll deslizable en móviles */}
        <div className="mb-8 flex overflow-x-auto no-scrollbar py-2 gap-2 -mx-4 px-4 snap-x md:flex-wrap md:mx-0 md:px-0">
          <Link
            href="/productos"
            className={`shrink-0 snap-start px-4 py-2.5 rounded-full text-sm font-medium transition active:scale-95 ${
              !selectedCategory
                ? 'bg-primary text-white shadow-soft font-semibold'
                : 'bg-white text-text-primary border border-border hover:border-primary'
            }`}
          >
            {tCatalog('all')}
          </Link>
          {visibleCategories.map((cat) => (
            <Link
              key={cat.key}
              href={`/productos?category=${cat.key}`}
              className={`shrink-0 snap-start px-4 py-2.5 rounded-full text-sm font-medium transition active:scale-95 ${
                selectedCategory === cat.key
                  ? 'bg-primary text-white shadow-soft font-semibold'
                  : 'bg-white text-text-primary border border-border hover:border-primary'
              }`}
            >
              <span className="mr-1.5">{cat.emoji}</span>
              {cat.name}
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
