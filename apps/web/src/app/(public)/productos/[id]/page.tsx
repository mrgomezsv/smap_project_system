import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { api, ApiError } from '@/lib/api';
import type { Product } from '@/lib/types';
import { type Category } from '@/lib/types';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tCategories = await getTranslations('categories');
  try {
    const product = await api.get<Product>(`/api/products/${params.id}`);
    const description =
      product.description?.slice(0, 160) ??
      `${product.title} — ${tCategories(product.category as Category)}`;
    return {
      title: product.title,
      description,
      openGraph: {
        title: product.title,
        description,
        images: product.img && !product.img.includes('default')
          ? [{ url: `/media/${product.img}`, width: 800, height: 600, alt: product.title }]
          : [],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Producto no encontrado' };
  }
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const tProduct = await getTranslations('product');
  const tNav = await getTranslations('nav');
  const tCategories = await getTranslations('categories');
  const tHome = await getTranslations('home');

  let product: Product;
  try {
    product = await api.get<Product>(`/api/products/${params.id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
    throw e;
  }

  const gallery: string[] = [product.img, product.img1, product.img2, product.img3, product.img4, product.img5]
    .filter((img) => img && !img.includes('default_product_image'));

  const hasGallery = gallery.length > 0;

  return (
    <div className="bg-surface min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-surface-elevated border-b border-border">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary">{tNav('home')}</Link>
            <span>/</span>
            <Link href="/productos" className="hover:text-primary">{tNav('products')}</Link>
            <span>/</span>
            <span className="text-text-primary font-medium truncate">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ===== GALERÍA ===== */}
          <div>
            {hasGallery ? (
              <div className="space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-medium">
                  <img
                    src={`/media/${gallery[0]}`}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {gallery.slice(1, 5).map((img, i) => (
                      <button
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition"
                      >
                        <img
                          src={`/media/${img}`}
                          alt={`${product.title} ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-party-pink/20 flex items-center justify-center text-9xl">
                🎪
              </div>
            )}
          </div>

          {/* ===== INFO + RESERVA ===== */}
          <div>
            <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-3">
              {tCategories(product.category as Category)}
            </span>

            <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary leading-tight">
              {product.title}
            </h1>

            <div className="mt-4 flex items-baseline gap-4">
              {product.price ? (
                <p className="text-4xl font-extrabold text-primary">
                  ${product.price.toFixed(2)}
                  <span className="text-base font-normal text-text-muted">{tProduct('perEvent')}</span>
                </p>
              ) : (
                <span className="text-text-muted">{tProduct('priceUponRequest')}</span>
              )}
              {product.publicated && (
                <span className="inline-flex items-center gap-1.5 text-success text-sm font-medium">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  {tProduct('available')}
                </span>
              )}
            </div>

            {/* Specs rápidas */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {product.dimensions && (
                <div className="card !p-3 text-center">
                  <p className="text-xs text-text-muted">{tProduct('specs.dimensions')}</p>
                  <p className="font-bold text-text-primary text-sm mt-0.5">{product.dimensions}</p>
                </div>
              )}
              {product.space && (
                <div className="card !p-3 text-center">
                  <p className="text-xs text-text-muted">{tProduct('specs.space')}</p>
                  <p className="font-bold text-text-primary text-sm mt-0.5">{product.space}</p>
                </div>
              )}
              {product.circuits && (
                <div className="card !p-3 text-center">
                  <p className="text-xs text-text-muted">{tProduct('specs.circuits')}</p>
                  <p className="font-bold text-text-primary text-sm mt-0.5">{product.circuits}</p>
                </div>
              )}
            </div>

            {/* Descripción */}
            {product.description && (
              <div className="mt-6">
                <h2 className="text-lg font-heading font-bold mb-2">{tProduct('description')}</h2>
                <p className="text-text-primary leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Tabs sticky de reserva */}
            <div className="mt-8 sticky bottom-4 bg-white rounded-2xl shadow-large border border-border p-6">
              <h3 className="font-heading font-bold mb-3">{tProduct('interested')}</h3>
              <div className="flex gap-3">
                <Link
                  href="/checkout"
                  className="btn btn-primary flex-1 py-3 text-base shadow-medium hover:shadow-large"
                >
                  {tProduct('bookNow')}
                </Link>
                <a
                  href={`https://wa.me/13478704240?text=Hola%2C%20me%20interesa%20el%20producto%20${product.title}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn bg-success text-white hover:bg-success/90 px-5"
                >
                  WhatsApp
                </a>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                {tProduct('contactHelp')}
              </p>
            </div>
          </div>
        </div>

        {/* Sección info adicional */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-heading font-bold mb-1">{tHome('trust.delivery')}</h3>
            <p className="text-sm text-text-muted">
              {tHome('trust.deliveryDesc')}
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="font-heading font-bold mb-1">{tHome('trust.certified')}</h3>
            <p className="text-sm text-text-muted">
              {tHome('trust.certifiedDesc')}
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-heading font-bold mb-1">{tHome('trust.experience')}</h3>
            <p className="text-sm text-text-muted">
              {tHome('trust.experienceDesc')}
            </p>
          </div>
        </div>

        {/* Comentarios placeholder */}
        <div className="mt-16">
          <h2 className="text-2xl font-heading font-bold mb-6">
            {tProduct('comments')} ({product._count?.comments ?? 0})
          </h2>
          <div className="card text-center py-12">
            <div className="text-5xl mb-3 opacity-30">💬</div>
            <p className="text-text-muted">
              {tProduct('commentsPlaceholder')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
