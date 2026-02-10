'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingCart, Calendar, MessageSquare, Heart, Sparkles, Layout, User } from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'HOME', href: '/', icon: Layout },
        { name: 'PRODUCTOS', href: '#catalogo', icon: ShoppingCart },
        { name: 'EVENTOS', href: '#eventos', icon: Calendar },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-xl py-3' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center">
                    {/* Logo - Playful KF */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-[0_5px_0_rgb(29,78,216)] group-hover:shadow-none group-hover:translate-y-1 transition-all"
                        >
                            KF
                        </motion.div>
                        <span className="text-2xl font-black tracking-tight text-foreground">
                            Kids<span className="text-primary italic">Fun</span>
                        </span>
                    </Link>

                    {/* Desktop Nav - All options as 3D Buttons */}
                    <div className="hidden lg:flex items-center space-x-4">
                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.05, translateY: -2 }}
                                whileTap={{ scale: 0.95, translateY: 4 }}
                                className="bg-primary text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-[0_4px_0_rgb(29,78,216)] hover:shadow-none hover:translate-y-1 transition-all uppercase"
                            >
                                HOME
                            </motion.button>
                        </Link>

                        <Link href="#catalogo">
                            <motion.button
                                whileHover={{ scale: 1.05, translateY: -2 }}
                                whileTap={{ scale: 0.95, translateY: 4 }}
                                className="bg-secondary text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-[0_4px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-1 transition-all uppercase"
                            >
                                PRODUCTOS
                            </motion.button>
                        </Link>

                        <Link href="#eventos">
                            <motion.button
                                whileHover={{ scale: 1.05, translateY: -2 }}
                                whileTap={{ scale: 0.95, translateY: 4 }}
                                className="bg-primary text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-[0_4px_0_rgb(29,78,216)] hover:shadow-none hover:translate-y-1 transition-all uppercase"
                            >
                                EVENTOS
                            </motion.button>
                        </Link>


                        <div className="w-px h-8 bg-gray-200 mx-2" />

                        <Link href="/login">
                            <motion.button
                                whileHover={{ scale: 1.05, translateY: -2 }}
                                whileTap={{ scale: 0.95, translateY: 4 }}
                                className="bg-secondary text-white px-8 py-2.5 rounded-[2rem] font-black text-sm tracking-widest shadow-[0_6px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-1 active:shadow-none transition-all flex items-center space-x-2 border-2 border-white/20"
                            >
                                <User size={16} fill="white" />
                                <span>LOGIN</span>
                            </motion.button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-3 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 text-primary"
                        >
                            {isOpen ? <X size={32} /> : <Menu size={32} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu - Vibrant Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl shadow-2xl border-t border-gray-100 overflow-hidden"
                    >
                        <div className="flex flex-col p-6 space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center space-x-4 text-xl font-black text-foreground p-4 rounded-3xl hover:bg-primary/10 hover:text-primary transition-all border-2 border-transparent hover:border-primary/30"
                                >
                                    <link.icon size={24} className="text-primary" />
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                <button className="w-full bg-secondary text-white py-5 rounded-[2.5rem] font-black text-2xl shadow-[0_10px_0_rgb(157,23,77)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center space-x-3">
                                    <User size={28} fill="white" />
                                    <span>ENTRAR (LOGIN)</span>
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
