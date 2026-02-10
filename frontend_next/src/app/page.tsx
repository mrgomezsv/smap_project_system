'use client';

import Hero from "@/components/home/Hero";
import ProductCatalog from "@/components/products/ProductCatalog";
import WhyUs from "@/components/home/WhyUs";
import EventShowcase from "@/components/events/EventShowcase";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="page-transition">
      <Hero />

      {/* Featured Banner / Quote */}
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-white space-y-6 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">¿Planeas algo grande?</h3>
                <p className="text-white/80">Personalizamos cada detalle para tu evento espacial.</p>
              </div>
            </div>
            <button className="px-8 py-3 bg-white text-primary font-black rounded-xl hover:bg-accent hover:text-foreground transition-all">
              Cotizar ahora
            </button>
          </div>
        </div>
      </section>

      <ProductCatalog />

      {/* Share Magic Section - Inspired by original site */}
      <section className="py-16 bg-white border-y border-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-black mb-8">¡Comparte la Magia con tus amigos!</h3>
          <div className="flex justify-center space-x-6">
            {['WhatsApp', 'Facebook', 'Instagram'].map((platform) => (
              <motion.button
                key={platform}
                whileHover={{ y: -5, scale: 1.1 }}
                className="px-6 py-3 bg-card-bg rounded-2xl shadow-sm border border-gray-100 font-bold text-foreground/70 hover:text-primary transition-all"
              >
                {platform}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <WhyUs />

      {/* Payment methods preview - From legacy site */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 text-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <p className="text-sm font-bold uppercase tracking-widest mb-6">Métodos de Pago Aceptados</p>
          <div className="flex flex-wrap justify-center gap-8 text-3xl">
            <span>💳</span> <span>🏦</span> <span>📥</span> <span>📱</span>
          </div>
        </div>
      </section>

      {/* Event Showcase replaces Newsletter */}
      <EventShowcase />
    </div>
  );
}
