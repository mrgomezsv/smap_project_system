import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';

// UserMenu usa Firebase Auth (cliente). Se carga dinámicamente para no
// inflar el bundle del header en la primera carga (code splitting).
const UserMenuDynamic = dynamic(
  () => import('@/components/auth/UserMenu').then((m) => m.UserMenu),
  { ssr: false },
);

const LanguageSwitcher = dynamic(
  () => import('@/components/i18n/LanguageSwitcher').then((m) => m.LanguageSwitcher),
  { ssr: false },
);

export async function PublicHeader() {
  const t = await getTranslations('nav');
  const tHeader = await getTranslations('header');
  const navLinks = [
    { href: '/', key: 'home' as const },
    { href: '/productos', key: 'products' as const },
    { href: '/eventos', key: 'events' as const },
    { href: '/sobre-nosotros', key: 'about' as const },
    { href: '/contacto', key: 'contact' as const },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-yellow shadow-medium backdrop-blur-sm">
      <div className="container flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-xl sm:text-2xl md:text-3xl text-primary drop-shadow-sm group-hover:scale-105 transition-transform whitespace-nowrap">
            {tHeader('brandText')}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-lg font-medium text-primary/90 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/mobile-app"
            className="text-sm font-medium text-primary/80 hover:text-primary transition"
          >
            {tHeader('app')}
          </Link>
          <LanguageSwitcher />
          <UserMenuDynamic />
          <Link href="/productos" className="btn btn-primary shadow-medium hover:shadow-large">
            {tHeader('book')}
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-lg text-primary hover:bg-primary/10" aria-label="Menú">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
