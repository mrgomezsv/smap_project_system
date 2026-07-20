'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const UserMenuDynamic = dynamic(
  () => import('@/components/auth/UserMenu').then((m) => m.UserMenu),
  { ssr: false },
);

const LanguageSwitcher = dynamic(
  () => import('@/components/i18n/LanguageSwitcher').then((m) => m.LanguageSwitcher),
  { ssr: false },
);

interface MobileMenuProps {
  links: Array<{ href: string; label: string }>;
  appLabel: string;
  bookLabel: string;
}

export function MobileMenu({ links, appLabel, bookLabel }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when page changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
        aria-label="Abrir menú"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Menu Drawer Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        {/* Drawer Panel */}
        <div
          className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-surface shadow-large flex flex-col p-6 transition-transform duration-300 ease-out transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <span className="font-heading font-extrabold text-text-primary text-lg">
              Menú
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-text-muted hover:bg-black/5 hover:text-text-primary transition-colors"
              aria-label="Cerrar menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-xl font-semibold text-base transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-primary hover:bg-black/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <Link
              href="/mobile-app"
              className={`px-4 py-3 rounded-xl font-semibold text-base transition-colors mt-2 ${
                pathname === '/mobile-app'
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-primary hover:bg-black/5'
              }`}
            >
              📱 {appLabel}
            </Link>
          </nav>

          {/* Footer controls */}
          <div className="mt-auto pt-6 border-t border-border space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-text-muted font-medium">Idioma / Language</span>
              <LanguageSwitcher />
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-sm text-text-muted font-medium">Usuario / Account</span>
              <UserMenuDynamic />
            </div>

            <Link
              href="/productos"
              className="btn btn-primary w-full py-3.5 text-center font-bold text-base shadow-medium hover:shadow-large block"
            >
              {bookLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
