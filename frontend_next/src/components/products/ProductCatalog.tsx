'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import CategoryFilter from './CategoryFilter';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ProductCatalog = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await api.products.list(category === 'all' ? undefined : category);
                console.log("API Products Data:", data);
                // Handle both list and paginated results
                const productsList = Array.isArray(data) ? data : (data.results || data.products || []);
                setProducts(productsList);
            } catch (error) {
                console.error("Error loading products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [category]);

    return (
        <section id="catalogo" className="py-24 bg-blue-50/50 relative overflow-hidden">
            {/* Subtle background magic */}
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent opacity-50" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div className="max-w-xl">
                        <h2 className="text-4xl font-black mb-4">
                            Catálogo de <span className="text-primary italic">Fiestas Infantiles</span>
                        </h2>
                        <p className="text-foreground/60 text-lg">
                            Desde inflables gigantes hasta <span className="text-secondary font-bold">juegos mecánicos</span>, tenemos todo lo necesario para que tu evento sea legendaria.
                        </p>
                    </div>
                </div>

                <CategoryFilter selectedCategory={category} onSelectCategory={setCategory} />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-foreground/40 font-medium">Cargando diversión...</p>
                    </div>
                ) : (
                    <AnimatePresence mode='popLayout'>
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                            {products.length > 0 ? (
                                products.map((product: any) => (
                                    <ProductCard key={product.id} product={product} />
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-32 text-center"
                                >
                                    <p className="text-2xl text-foreground/30 font-bold italic">
                                        Pronto tendremos más opciones increíbles en esta categoría...
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </section>
    );
};

export default ProductCatalog;
