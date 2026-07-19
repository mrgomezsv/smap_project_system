'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  {
    title: 'Sitio Web',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/productos', label: 'Productos', icon: '🎪' },
      { href: '/eventos', label: 'Eventos', icon: '🎉' },
    ],
  },
  {
    title: 'Gestión',
    links: [
      { href: '/waivers', label: 'Waivers', icon: '📋' },
      { href: '/waivers/escanear', label: 'Escanear QR', icon: '📷' },
      { href: '/chats', label: 'Chats', icon: '💬' },
      { href: '/mensajes', label: 'Mensajes Web', icon: '✉️' },
    ],
  },
  {
    title: 'Marketing',
    links: [
      { href: '/notificaciones', label: 'Push Notifications', icon: '🔔' },
      { href: '/metricas', label: 'Métricas', icon: '📈' },
      { href: '/usuarios', label: 'Usuarios App', icon: '👥' },
    ],
  },
  {
    title: 'Sistema',
    links: [
      { href: '/sudo', label: 'Sudo Admin', icon: '⚙️' },
      { href: '/signin', label: 'Cerrar sesión', icon: '🚪' },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-primary text-white shrink-0 sticky top-0 h-screen">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="font-display text-2xl text-brand-yellow">Kidsfun</span>
        </Link>
        <p className="text-xs text-white/60 mt-1">Panel de Administración</p>
      </div>

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
      </nav>

      {/* Footer del sidebar */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/40">
          v2.0.0 · {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
