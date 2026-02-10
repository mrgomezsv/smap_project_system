'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    User,
    Mail,
    Phone,
    Clock,
    Search,
    Loader2,
    Inbox,
    ChevronRight,
    Star
} from 'lucide-react';
import { api } from '@/lib/api';

export default function MessagesPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const data = await api.contact.list();
                const list = Array.isArray(data) ? data : (data.results || []);
                setMessages(list);
            } catch (error) {
                console.error("Error fetching admin messages:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, []);

    const selectedMessage = messages.find(m => m.id === selectedId);

    return (
        <div className="h-[calc(100vh-14rem)] flex flex-col space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-foreground tracking-tight">
                    Bandeja de <span className="text-yellow-400 italic">Mensajes</span>
                </h1>
                <p className="text-foreground/40 font-bold mt-2">Atiende las consultas de tus clientes potenciales.</p>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white rounded-[3rem] border border-blue-50">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-foreground/40 font-black italic">Abriendo el buzón mágico...</p>
                </div>
            ) : (
                <div className="flex-1 flex gap-8 min-h-0">
                    {/* List */}
                    <div className="w-1/3 bg-white rounded-[2.5rem] border border-blue-50 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-blue-50">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar mensajes..."
                                    className="w-full pl-10 pr-4 py-3 bg-blue-50/50 rounded-xl outline-none text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedId(m.id)}
                                    className={`w-full text-left p-6 rounded-3xl transition-all border ${selectedId === m.id
                                            ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/20'
                                            : 'hover:bg-blue-50 border-transparent hover:border-blue-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-black truncate flex-1 tracking-tight">{m.name || m.full_name}</p>
                                        <Star size={14} className={m.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'opacity-20'} />
                                    </div>
                                    <p className={`text-xs font-bold truncate mb-3 ${selectedId === m.id ? 'text-white/60' : 'text-foreground/40'}`}>
                                        {m.subject || 'Sin Asunto'}
                                    </p>
                                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                                        <Clock size={10} />
                                        <span>Hace 2 horas</span>
                                    </div>
                                </button>
                            ))}
                            {messages.length === 0 && (
                                <div className="py-20 text-center opacity-20">
                                    <Inbox size={48} className="mx-auto mb-4" />
                                    <p className="font-black italic">Bandeja vacía</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white rounded-[2.5rem] border border-blue-50 overflow-hidden flex flex-col">
                        {selectedMessage ? (
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={selectedMessage.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex-1 flex flex-col p-10"
                                >
                                    <div className="flex justify-between items-start mb-10 pb-10 border-b border-blue-50">
                                        <div className="flex items-center space-x-6">
                                            <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                                                <User size={40} />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-foreground tracking-tight">{selectedMessage.name || selectedMessage.full_name}</h2>
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <div className="flex items-center space-x-1.5 text-foreground/40 font-bold text-sm">
                                                        <Mail size={14} className="text-primary" />
                                                        <span>{selectedMessage.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5 text-foreground/40 font-bold text-sm">
                                                        <Phone size={14} className="text-secondary" />
                                                        <span>{selectedMessage.phone || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-6 pr-4">
                                        <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50">
                                            <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">ASUNTO: {selectedMessage.subject || 'CONSULTA GENERAL'}</p>
                                            <p className="text-lg font-medium text-foreground/70 leading-relaxed italic">
                                                "{selectedMessage.message || selectedMessage.comment}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-10 border-t border-blue-50 flex space-x-4">
                                        <button className="flex-1 bg-primary text-white py-5 rounded-2xl font-black shadow-[0_6px_0_rgb(29,78,216)] hover:shadow-none hover:translate-y-1 transition-all">
                                            RESPONDER AHORA
                                        </button>
                                        <button className="px-8 bg-white text-red-500 border-4 border-red-50 rounded-2xl font-black hover:bg-red-50 transition-all">
                                            ELIMINAR
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10">
                                <MessageSquare size={120} className="mb-6" />
                                <h3 className="text-4xl font-black italic">Selecciona un mensaje<br />para leer la magia</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
