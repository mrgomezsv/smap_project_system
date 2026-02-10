'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Clock, Sparkles } from 'lucide-react';

const features = [
    {
        icon: ShieldCheck,
        title: 'Seguridad Total',
        description: 'Nuestros equipos son inspeccionados y desinfectados regularmente siguiendo estrictos protocolos.',
        color: 'bg-primary'
    },
    {
        icon: Truck,
        title: 'Entrega Puntual',
        description: 'Llegamos a tiempo para que la diversión comience justo cuando lo planeaste.',
        color: 'bg-secondary'
    },
    {
        icon: Clock,
        title: 'Montaje Profesional',
        description: 'Equipo de expertos encargado de la instalación segura de todos los juegos.',
        color: 'bg-accent'
    },
    {
        icon: Sparkles,
        title: 'Diversión Garantizada',
        description: 'Una amplia variedad de opciones para niños de todas las edades y gustos.',
        color: 'bg-success'
    }
];

const WhyUs = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Local Decorations */}
            <motion.div
                animate={{ x: [-20, 20, -20], y: [-10, 10, -10] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-10 right-10 opacity-10 text-9xl hidden lg:block"
            >
                🎨
            </motion.div>
            <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute bottom-10 left-10 opacity-10 text-8xl hidden lg:block"
            >
                🎪
            </motion.div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-primary font-bold tracking-widest uppercase text-sm mb-4"
                    >
                        Sobre Nosotros
                    </motion.p>
                    <h2 className="text-4xl font-black mb-6">¿Por qué elegir <span className="text-primary font-black">KidsFun</span> para tus Fiestas Infantiles?</h2>
                    <p className="text-foreground/60 text-lg mb-8">
                        Somos una empresa dedicada al entretenimiento infantil. Proveemos diferentes juegos y actividades para eventos familiares como fiestas de cumpleaños, graduaciones y más.
                    </p>
                    <p className="text-foreground/60 text-lg">
                        Expertos en el alquiler de <span className="text-secondary font-bold">bounce houses, water slides, obstacle courses</span> y accesorios para fiestas que garantizan la máxima diversión y seguridad.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-3xl bg-card-bg border border-gray-100 hover:shadow-xl transition-all"
                        >
                            <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-current/20`}>
                                <feature.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                            <p className="text-foreground/60 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyUs;
