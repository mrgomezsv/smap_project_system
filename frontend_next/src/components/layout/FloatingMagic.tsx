'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sparkles, Star } from 'lucide-react';

const FloatingMagic = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Floating Clouds - Faster "Flying" Feel - Extreme Edition */}
            <motion.div
                initial={{ x: '-50%' }}
                animate={{ x: '150%' }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute top-[15%] text-white/40 z-[-1]"
            >
                <Cloud size={400} fill="currentColor" />
            </motion.div>

            <motion.div
                initial={{ x: '150%' }}
                animate={{ x: '-50%' }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 1 }}
                className="absolute top-[50%] text-white/30 z-[-1]"
            >
                <Cloud size={500} fill="currentColor" />
            </motion.div>

            <motion.div
                initial={{ x: '-60%' }}
                animate={{ x: '160%' }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 5 }}
                className="absolute bottom-[10%] text-white/20 z-[-1]"
            >
                <Cloud size={250} fill="currentColor" />
            </motion.div>

            {/* Background Star 2 - Lower down */}
            <motion.div
                animate={{
                    y: [0, 50, 0],
                    rotate: [0, -20, 20, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-[40%] left-[5%] text-accent/20 text-6xl hidden sm:block filter drop-shadow-lg"
            >
                ✨
            </motion.div>

            {/* Background Balloon 2 - Deep lower down */}
            <motion.div
                animate={{
                    y: [0, -150, 0],
                    rotate: [-15, 15, -15],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                className="absolute bottom-[20%] left-[8%] text-secondary/15 text-9xl hidden sm:block filter drop-shadow-xl"
            >
                🎈
            </motion.div>

            {/* Background Star 1 */}
            <motion.div
                animate={{
                    y: [0, -40, 0],
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] left-[8%] text-accent/30 text-7xl hidden sm:block filter drop-shadow-lg"
            >
                ✨
            </motion.div>

            {/* Background Balloon 1 */}
            <motion.div
                animate={{
                    y: [0, -100, 0],
                    rotate: [10, -10, 10],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[30%] right-[5%] text-secondary/25 text-9xl hidden sm:block filter drop-shadow-xl"
            >
                🎈
            </motion.div>

            {/* Background Ice Cream or Fun Icon */}
            <motion.div
                animate={{
                    y: [0, 50, 0],
                    rotate: [-20, 20, -20],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                className="absolute top-[60%] left-[12%] text-success/25 text-6xl hidden lg:block filter drop-shadow-md"
            >
                🍦
            </motion.div>

            {/* Background Confetti/Circles Cluster */}
            <motion.div
                animate={{
                    y: [0, 100, 0],
                    rotate: 360,
                    opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[75%] right-[10%] text-warning/20 text-8xl hidden lg:block grayscale opacity-20"
            >
                🍭
            </motion.div>

            {/* Background Rocket */}
            <motion.div
                animate={{
                    y: [0, -150, 0],
                    x: [0, -50, 0],
                    rotate: [0, -45, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[10%] right-[15%] text-primary/20 text-[10rem] hidden lg:block filter drop-shadow-2xl"
            >
                🚀
            </motion.div>

            {/* Background Party Popper */}
            <motion.div
                animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] right-[20%] text-warning/30 text-5xl hidden sm:block filter drop-shadow-lg"
            >
                🎉
            </motion.div>
        </div>
    );
};

export default FloatingMagic;
