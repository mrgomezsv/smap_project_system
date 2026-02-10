'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const EventShowcase = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await api.events.list();
                const eventsList = Array.isArray(data) ? data : (data.results || []);
                setEvents(eventsList.slice(0, 3)); // Mostrar los 3 más recientes
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <section id="eventos" className="py-24 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
            {/* Decorations */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
            />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center space-x-2 bg-accent/20 text-accent px-4 py-2 rounded-full font-black text-sm mb-6"
                    >
                        <Sparkles size={16} />
                        <span>¡PRÓXIMAS FIESTAS MÁGICAS!</span>
                    </motion.div>
                    <h2 className="text-5xl font-black mb-6">Eventos que <span className="text-primary italic">No Te Puedes Perder</span></h2>
                    <p className="text-foreground/60 text-xl font-medium">
                        Únete a la diversión en nuestros próximos eventos públicos o inspírate para organizar el tuyo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-blue-50 hover:border-primary/20 transition-all group"
                            >
                                <div className="relative h-48 w-full mb-6 overflow-hidden rounded-3xl shadow-lg group-hover:shadow-primary/20 transition-all">
                                    <img
                                        src={event.image_url || '/placeholder-event.jpg'}
                                        alt={event.title || event.name}
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-primary px-3 py-1 rounded-full font-black text-xs shadow-sm">
                                        {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors">{event.title || event.name}</h3>
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center space-x-2 text-foreground/60 font-bold">
                                        <MapPin size={18} className="text-secondary" />
                                        <span>{event.location || 'Ubicación Mágica'}</span>
                                    </div>
                                </div>
                                <button className="w-full bg-secondary text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-1 transition-all">
                                    VER DETALLES
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-blue-50/50 rounded-[3rem] border-4 border-dashed border-blue-100">
                            <Ticket size={64} className="mx-auto text-blue-200 mb-4" />
                            <p className="text-2xl text-foreground/30 font-bold italic">Buscando nuevas magias en el calendario...</p>
                        </div>
                    )}
                </div>

                {/* Call to Action for Organizers */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="mt-16 bg-primary p-1 rounded-[3rem] shadow-2xl"
                >
                    <div className="bg-white p-10 rounded-[2.8rem] flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h3 className="text-3xl font-black mb-2 italic">¿Quieres organizar tu propio evento?</h3>
                            <p className="text-foreground/60 font-bold">Haz que el cumpleaños de tu pequeño sea inolvidable con nuestro equipo.</p>
                        </div>
                        <button className="bg-accent text-foreground px-12 py-5 rounded-[2rem] font-black text-xl shadow-[0_8px_0_rgb(202,138,4)] hover:shadow-none hover:translate-y-1 transition-all">
                            ¡ COTIZAR AHORA !
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default EventShowcase;
