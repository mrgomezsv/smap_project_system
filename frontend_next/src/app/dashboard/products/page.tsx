'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Image as ImageIcon,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';

const ProductStatus = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
        {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        <span>{active ? 'Activo' : 'Oculto'}</span>
    </span>
);

export default function AdminProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await api.products.list();
                const list = Array.isArray(data) ? data : (data.results || []);
                setProducts(list);
            } catch (error) {
                console.error("Error fetching admin products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category_display.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">
                        Gestión de <span className="text-primary italic">Productos</span>
                    </h1>
                    <p className="text-foreground/40 font-bold mt-2">Administra tu catálogo de diversión y magia.</p>
                </div>
                <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-1 transition-all flex items-center space-x-2">
                    <Plus size={24} />
                    <span>NUEVO PRODUCTO</span>
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-blue-50 outline-none focus:border-primary/30 transition-all font-bold placeholder:text-foreground/20 shadow-sm"
                    />
                </div>
                <button className="bg-white text-foreground/40 px-6 py-4 rounded-2xl border border-blue-50 font-black flex items-center space-x-2 hover:bg-blue-50 transition-all shadow-sm">
                    <Filter size={20} />
                    <span>FILTROS</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-blue-50 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-foreground/40 font-black italic">Consultando el inventario mágico...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-blue-50">
                                    <th className="px-8 py-6 text-xs font-black text-foreground/30 uppercase tracking-widest">Producto</th>
                                    <th className="px-8 py-6 text-xs font-black text-foreground/30 uppercase tracking-widest">Categoría</th>
                                    <th className="px-8 py-6 text-xs font-black text-foreground/30 uppercase tracking-widest">Estado</th>
                                    <th className="px-8 py-6 text-xs font-black text-foreground/30 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50/50">
                                <AnimatePresence mode='popLayout'>
                                    {filteredProducts.map((p, index) => (
                                        <motion.tr
                                            key={p.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-sm bg-blue-50 flex items-center justify-center">
                                                        {p.image_url ? (
                                                            <Image
                                                                src={p.image_url}
                                                                alt={p.title}
                                                                fill
                                                                className="object-cover group-hover:scale-110 transition-transform"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="text-blue-200" size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground tracking-tight line-clamp-1">{p.title}</p>
                                                        <p className="text-xs font-bold text-foreground/40 italic">ID: #{p.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-foreground/60">{p.category_display}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <ProductStatus active={p.publicated} />
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-2">
                                                    <button className="p-3 bg-blue-50 text-foreground/40 hover:text-primary rounded-xl hover:bg-white border border-transparent hover:border-blue-100 transition-all">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button className="p-3 bg-red-50 text-red-400 hover:text-red-500 rounded-xl hover:bg-white border border-transparent hover:border-red-100 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-foreground/20 font-black italic">
                                            No se encontraron productos que coincidan...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
