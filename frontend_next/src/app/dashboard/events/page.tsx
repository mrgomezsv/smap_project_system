'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Calendar,
    MapPin,
    Edit2,
    Trash2,
    Loader2,
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    Ticket
} from 'lucide-react';
import { api } from '@/lib/api';

const EventStatus = ({ published }: { published: boolean }) => (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${published ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
        }`}>
        {published ? <CheckCircle2 size={12} /> : <Clock size={12} />}
        <span>{published ? 'Publicado' : 'Programado'}</span>
    </span>
);

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await api.events.list();
                const list = Array.isArray(data) ? data : (data.results || []);
                setEvents(list);
            } catch (error) {
                console.error("Error fetching admin events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">
                        Calendario de <span className="text-primary italic">Eventos</span>
                    </h1>
                    <p className="text-foreground/40 font-bold mt-2">Gestiona las fiestas públicas y eventos especiales.</p>
                </div>
                <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(157,23,77)] hover:shadow-none hover:translate-y-1 transition-all flex items-center space-x-2">
                    <Plus size={24} />
                    <span>NUEVO EVENTO</span>
                </button>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="py-40 flex flex-col items-center justify-center space-y-4 bg-white rounded-[3rem] border border-blue-50">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-foreground/40 font-black italic">Consultando el calendario mágico...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-blue-50 group hover:shadow-xl transition-all"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Calendar size={28} />
                                    </div>
                                    <EventStatus published={event.published} />
                                </div>

                                <h3 className="text-2xl font-black mb-2 line-clamp-1">{event.title || event.name}</h3>
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center space-x-2 text-foreground/40 font-bold text-sm">
                                        <CalendarDays size={16} className="text-primary" />
                                        <span>{new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-foreground/40 font-bold text-sm">
                                        <MapPin size={16} className="text-secondary" />
                                        <span>{event.location || 'Ubicación Pendiente'}</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-blue-50 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Ticket size={18} className="text-primary/40" />
                                        <span className="font-black text-foreground">0 Reservas</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button className="p-3 bg-blue-50 text-foreground/40 hover:text-primary rounded-xl hover:bg-white border border-transparent hover:border-blue-100 transition-all">
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="p-3 bg-red-50 text-red-400 hover:text-red-500 rounded-xl hover:bg-white border border-transparent hover:border-red-100 transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {events.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 bg-blue-50/20 rounded-[3rem] border-4 border-dashed border-blue-100">
                            <CalendarDays className="w-16 h-16 text-blue-200" />
                            <p className="text-2xl text-foreground/20 font-black italic">No hay eventos próximos en el horizonte...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
