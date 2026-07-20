# apps/web — Next.js Frontend

Sitio público y panel admin de Kidsfun.

## Stack

- **Next.js 14** (App Router, RSC, Server Actions)
- **TypeScript 5**
- **Tailwind CSS 3** + tokens del sistema de diseño
- **shadcn/ui** (componentes accesibles)
- **Firebase Auth Client** (Google + email)
- **Recharts** (métricas)
- **qrcode** (generación QR en cliente)
- **boneyard-js** (skeletons)

## Estructura

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Home pública
│   ├── (public)/               # Rutas públicas
│   │   ├── layout.tsx          # Header + Footer
│   │   ├── productos/          # A2 catálogo + A3 detalle
│   │   ├── eventos/            # A4 lista + detalle
│   │   ├── checkout/           # A5 stepper + waiver + success
│   │   ├── contacto/           # Form
│   │   ├── sobre-nosotros/     # About
│   │   ├── metodos-de-pago/    # Zelle
│   │   ├── terminos/           # Términos legales
│   │   ├── mobile-app/         # Landing app
│   │   └── cuenta/             # Login público
│   ├── admin/                  # Rutas admin (URLs /admin/*)
│   │   ├── dashboard/          # B2
│   │   ├── signin/             # B1
│   │   ├── productos/          # B3-B4
│   │   ├── eventos/            # B5
│   │   ├── waivers/            # B6-B7
│   │   ├── chats/              # B8
│   │   ├── mensajes/           # B9
│   │   ├── notificaciones/     # B10
│   │   ├── metricas/           # B11
│   │   ├── usuarios/           # B12
│   │   └── sudo/               # B13
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   └── loading.tsx
├── components/
│   ├── public/                 # Header, Footer, ProductCard
│   ├── admin/                  # AdminShell, DataTable, forms…
│   ├── auth/                   # AuthProvider, UserMenu, CuentaForm
│   ├── checkout/               # CheckoutProvider + forms
│   ├── contact/                # ContactForm
│   ├── mobile-app/             # MobileAppDownload
│   └── ui/                     # Skeleton, SafeImage
├── lib/
│   ├── api.ts                  # Cliente HTTP (con getToken)
│   ├── firebase.ts             # Init Firebase Client
│   ├── metadata.ts             # SEO metadata centralizado
│   └── types.ts                # Tipos compartidos
└── ...
```

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MEDIA_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://kidsfunyfiestasinfantiles.com

# Firebase (opcional en dev)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Scripts

```bash
pnpm dev             # next dev
pnpm build           # next build
pnpm start           # next start
pnpm lint            # next lint
```

## Sistema de diseño

Tokens centralizados en `src/app/globals.css` + `tailwind.config.ts`:

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#1E3A8A` | Sidebar admin, CTAs |
| `--color-brand-yellow` | `#F5A91B` | Navbar público |
| `--color-party-pink` | `#EC4899` | Badges celebración |
| `--color-success` | `#10B981` | Disponibles, válidos |
| `--color-warning` | `#F59E0B` | Pocas unidades |
| `--color-danger` | `#EF4444` | Agotado, errores |
| `--color-surface` | `#FAFAFA` | Fondo página |
| `--color-surface-elevated` | `#FFFFFF` | Cards |
| `--color-border` | `#E2E8F0` | Divisores |
| `--color-text-primary` | `#0F172A` | Texto principal |
| `--color-text-muted` | `#64748B` | Texto secundario |

**Tipografías** (cargadas desde Google Fonts en `app/layout.tsx`):
- `Titan One` → logo wordmark
- `Plus Jakarta Sans` → headings
- `Inter` → body
- `JetBrains Mono` → IDs, QR codes

## Rutas

| URL | Layout | Descripción |
|---|---|---|
| `/` | public | Home |
| `/productos` | public | Catálogo |
| `/productos/:id` | public | Detalle producto |
| `/eventos` | public | Lista eventos |
| `/eventos/:id` | public | Detalle evento |
| `/checkout` | public | Stepper waiver |
| `/checkout/success?qr=…` | public | Waiver generado |
| `/contacto` | public | Form |
| `/cuenta` | public | Login público |
| `/mobile-app` | public | Landing app |
| `/admin/dashboard` | admin | Dashboard |
| `/admin/signin` | admin | Login admin |
| `/admin/productos` | admin | Lista productos |
| `/admin/waivers/escanear` | admin | Scanner QR puerta |
| … | … | … |

## Code splitting

- `UserMenu` se carga dinámicamente (`dynamic({ ssr: false })`)
- Componentes pesados (recharts, modales) en sus propios chunks
- Imágenes vía `next/image` con lazy loading
