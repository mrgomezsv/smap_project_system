import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "KidsFun | Fiestas Infantiles e Inflables y Juegos Mecánicos",
  description: "La mejor diversión para tus fiestas infantiles en Miami y alrededores: inflables, juegos mecánicos, mobiliario y más. ¡Haz tu evento inolvidable con KidsFun!",
  keywords: ["fiestas infantiles", "juegos mecánicos", "alquiler de inflables", "decoración de fiestas", "diversión para niños"],
  authors: [{ name: "KidsFun Team" }],
  openGraph: {
    title: "KidsFun | Magia en tus Fiestas Infantiles",
    description: "Alquiler de inflables y juegos mecánicos para eventos infantiles.",
    type: "website",
  }
};

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingMagic from "@/components/layout/FloatingMagic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${outfit.variable} font-sans antialiased bg-background text-foreground relative`}
      >
        <FloatingMagic />
        <div className="flex flex-col min-h-screen relative z-10">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
