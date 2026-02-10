'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, Cloud } from 'lucide-react';

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-blue-400 via-blue-300 to-white">
            {/* Moving Clouds - "Vuelo Mágico" Speed - Larger and Faster */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <motion.div
                    initial={{ x: '-30%' }}
                    animate={{ x: '130%' }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[10%] opacity-40 text-white"
                >
                    <Cloud size={250} fill="currentColor" />
                </motion.div>
                <motion.div
                    initial={{ x: '130%' }}
                    animate={{ x: '-30%' }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[25%] right-0 opacity-20 text-white"
                >
                    <Cloud size={350} fill="currentColor" />
                </motion.div>
                <motion.div
                    initial={{ x: '-40%' }}
                    animate={{ x: '140%' }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 1 }}
                    className="absolute top-[40%] opacity-30 text-white"
                >
                    <Cloud size={200} fill="currentColor" />
                </motion.div>

                {/* Additional fast clouds for "flying" feel */}
                <motion.div
                    initial={{ x: '-50%' }}
                    animate={{ x: '150%' }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
                    className="absolute top-[15%] left-[10%] opacity-15 text-white"
                >
                    <Cloud size={100} fill="currentColor" />
                </motion.div>
            </div>

            {/* Wavy Background (SVG) */}
            <div className="absolute bottom-0 left-0 w-full leading-[0] z-10">
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" className="w-full">
                    <path fill="#ffffff" fillOpacity="1" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,197.3C672,213,768,203,864,176C960,149,1056,107,1152,112C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <div className="container mx-auto px-4 relative z-20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center space-x-2 bg-accent text-foreground px-8 py-3 rounded-full font-black text-lg mb-10 shadow-[0_8px_0_rgb(202,138,4)] hover:shadow-none hover:translate-y-2 transition-all cursor-pointer"
                    >
                        <Sparkles size={24} className="animate-pulse text-white" />
                        <span className="uppercase tracking-widest">¡Vuela a la diversión!</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
                        className="text-6xl md:text-[9rem] font-black mb-8 leading-[0.85] text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]"
                    >
                        ¡EL MUNDO <br />
                        <span className="text-accent inline-block hover:scale-110 transition-transform filter drop-shadow-[0_5px_0_rgb(202,138,4)]">MÁGICO</span>!
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-xl md:text-3xl text-white font-bold mb-12 max-w-2xl mx-auto drop-shadow-md"
                    >
                        Inflables gigantes y juegos que te harán sentir en las nubes. 🎈☁️
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8"
                    >
                        <button className="w-full md:w-auto bg-secondary text-white px-12 py-6 rounded-[3rem] font-black text-2xl shadow-[0_12px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-2 active:scale-95 transition-all flex items-center justify-center space-x-3 group">
                            <span>¡QUIERO JUGAR!</span>
                            <Star className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500" fill="white" />
                        </button>
                        <button className="w-full md:w-auto bg-white text-primary px-12 py-6 rounded-[3rem] font-black text-2xl border-4 border-primary hover:bg-blue-50 hover:scale-105 transition-all shadow-xl">
                            ¿QUIÉNES SOMOS?
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Extra floating elements */}
            <motion.div
                animate={{ y: [0, -30, 0], rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-40 left-20 text-8xl opacity-20 hidden lg:block"
            >
                🎡
            </motion.div>
            <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [-10, 10, -10] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-40 right-40 text-7xl opacity-30 hidden lg:block"
            >
                🍭
            </motion.div>
        </section>
    );
};

export default Hero;
