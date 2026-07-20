import Link from 'next/link';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { CATEGORY_LABELS, type Category } from '@/lib/types';

// ISR: revalidar cada 5 minutos
export const revalidate = 300;
export const dynamic = 'force-static';

const HERO_IMG = '/media/product_images/barbie_bounce_house/barbie_bounce_house_01.jpeg';

const featuredCategories: Array<{ key: Category; emoji: string; bg: string }> = [
  { key: 'option1', emoji: '🎪', bg: 'from-party-pink/20 to-brand-yellow/20' },
  { key: 'option2', emoji: '⚡', bg: 'from-primary/20 to-info/20' },
  { key: 'option3', emoji: '🪑', bg: 'from-brand-yellow/20 to-party-pink/20' },
  { key: 'option4', emoji: '🍿', bg: 'from-warning/20 to-brand-yellow/20' },
  { key: 'option5', emoji: '🏆', bg: 'from-info/20 to-success/20' },
  { key: 'option7', emoji: '💦', bg: 'from-success/20 to-info/20' },
];

export default async function HomePage() {
  let products: Product[] = [];
  try {
    const res = await api.get<{ items: Product[] }>('/api/products?take=8&publicated=true');
    products = res.items;
  } catch (e) {
    console.error('Error cargando productos:', e);
  }

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
            <span className="inline-flex items-center gap-2 bg-brand-yellow/20 backdrop-blur-sm border border-brand-yellow/40 text-brand-yellow px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse" />
              Disponible en toda El Salvador
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold leading-[1.05] mb-6">
              La fiesta perfecta
              <br />
              <span className="text-brand-yellow">empieza aquí</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Brincolines, juegos inflables y diversión para tus fiestas infantiles.
              Hacemos de tu evento algo <span className="font-semibold text-brand-yellow">inolvidable</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/productos"
                className="btn btn-secondary px-8 py-4 text-lg shadow-large hover:shadow-glow"
              >
                Ver catálogo
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/sobre-nosotros"
                className="btn bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 text-lg hover:bg-white/20"
              >
                ¿Cómo funciona?
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>+5 años de experiencia</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Entrega puntual</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293exxxxx" clipRule="evenodd" />
                </svg>
                <span>Equipos certificados</span>
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
              Categorías destacadas
            </h2>
            <p className="mt-3 text-text-muted text-lg">
              Todo lo que necesitas para tu fiesta en un solo lugar
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCategories.map((cat) => (
              <Link
                key={cat.key}
                href={`/productos?category=${cat.key}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.bg} border-2 border-white p-6 text-center hover:scale-[1.03] hover:shadow-large transition-all`}
              >
                <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </div>
                <p className="font-heading font-bold text-text-primary text-sm">
                  {CATEGORY_LABELS[cat.key]}
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
                Productos populares
              </h2>
              <p className="mt-3 text-text-muted text-lg">
                Los más reservados por nuestros clientes
              </p>
            </div>
            <Link
              href="/productos"
              className="hidden sm:inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              Ver todos
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
                <Link
                  key={product.id}
                  href={`/productos/${product.id}`}
                  className="group card hover:shadow-large hover:-translate-y-1 transition-all overflow-hidden p-0"
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    <img
                      src={`/media/${product.img}`}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {CATEGORY_LABELS[product.category]}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    {product.price && (
                      <p className="mt-2 text-2xl font-extrabold text-primary">
                        ${product.price.toFixed(2)}
                        <span className="text-sm font-normal text-text-muted">/evento</span>
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <span className="text-party-pink">♥</span> {product._count?.likes ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {product._count?.comments ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
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
              ¿Cómo funciona?
            </h2>
            <p className="mt-3 text-white/80 text-lg max-w-2xl mx-auto">
              Reservar es muy fácil. En 3 pasos tu fiesta estará lista.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: 1,
                title: 'Explora el catálogo',
                desc: 'Revisa nuestra variedad de brincolines, juegos y servicios. Encuentra lo perfecto para tu evento.',
                icon: '🔍',
              },
              {
                n: 2,
                title: 'Reserva y firma el waiver',
                desc: 'Selecciona fecha, completa el formulario digital y obtén tu QR de acceso al instante.',
                icon: '📋',
              },
              {
                n: 3,
                title: '¡A divertirse!',
                desc: 'Llega el día, muestra tu QR y disfruta. Nosotros nos encargamos de todo.',
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
