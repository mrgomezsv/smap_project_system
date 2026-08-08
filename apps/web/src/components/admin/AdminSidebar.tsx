'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

const sections = [
  {
    title: 'Sitio Web',
    links: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/admin/productos', label: 'Productos', icon: '🎪' },
      { href: '/admin/eventos', label: 'Eventos', icon: '🎉' },
    ],
  },
  {
    title: 'Gestión',
    links: [
      { href: '/admin/contratos', label: 'Contratos Renta', icon: '📄' },
      { href: '/admin/waivers', label: 'Waivers', icon: '📋' },
      { href: '/admin/waivers/escanear', label: 'Escanear QR', icon: '📷' },
      { href: '/admin/chats', label: 'Chats', icon: '💬' },
      { href: '/admin/mensajes', label: 'Mensajes Web', icon: '✉️' },
    ],
  },
  {
    title: 'Marketing',
    links: [
      { href: '/admin/notificaciones', label: 'Push Notifications', icon: '🔔' },
      { href: '/admin/metricas', label: 'Métricas', icon: '📈' },
      { href: '/admin/usuarios', label: 'Usuarios App', icon: '👥' },
    ],
  },
  {
    title: 'Sistema',
    links: [
      { href: '/admin/sudo', label: 'Sudo Admin', icon: '⚙️' },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      if (onClose) onClose();
      router.push('/cuenta');
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'flex flex-col w-64 bg-primary text-white shrink-0',
          'lg:sticky lg:top-0 lg:h-screen lg:z-auto',
          'fixed inset-y-0 left-0 z-50 transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Brand + close (mobile) */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <span className="font-display text-2xl text-brand-yellow">Kidsfun</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-white/80 hover:text-white p-1"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="px-6 pt-1 text-xs text-white/60 hidden lg:block">
          Panel de Administración
        </p>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          active
                            ? 'bg-brand-yellow text-primary font-semibold shadow-soft'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Botón de Cerrar Sesión dedicado */}
          <div className="pt-2 border-t border-white/10 mt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-red-500/20 hover:text-white transition text-left"
            >
              <span className="text-base">🚪</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-white/40">v2.0.0 · {new Date().getFullYear()}</p>
        </div>
      </aside>
    </>
  );
}
