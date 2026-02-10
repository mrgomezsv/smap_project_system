'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    ShoppingCart,
    Calendar,
    TrendingUp,
    Sparkles,
    ArrowUpRight,
    MessageCircle
} from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 -mr-10 -mt-10 rounded-full group-hover:scale-110 transition-transform`} />

        <div className="flex items-center justify-between mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
                <Icon size={28} />
            </div>
            {trend && (
                <span className="flex items-center text-green-500 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                    <TrendingUp size={16} className="mr-1" />
                    {trend}
                </span>
            )}
        </div>

        <h3 className="text-foreground/40 font-black text-xs tracking-widest uppercase mb-1">{label}</h3>
        <p className="text-4xl font-black text-foreground">{value}</p>

        <div className="mt-6 flex items-center text-primary font-bold text-sm cursor-pointer hover:underline group/link">
            <span>Ver detalles</span>
            <ArrowUpRight size={16} className="ml-1 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
        </div>
    </motion.div>
);

export default function DashboardPage() {
    // These metrics will ideally come from the API later
    const stats = [
        { label: 'PRODUCTOS TOTALES', value: '44', icon: ShoppingCart, color: 'from-blue-500 to-primary', trend: '+12%' },
        { label: 'PRÓXIMOS EVENTOS', value: '8', icon: Calendar, color: 'from-secondary to-pink-600', trend: '+2 nuevos' },
        { label: 'MENSAJES WEB', value: '15', icon: MessageCircle, color: 'from-yellow-400 to-orange-500', trend: '5 sin leer' },
        { label: 'USUARIOS APP', value: '1,280', icon: Users, color: 'from-purple-500 to-indigo-600', trend: '+85 hoy' },
    ];

    return (
        <div className="space-y-10">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs mb-4"
                    >
                        <Sparkles size={14} />
                        <span>¡MAGIA ADMINISTRATIVA ACTIVADA!</span>
                    </motion.div>
                    <h1 className="text-5xl font-black text-foreground tracking-tight">
                        Resumen <span className="text-primary italic">KidsFun</span>
                    </h1>
                    <p className="text-foreground/40 font-bold mt-2">Todo bajo control en el reino de la diversión.</p>
                </div>

                <div className="flex space-x-4">
                    <button className="bg-white text-foreground/60 border-4 border-blue-50 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all">
                        REPORTES PDF
                    </button>
                    <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-1 transition-all">
                        + NUEVO PRODUCTO
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Recent Activity / Quick Actions Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-sm border border-blue-50">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black italic">Actividad Reciente</h2>
                        <button className="text-primary font-bold hover:underline">Ver todo</button>
                    </div>

                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-blue-50/30 rounded-3xl border border-transparent hover:border-primary/10 transition-all cursor-pointer group">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground">Nuevo Producto Añadido</p>
                                        <p className="text-xs font-bold text-foreground/40 italic">Hace 2 horas • Por Admin KidsFun</p>
                                    </div>
                                </div>
                                <span className="bg-white px-4 py-2 rounded-xl text-xs font-black text-foreground/40">INVENTARIO</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-primary to-blue-700 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <Sparkles size={48} className="text-white/30 mb-6" />
                            <h2 className="text-3xl font-black mb-4 tracking-tight leading-tight">¿Tienes algo nuevo en mente?</h2>
                            <p className="text-white/60 font-medium">Publica nuevos productos o eventos en segundos y haz brillar la web.</p>
                        </div>
                        <button className="mt-10 bg-white text-primary px-8 py-5 rounded-2xl font-black text-lg shadow-[0_8px_0_rgb(30,58,138,0.3)] hover:shadow-none hover:translate-y-1 transition-all">
                            ACCESO RÁPIDO
                        </button>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                </div>
            </div>
        </div>
    );
}
