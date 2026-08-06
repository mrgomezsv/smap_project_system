'use client';

import { useState, useEffect, useRef } from 'react';
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

// Map key emojis for beautiful branding styling
const LINK_EMOJIS: Record<string, string> = {
  '/': '🏠',
  '/productos': '🎪',
  '/eventos': '🎟️',
  '/sobre-nosotros': '🌟',
  '/contacto': '📞',
};

export function MobileMenu({ links, appLabel, bookLabel }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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

  // Support swipe right gesture to dismiss/close the menu
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const difference = touchEndX.current - touchStartX.current;
    const swipeThreshold = 85; // Distance required to swipe close

    if (difference > swipeThreshold) {
      setIsOpen(false);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-xl text-primary bg-white/40 hover:bg-white/60 active:scale-95 transition-all shadow-soft border border-primary/10"
        aria-label="Abrir menú"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop Blur Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-500 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-large flex flex-col p-6 rounded-l-[2rem] border-l border-primary/10 transition-transform duration-500 ease-out transform md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header section */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎈</span>
            <span className="font-heading font-extrabold text-text-primary text-xl tracking-tight">
              Menú Principal
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2.5 rounded-full text-text-muted hover:bg-gray-100 hover:text-text-primary active:scale-90 transition-all border border-border shadow-soft bg-white"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links with custom animation style */}
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const emoji = LINK_EMOJIS[link.href] ?? '🎪';
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-medium'
                    : 'text-text-primary hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {emoji}
                </span>
                <span>{link.label}</span>
                {isActive && <span className="ml-auto w-2.5 h-2.5 rounded-full bg-brand-yellow animate-pulse" />}
              </Link>
            );
          })}

          {/* App download link item */}
          <Link
            href="/mobile-app"
            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-[0.98] mt-2 border border-border ${
              pathname === '/mobile-app'
                ? 'bg-gradient-to-r from-party-pink to-party-pink/90 text-white shadow-medium'
                : 'text-text-primary bg-surface-elevated hover:bg-party-pink/5 hover:text-party-pink'
            }`}
          >
            <span className="text-xl">📱</span>
            <span>{appLabel}</span>
          </Link>
        </nav>

        {/* Footer controls inside custom cards layout */}
        <div className="mt-auto pt-6 border-t border-border space-y-4">
          {/* Local settings widget */}
          <div className="bg-surface-elevated rounded-2xl p-4 border border-border space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🌎</span>
                <span className="text-sm text-text-muted font-bold">Idioma</span>
              </div>
              <LanguageSwitcher />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <span className="text-sm text-text-muted font-bold">Cuenta</span>
              </div>
              <UserMenuDynamic />
            </div>
          </div>

          {/* Booking action button */}
          <Link
            href="/productos?prompt=book"
            className="btn btn-primary w-full py-4 text-center font-extrabold text-base shadow-medium hover:shadow-large hover:scale-[1.01] active:scale-95 transition-all block"
          >
            🚀 {bookLabel}
          </Link>
        </div>
      </div>
    </>
  );
}
