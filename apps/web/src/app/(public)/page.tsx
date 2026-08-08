import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { ProductCard } from '@/components/public/ProductCard';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { type Category } from '@/lib/types';

const HERO_IMG = '/media/product_images/barbie_bounce_house/barbie_bounce_house_01.jpeg';

const ALL_FEATURED_CATEGORIES: Array<{ key: Category; emoji: string; bg: string }> = [
  { key: 'option1', emoji: '🎪', bg: 'from-party-pink/20 to-brand-yellow/20' },
  { key: 'option2', emoji: '⚡', bg: 'from-primary/20 to-info/20' },
  { key: 'option3', emoji: '🪑', bg: 'from-brand-yellow/20 to-party-pink/20' },
  { key: 'option4', emoji: '🍿', bg: 'from-warning/20 to-brand-yellow/20' },
  { key: 'option5', emoji: '🏆', bg: 'from-info/20 to-success/20' },
  { key: 'option6', emoji: '🎁', bg: 'from-primary/20 to-party-pink/20' },
  { key: 'option7', emoji: '💦', bg: 'from-success/20 to-info/20' },
  { key: 'toros_mecanicos', emoji: '🐂', bg: 'from-warning/20 to-primary/20' },
  { key: 'trenes_electricos', emoji: '🚂', bg: 'from-info/20 to-brand-yellow/20' },
  { key: 'kiddie_ride', emoji: '🎠', bg: 'from-party-pink/20 to-info/20' },
  { key: 'maquina_espuma', emoji: '🫧', bg: 'from-info/20 to-success/20' },
  { key: 'game_trailer', emoji: '🎮', bg: 'from-primary/20 to-warning/20' },
  { key: 'robots_led', emoji: '🤖', bg: 'from-brand-yellow/20 to-primary/20' },
  { key: 'shots_carts', emoji: '🍹', bg: 'from-party-pink/20 to-warning/20' },
];

export default async function HomePage() {
  const tHero = await getTranslations('hero');
  const tHome = await getTranslations('home');
  const tCategories = await getTranslations('categories');
  const tProduct = await getTranslations('product');
  const locale = await getLocale();

  let products: Product[] = [];
  let activeCategoriesSet: Set<string> = new Set();

  try {
    const res = await api.get<{ items: Product[] }>(`/api/products?take=100&publicated=true&lang=${locale}`);
    products = res.items;
    activeCategoriesSet = new Set(products.map((p) => p.category));
  } catch (e) {
    console.error('Error cargando productos:', e);
  }

  const activeFeaturedCategories = ALL_FEATURED_CATEGORIES.filter((cat) =>
    activeCategoriesSet.has(cat.key)
  );

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        {/* Background image con overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="container relative z-10 text-white">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold leading-[1.05] mb-6">
              {tHero.rich('title', {
                br: () => <br />,
                yellow: (chunks) => <span className="text-brand-yellow">{chunks}</span>
              })}
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {tHero.rich('subtitle', {
                yellow: (chunks) => <span className="font-semibold text-brand-yellow">{chunks}</span>
              })}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/productos"
                className="btn btn-secondary px-8 py-4 text-lg shadow-large hover:shadow-glow"
              >
                {tHero('cta')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/sobre-nosotros"
                className="btn bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 text-lg hover:bg-white/20"
              >
                {tHero('secondaryCta')}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{tHome('trust.experience')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{tHome('trust.delivery')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{tHome('trust.certified')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/70">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ===== CATEGORÍAS DESTACADAS ===== */}
      <section className="py-20 bg-surface-elevated">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-primary">
              {tHome('categories')}
            </h2>
            <p className="mt-3 text-text-muted text-lg">
              {tHome('categoriesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {activeFeaturedCategories.map((cat) => (
              <Link
                key={cat.key}
                href={`/productos?category=${cat.key}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.bg} border-2 border-white p-6 text-center hover:scale-[1.03] hover:shadow-large transition-all`}
              >
                <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </div>
                <p className="font-heading font-bold text-text-primary text-sm">
                  {tCategories(cat.key)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCTOS POPULARES ===== */}
      <section className="py-20 bg-surface">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-primary">
                {tHome('popularProducts')}
              </h2>
              <p className="mt-3 text-text-muted text-lg">
                {tHome('popularProductsSubtitle')}
              </p>
            </div>
            <Link
              href="/productos"
              className="hidden sm:inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              {tHome('viewAll')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-700 text-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              {tHome('howItWorks')}
            </h2>
            <p className="mt-3 text-white/80 text-lg max-w-2xl mx-auto">
              {tHome('howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: 1,
                title: tHome('howItWorksSteps.1.title'),
                desc: tHome('howItWorksSteps.1.description'),
                icon: '🔍',
              },
              {
                n: 2,
                title: tHome('howItWorksSteps.2.title'),
                desc: tHome('howItWorksSteps.2.description'),
                icon: '📋',
              },
              {
                n: 3,
                title: tHome('howItWorksSteps.3.title'),
                desc: tHome('howItWorksSteps.3.description'),
                icon: '🎉',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition"
              >
                <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-brand-yellow text-primary flex items-center justify-center font-extrabold text-xl shadow-large">
                  {step.n}
                </div>
                <div className="text-5xl mb-4 mt-2">{step.icon}</div>
                <h3 className="text-xl font-heading font-bold mb-3">{step.title}</h3>
                <p className="text-white/80 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
