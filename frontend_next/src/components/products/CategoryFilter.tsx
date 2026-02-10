'use client';

import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'option1', label: 'Bounce Houses' },
    { id: 'option2', label: 'Electric Games' },
    { id: 'option3', label: 'Furniture' },
    { id: 'option4', label: 'Concession Machines' },
    { id: 'option5', label: 'Competitive Games' },
    { id: 'option6', label: 'Equipment Rental' },
    { id: 'option7', label: 'Water Fun' },
];

interface CategoryFilterProps {
    selectedCategory: string;
    onSelectCategory: (id: string) => void;
}

const CategoryFilter = ({ selectedCategory, onSelectCategory }: CategoryFilterProps) => {
    return (
        <div className="flex flex-wrap gap-3 mb-12">
            {CATEGORIES.map((category) => (
                <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectCategory(category.id)}
                    className={`px-6 py-2 rounded-full font-bold transition-all border-2 ${selectedCategory === category.id
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-white border-gray-100 text-foreground/60 hover:border-primary/30 hover:text-primary'
                        }`}
                >
                    {category.label}
                </motion.button>
            ))}
        </div>
    );
};

export default CategoryFilter;
