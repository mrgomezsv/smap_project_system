'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function BottomNavigation() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems = [
    { href: '/', label: t('home'), icon: '🏠' },
    { href: '/productos', label: t('products'), icon: '🎪' },
    { href: '/eventos', label: t('events'), icon: '🎟️' },
    { href: '/contacto', label: t('contact'), icon: '📞' },
    { href: '/cuenta', label: t('account'), icon: '👤' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border shadow-large lg:hidden pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group transition-all"
            >
              <span
                className={`text-2xl mb-0.5 transition-transform duration-300 ${
                  isActive ? 'scale-115 -translate-y-0.5' : 'group-hover:scale-110'
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-heading font-bold tracking-tight transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow mt-0.5 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
