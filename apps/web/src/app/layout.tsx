import type { Metadata } from "next";
import { Titan_One, Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const titanOne = Titan_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kidsfun y Fiestas Infantiles",
  description:
    "Brincolines, juegos inflables y diversión para tus fiestas infantiles. Renta de equipos para cumpleaños, graduaciones y eventos familiares.",
  keywords: [
    "brincolines",
    "fiestas infantiles",
    "alquiler",
    "El Salvador",
    "eventos",
    "bounce house",
  ],
  openGraph: {
    title: "Kidsfun y Fiestas Infantiles",
    description: "La fiesta perfecta empieza aquí",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${titanOne.variable} ${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-surface text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}
