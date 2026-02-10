'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                KF
                            </div>
                            <span className="text-2xl font-black tracking-tight">
                                Kids<span className="text-primary">Fun</span>
                            </span>
                        </Link>
                        <p className="text-foreground/60 leading-relaxed">
                            Expertos en crear experiencias inolvidables para los más pequeños. Calidad, seguridad y diversión en cada evento.
                        </p>
                        <div className="flex space-x-4">
                            {[Instagram, Facebook, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-foreground/40 hover:bg-primary hover:text-white transition-all">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Explorar</h4>
                        <ul className="space-y-4 text-foreground/60">
                            <li><Link href="/productos" className="hover:text-primary transition-colors">Productos</Link></li>
                            <li><Link href="/eventos" className="hover:text-primary transition-colors">Próximos Eventos</Link></li>
                            <li><Link href="/galeria" className="hover:text-primary transition-colors">Galería Mágica</Link></li>
                            <li><Link href="/nosotros" className="hover:text-primary transition-colors">Nuestra Historia</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Soporte</h4>
                        <ul className="space-y-4 text-foreground/60">
                            <li><Link href="/faq" className="hover:text-primary transition-colors">Preguntas Frecuentes</Link></li>
                            <li><Link href="/seguridad" className="hover:text-primary transition-colors">Protocolos de Seguridad</Link></li>
                            <li><Link href="/terminos" className="hover:text-primary transition-colors">Términos y Condiciones</Link></li>
                            <li><Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Contacto</h4>
                        <ul className="space-y-4 text-foreground/60">
                            <li className="flex items-center space-x-3">
                                <Mail size={18} className="text-primary" />
                                <span>hola@kidsfun.com</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Phone size={18} className="text-primary" />
                                <span>+1 (234) 567-890</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <MapPin size={18} className="text-primary" />
                                <span>Miami, Florida, EE.UU.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center text-foreground/40 text-sm font-medium space-y-4 md:space-y-0">
                    <p>© 2025 KidsFun & Fiestas Infantiles. Todos los derechos reservados.</p>
                    <p>Desarrollado con pasión por <a href="https://www.linkedin.com/in/mrgomez-dev/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mario Roberto</a></p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
