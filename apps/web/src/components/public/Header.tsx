import Link from 'next/link';
import dynamic from 'next/dynamic';

// UserMenu usa Firebase Auth (cliente). Se carga dinámicamente para no
// inflar el bundle del header en la primera carga (code splitting).
const UserMenu = dynamic(
  () => import('@/components/auth/UserMenu').then((m) => m.UserMenu),
  { ssr: false },
);

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/sobre-nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-brand-yellow shadow-medium backdrop-blur-sm">
      <div className="container flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-3xl text-primary drop-shadow-sm group-hover:scale-105 transition-transform">
            Kidsfun
          </span>
          <span className="hidden sm:block text-sm font-medium text-primary/80">
            Fiestas Infantiles
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-lg font-medium text-primary/90 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/mobile-app"
            className="text-sm font-medium text-primary/80 hover:text-primary transition"
          >
            App
          </Link>
          <UserMenu />
          <Link
            href="/productos"
            className="btn btn-primary shadow-medium hover:shadow-large"
          >
            Reservar
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-primary hover:bg-primary/10"
          aria-label="Menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
