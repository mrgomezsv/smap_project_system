'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await api.auth.me();
                if (data.success) {
                    setIsAuthenticated(true);
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error("Auth Guard Error:", error);
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    if (isAuthenticated === null) {
        return (
            <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-6 z-[100]">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 border-8 border-blue-50 border-t-primary rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                        <Sparkles size={32} />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-black text-foreground italic">Verificando Credenciales Mágicas...</p>
                    <p className="text-foreground/40 font-bold uppercase tracking-widest text-sm mt-2">Seguridad KidsFun</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
