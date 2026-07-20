# 🏛️ Arquitectura — Kidsfun Platform

Diagrama y descripción de alto nivel del sistema.

## Vista general

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS                                     │
│                                                                           │
│    🌐 Web pública              📱 App móvil Flutter        👨‍💼 Admin     │
│    (Next.js)                  (legado)                    (Next.js /admin)│
└────────┬───────────────────────────┬───────────────────────┬──────────────┘
         │ HTTPS                     │ HTTPS                 │ HTTPS
         │                           │ + Firebase Auth
         ▼                           ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              Next.js (apps/web) — Puerto 3000                             │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐    │
│  │  (public) layout         │  │  /admin layout                        │   │
│  │  - Header / Footer       │  │  - Sidebar azul + Topbar             │   │
│  │  - Home, Productos       │  │  - Dashboard, Productos, Eventos    │   │
│  │  - Eventos, Checkout     │  │  - Waivers, Chats, Mensajes          │   │
│  │  - /cuenta, /contacto    │  │  - Métricas, Usuarios, Sudo          │   │
│  └─────────────────────────┘  └──────────────────────────────────────┘    │
│           │                                  │                            │
│           └──────────────┬───────────────────┘                            │
│                          │                                                │
│  • AuthProvider (Firebase Auth Client)                                     │
│  • /api/* → rewrite a NestJS en dev                                        │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ HTTP + Bearer <Firebase ID Token>
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              NestJS (apps/api) — Puerto 3001                              │
│                                                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ Products│ │ Events  │ │ Waivers │ │  Chat   │ │  Push   │ │ Contact ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘│
│       │           │           │           │           │           │      │
│  ┌────┴───────────┴───────────┴───────────┴───────────┴───────────┴────┐ │
│  │             PrismaService (global)  +  BigIntInterceptor             │ │
│  └────────────────────────────────┬────────────────────────────────────┘ │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   MariaDB 10.6 (puerto 3306)                              │
│                                                                           │
│  Schema preservado del Django legacy (con @@map):                         │
│  • t_app_product_product  (Product)                                        │
│  • t_app_product_like     (ProductLike)                                   │
│  • t_app_product_comment  (ProductComment)                                │
│  • t_app_event            (Event)                                         │
│  • waiver_v2_waiverqr     (WaiverQRV2)                                    │
│  • waiver_v2_waiverdata   (WaiverDataV2)                                  │
│  • waiver_v2_waiverscan   (WaiverScanV2)                                  │
│  • chat_*                 (ChatRoom, ChatMessage)                         │
│  • …                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│              Servicios externos (Firebase, SMTP)                         │
│                                                                           │
│  • Firebase Auth (Google + email/password)                                │
│  • Firebase Cloud Messaging (push notifications)                          │
│  • SMTP Gmail (emails transaccionales: waiver, contacto)                  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Capas

| Capa | Responsabilidad | Tecnología |
|---|---|---|
| **Presentación (web)** | UI responsive, SSR/SSG, SEO | Next.js 14, Tailwind, shadcn/ui |
| **Presentación (admin)** | CRUD interno, dashboard | Next.js 14, recharts, Firebase Auth |
| **Presentación (móvil)** | App nativa iOS/Android | Flutter (legado) |
| **API** | Lógica de negocio, validación, auth | NestJS 10, Prisma, Firebase Admin |
| **Datos** | Persistencia relacional | MariaDB 10.6 |
| **Externos** | Auth, push, email | Firebase, SMTP |

## Patrones clave

- **Monorepo** (pnpm workspaces): `apps/api`, `apps/web`, `packages/shared`
- **Route groups** Next.js: `(public)` y `admin` para layouts distintos
- **Server Components** por defecto; **Client Components** (`'use client'`) solo donde hay interactividad
- **Prisma** con `@@map` para preservar nombres de tabla del schema Django
- **BigInt interceptor** global para serializar IDs grandes a `number` en JSON
- **AuthProvider** escucha Firebase Auth y expone `getToken()` con auto-refresh (< 60s)
- **Rewrites** en `next.config.mjs` para proxy `/api/*` y `/media/*` al backend en dev

## Flujos principales

### 1. Compra / Waiver (público)

```
[Cliente] → /productos/:id
         → "Reservar" → /checkout
         → Stepper 3 pasos (datos / familiares / confirmar)
         → [Si no auth] → /cuenta?next=/checkout/confirm
         → Login Firebase → submit
         → POST /api/v2/waiver (Bearer token)
         → Backend: genera QR + PDF + email
         → /checkout/success?qr=XXX
         → Descargar PDF / QR
```

### 2. Validación en puerta (admin)

```
[Staff] → /admin/waivers/escanear
       → Ingresa/scanea QR (form input)
       → POST /api/v2/waiver/validate (Bearer admin token)
       → Backend registra scan + actualiza status
       → UI muestra "Acceso permitido" + datos del titular
```

### 3. Push notification (admin)

```
[Admin] → /admin/notificaciones
        → Compone título + body
        → Selecciona segmento (todos / asistentes a evento / compradores)
        → POST /api/push/send (Bearer admin token)
        → Backend (firebase-admin messaging.send) → FCM → dispositivos
```

## Despliegue

| Entorno | Comando |
|---|---|
| Local (dev) | `pnpm dev` (concurrently api + web) |
| Docker (todo) | `docker compose up --build` |
| Solo DB local | `docker compose up -d db` |
| Build prod | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` |

Ver [`README.md`](./README.md) principal para setup detallado.
