'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const LoginPage = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.auth.login({ username, password });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-blue-100 to-white">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute top-20 left-[10%] text-9xl opacity-10"
                >
                    🎈
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute bottom-20 right-[15%] text-[12rem] opacity-5"
                >
                    ☁️
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 border-8 border-blue-50"
            >
                <div className="text-center mb-10">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-primary/30"
                    >
                        <User size={40} fill="white" />
                    </motion.div>
                    <h1 className="text-4xl font-black mb-2 text-foreground tracking-tight">Bienvenido</h1>
                    <p className="text-foreground/60 font-bold uppercase tracking-widest text-sm">Entra a la diversión</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 font-bold"
                    >
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/70 ml-2 uppercase">Usuario</label>
                        <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Tu nombre de usuario"
                                required
                                className="w-full pl-14 pr-6 py-5 bg-blue-50/50 border-4 border-transparent focus:border-primary/20 rounded-[2rem] outline-none font-bold text-lg transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/70 ml-2 uppercase">Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-14 pr-6 py-5 bg-blue-50/50 border-4 border-transparent focus:border-primary/20 rounded-[2rem] outline-none font-bold text-lg transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-primary text-primary focus:ring-primary transition-all cursor-pointer" />
                            <span className="text-sm font-bold text-foreground/60 group-hover:text-primary transition-colors">Recordarme</span>
                        </label>
                        <Link href="#" className="text-sm font-bold text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                        type="submit"
                        className="w-full bg-secondary text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-[0_12px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-1 active:shadow-none active:translate-y-2 disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none transition-all flex items-center justify-center space-x-3 group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={28} />
                        ) : (
                            <>
                                <span>ENTRAR</span>
                                <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                            </>
                        )}
                    </motion.button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-foreground/60 font-bold">
                        ¿No tienes cuenta? <Link href="#" className="text-secondary hover:underline">¡Regístrate aquí!</Link>
                    </p>
                </div>

                {/* Floating sparkles */}
                <Sparkles className="absolute -top-4 -right-4 text-accent animate-pulse" size={40} />
                <Sparkles className="absolute -bottom-4 -left-4 text-accent animate-pulse delay-700" size={30} />
            </motion.div>
        </div>
    );
};

export default LoginPage;
