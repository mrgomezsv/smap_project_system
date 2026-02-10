'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
    LayoutDashboard,
    ShoppingCart,
    Calendar,
    MessageSquare,
    Users,
    Bell,
    LogOut,
    Menu,
    X,
    Sparkles,
    ChevronRight,
    Search
} from 'lucide-react';

import AuthGuard from '@/components/dashboard/AuthGuard';

const SidebarItem = ({ href, icon: Icon, label, active, collapsed }: any) => (
    <Link href={href}>
        <motion.div
            whileHover={{ x: 5 }}
            className={`flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all cursor-pointer mb-2 ${active
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-foreground/60 hover:bg-primary/10 hover:text-primary font-bold'
                }`}
        >
            <Icon size={24} />
            {!collapsed && <span className="text-sm tracking-wide">{label}</span>}
            {active && !collapsed && (
                <motion.div layoutId="active" className="ml-auto">
                    <ChevronRight size={16} />
                </motion.div>
            )}
        </motion.div>
    </Link>
);

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.auth.logout();
            router.push('/login');
        } catch (error) {
            console.error("Logout error:", error);
            // Fallback redirect
            router.push('/login');
        }
    };

    const menuItems = [
        { label: 'RESUMEN', href: '/dashboard', icon: LayoutDashboard },
        { label: 'PRODUCTOS', href: '/dashboard/products', icon: ShoppingCart },
        { label: 'EVENTOS', href: '/dashboard/events', icon: Calendar },
        { label: 'MENSAJES', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'USUARIOS', href: '/dashboard/users', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-blue-50/30 flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                animate={{ width: isCollapsed ? 100 : 280 }}
                className="bg-white border-r border-blue-100 flex flex-col relative z-50 shadow-2xl"
            >
                {/* Logo Section */}
                <div className="p-8 flex items-center justify-between">
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center space-x-2"
                            >
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Sparkles size={24} />
                                </div>
                                <span className="font-black text-xl tracking-tighter text-foreground">
                                    KIDS<span className="text-primary italic">FUN</span>
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-foreground/40"
                    >
                        {isCollapsed ? <Menu size={24} /> : <X size={24} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 overflow-y-auto">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href}
                            collapsed={isCollapsed}
                        />
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-6 border-t border-blue-50 space-y-2">
                    <Link href="/">
                        <motion.div
                            whileHover={{ x: 5 }}
                            className="flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all cursor-pointer text-foreground/40 hover:bg-blue-50 hover:text-primary font-bold"
                        >
                            <Sparkles size={24} />
                            {!isCollapsed && <span className="text-sm tracking-wide">VER SITIO PÚBLICO</span>}
                        </motion.div>
                    </Link>

                    <motion.div
                        whileHover={{ x: 5 }}
                        onClick={handleLogout}
                        className="flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all cursor-pointer text-red-400 hover:bg-red-50 hover:text-red-500 font-bold"
                    >
                        <LogOut size={24} />
                        {!isCollapsed && <span className="text-sm tracking-wide">CERRAR SESIÓN</span>}
                    </motion.div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-24 bg-white/80 backdrop-blur-md border-b border-blue-50 px-10 flex items-center justify-between z-40">
                    <div className="flex items-center space-x-6 flex-1 max-w-2xl">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={20} />
                            <input
                                type="text"
                                placeholder="Buscando magia..."
                                className="w-full pl-12 pr-6 py-3 bg-blue-50/50 rounded-2xl outline-none focus:ring-2 ring-primary/20 font-medium transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button className="relative p-3 text-foreground/40 hover:text-primary transition-colors hover:bg-blue-50 rounded-2xl">
                            <Bell size={24} />
                            <span className="absolute top-3 right-3 w-3 h-3 bg-secondary rounded-full border-2 border-white" />
                        </button>
                        <div className="flex items-center space-x-4 pl-6 border-l border-blue-50">
                            <div className="text-right">
                                <p className="font-black text-sm text-foreground">Admin KidsFun</p>
                                <p className="text-xs font-bold text-foreground/40 italic uppercase tracking-widest">Administrador</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg border-2 border-white" />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10">
                    <AuthGuard>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {children}
                        </motion.div>
                    </AuthGuard>
                </div>
            </main>
        </div>
    );
}
