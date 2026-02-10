'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '@/lib/api';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ProductCardProps {
    product: {
        id: number;
        title: string;
        price: string;
        category_display: string;
        image_url: string;
        likes_count?: number;
    };
}

const ProductCard = ({ product }: ProductCardProps) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(product.likes_count || 0);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Mock user ID for now (in a real app, this comes from Auth)
        const userId = "temp_user_123";

        try {
            const data = await api.products.toggleLike(product.id, userId);
            setIsLiked(data.is_favorite);
            setLikesCount(data.total_likes);
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{
                y: -15,
                scale: 1.05,
                rotate: [0, -1, 1, 0],
                transition: { duration: 0.3 }
            }}
            className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
            <div className="relative h-64 w-full overflow-hidden">
                {/* Favorite Button */}
                <button
                    onClick={handleLike}
                    className={`absolute top-4 right-4 z-10 p-2 backdrop-blur-md rounded-full transition-all shadow-sm ${isLiked ? 'bg-secondary text-white' : 'bg-white/80 text-foreground/50 hover:text-secondary hover:bg-white'
                        }`}
                >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                </button>

                {/* Category Badge */}
                <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-primary/90 backdrop-blur-md text-white text-xs font-bold rounded-full">
                    {product.category_display}
                </div>

                {/* Product Image */}
                <Image
                    src={product.image_url || '/placeholder-product.jpg'}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-foreground line-clamp-1">{product.title}</h3>
                    <span className="flex items-center text-xs font-bold text-foreground/40 space-x-1">
                        <Heart size={12} />
                        <span>{likesCount}</span>
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center space-x-1 text-secondary font-bold group/btn"
                    >
                        <span>Ver más</span>
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
