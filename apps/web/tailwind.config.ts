import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      // ============================================================
      // Paleta de colores Kidsfun
      // ============================================================
      colors: {
        // Brand
        primary: {
          DEFAULT: "#1E3A8A", // deep blue - sidebar admin, CTAs primarios
          50: "#EFF3FB",
          100: "#D9E2F2",
          200: "#B3C5E5",
          300: "#7E9BD0",
          400: "#4F72BB",
          500: "#1E3A8A",
          600: "#182F70",
          700: "#112355",
          800: "#0B1839",
          900: "#050C1D",
        },
        "brand-yellow": {
          DEFAULT: "#F5A91B", // amber gold - navbar público, logo, "Reservar"
          50: "#FEF6E7",
          100: "#FDE9C0",
          200: "#FBD48A",
          300: "#F9BE54",
          400: "#F7B135",
          500: "#F5A91B",
          600: "#D08E15",
          700: "#9D6A0F",
          800: "#6A4709",
          900: "#382504",
        },
        "party-pink": {
          DEFAULT: "#EC4899", // magenta - badges celebración, hover
          50: "#FDF2F8",
          100: "#FCE7F3",
          200: "#FBCFE8",
          300: "#F9A8D4",
          400: "#F472B6",
          500: "#EC4899",
          600: "#DB2777",
          700: "#BE185D",
          800: "#9D174D",
          900: "#831843",
        },
        // Status
        success: "#10B981", // emerald
        warning: "#F59E0B", // amber
        danger: "#EF4444", // red
        info: "#3B82F6", // blue
        // Surfaces
        surface: "#FAFAFA",
        "surface-elevated": "#FFFFFF",
        border: "#E2E8F0",
        // Text
        "text-primary": "#0F172A",
        "text-muted": "#64748B",
        // Footer (azul oscuro)
        "footer-bg": "#0A1844",
        // Legacy
        background: "#FAFAFA",
        foreground: "#0F172A",
      },
      fontFamily: {
        // Logo wordmark (fiesta, divertido)
        display: ['"Titan One"', "cursive"],
        // Headings / UI (moderno, geométrico, amigable)
        heading: ['"Plus Jakarta Sans"', "sans-serif"],
        // Body (legible, profesional)
        sans: ['"Inter"', "system-ui", "sans-serif"],
        // Mono (IDs, QR codes)
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        // Escala adicional
        "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-lg": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem", // 16px para modales
        "2xl": "1.25rem",
      },
      boxShadow: {
        // Sombras suaves premium
        soft: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)",
        medium: "0 4px 12px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.06)",
        large: "0 10px 25px rgba(15,23,42,0.12), 0 4px 10px rgba(15,23,42,0.08)",
        glow: "0 0 30px rgba(245,169,27,0.25)",
        "primary-glow": "0 0 30px rgba(30,58,138,0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #1E3A8A 0%, #F5A91B 100%)",
        "gradient-party":
          "linear-gradient(135deg, #EC4899 0%, #F5A91B 100%)",
        "gradient-footer":
          "linear-gradient(180deg, #0A1844 0%, #1A1A2E 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
