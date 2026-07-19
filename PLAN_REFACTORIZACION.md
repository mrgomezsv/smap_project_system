# Plan de Refactorización — Kidsfun Platform

> Migración completa de `smap_project_system` (Django monolith) a **Next.js (frontend) + NestJS (backend)** sobre monorepo `pnpm`, conservando todos los datos y funcionalidades. Sin push al remoto. Solo commits locales en la rama `produccion2027`.

---

## 1. Resumen ejecutivo

| Antes | Después |
|---|---|
| Django 4.2 monolítico (backend + templates + admin) | NestJS (API) + Next.js 14 (frontend) en monorepo pnpm |
| Django Templates (Bootstrap 4 + jQuery) | Next.js App Router + Tailwind + shadcn/ui |
| DRF (Django REST Framework) | NestJS Controllers + Services + Prisma |
| MariaDB + ORM Django | MariaDB + Prisma (mismas tablas, datos importados) |
| Pyfcm + firebase_admin | firebase-admin + @nestjs/notifications |
| Reportlab + qr.QrCodeWidget | pdf-lib + qrcode |
| kidsfun_app (Flutter) consumiendo Django REST | kidsfun_app consumiendo NestJS (solo cambia URL base) |

**Lo que NO cambia:** datos, dominio, integraciones Firebase, dominio de producción `kidsfunyfiestasinfantiles.com`, credenciales.

---

## 2. Decisiones tomadas

| Decisión | Elección | Razón |
|---|---|---|
| Framework backend | **NestJS** | Estructura modular similar a Django (controllers/services/modules), TypeScript nativo, decoradores equivalentes a Django class-based views |
| ORM | **Prisma** | Schema declarativo, migraciones automáticas, type-safe, excelente DX, soporta MariaDB |
| Base de datos | **MariaDB 10.6** (se mantiene) | Cero downtime, dump actual funciona tal cual, Prisma soporta MariaDB nativamente |
| Frontend | **Next.js 14** (App Router) + TypeScript | SSR/SSG, server components, file-based routing, mejor SEO y performance |
| Estilos | **Tailwind CSS** + **shadcn/ui** | Sistema de tokens consistente, componentes accesibles, copy-paste |
| Package manager | **pnpm** | Estándar solicitado, ahorra espacio en disco con hard links |
| Skeletons | **boneyard-js** | Pulse/shimmer loaders para UX premium (compatible React) |
| Animaciones | **Framer Motion** + Tailwind transitions | Estándar en Next.js para micro-interacciones |
| Auth cliente | **Firebase Auth Client SDK** | Mismo flujo que Flutter (Google + Apple + email) |
| Auth server | **Firebase Admin SDK** | Mismo que Python actual (`verify_id_token`) |
| Push | **firebase-admin** + `messaging.send` | Mismo que Python actual |
| Email | **nodemailer** con SMTP Gmail | Reemplazo directo de `django.core.mail` |
| PDF | **pdf-lib** | API más moderna que reportlab, misma salida |
| QR | **qrcode** (npm) | Genera PNG/DataURL directo |
| File upload | **multer** | Estándar para uploads en NestJS |
| Validación | **class-validator** + **class-transformer** | Equivalente a DRF serializers |
| Tests backend | **Jest** + **supertest** | Estándar NestJS |
| Tests frontend | **Vitest** + **Testing Library** | Rápido, integra con Next.js |
| App Flutter | **Se queda como legado** | Solo cambia `BASE_URL` en `lib/apis/api_manager.dart` |

---

## 3. Arquitectura destino (monorepo)

```
smap_project_system/
├── apps/
│   ├── api/                      # NestJS backend (puerto 3001)
│   │   ├── src/
│   │   │   ├── auth/             # Firebase auth guard + decorators
│   │   │   ├── products/         # Módulo productos
│   │   │   ├── likes/            # Módulo likes
│   │   │   ├── comments/         # Módulo comentarios
│   │   │   ├── waivers/          # Módulo waivers v2
│   │   │   ├── chat/             # Módulo chat
│   │   │   ├── contact/          # Módulo mensajes web
│   │   │   ├── push/             # Módulo notificaciones push
│   │   │   ├── upload/           # Módulo uploads
│   │   │   ├── prisma/           # PrismaService global
│   │   │   ├── common/           # Filters, interceptors, pipes
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                      # Next.js frontend (puerto 3000)
│       ├── app/
│       │   ├── (public)/         # Rutas públicas (sin layout admin)
│       │   │   ├── page.tsx                  # A1 Home
│       │   │   ├── productos/page.tsx       # A2 Catálogo
│       │   │   ├── productos/[id]/page.tsx   # A3 Detalle
│       │   │   ├── eventos/page.tsx          # A4 Eventos
│       │   │   ├── eventos/[id]/page.tsx
│       │   │   ├── checkout/page.tsx        # A5 Checkout
│       │   │   ├── checkout/waiver/page.tsx
│       │   │   ├── checkout/success/page.tsx
│       │   │   ├── contacto/page.tsx
│       │   │   ├── sobre-nosotros/page.tsx
│       │   │   ├── metodos-de-pago/page.tsx
│       │   │   ├── terminos/page.tsx
│       │   │   └── mobile-app/page.tsx       # A7 Landing app
│       │   ├── (admin)/          # Rutas admin (con layout admin)
│       │   │   ├── signin/page.tsx           # B1 Login
│       │   │   ├── dashboard/page.tsx        # B2 Dashboard
│       │   │   ├── productos/page.tsx        # B3 Lista
│       │   │   ├── productos/nuevo/page.tsx  # B4 Crear
│       │   │   ├── productos/[id]/page.tsx    # B4 Editar
│       │   │   ├── eventos/page.tsx
│       │   │   ├── eventos/nuevo/page.tsx
│       │   │   ├── eventos/[id]/page.tsx
│       │   │   ├── waivers/page.tsx           # B6
│       │   │   ├── waivers/escanear/page.tsx  # B7
│       │   │   ├── chats/page.tsx             # B8
│       │   │   ├── mensajes/page.tsx          # B9
│       │   │   ├── notificaciones/page.tsx   # B10
│       │   │   ├── metricas/page.tsx          # B11
│       │   │   ├── usuarios/page.tsx          # B12
│       │   │   └── sudo/page.tsx              # B13
│       │   ├── api/               # Route handlers de Next (proxy a Nest)
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/                # shadcn/ui
│       │   ├── public/            # Componentes sitio público
│       │   ├── admin/             # Componentes admin
│       │   └── shared/            # Compartidos
│       ├── lib/
│       │   ├── api.ts             # Cliente HTTP al backend
│       │   ├── auth.ts            # Firebase Auth Client
│       │   └── utils.ts
│       ├── public/
│       ├── tailwind.config.ts
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                    # Tipos TypeScript compartidos
│       ├── src/
│       │   ├── types/
│       │   │   ├── product.ts
│       │   │   ├── waiver.ts
│       │   │   ├── user.ts
│       │   │   └── api.ts
│       │   └── index.ts
│       └── package.json
│
├── legacy/
│   └── django/                    # Código Django preservado (referencia)
│       ├── smap_project/
│       ├── t_app_product/
│       ├── waiver_v2/
│       ├── kidsfun_web/
│       ├── manage.py
│       └── ...
│
├── backups/                       # gitignored (dumps)
├── media/                         # gitignored (archivos subidos)
├── product_images/                # gitignored
├── event_images/                  # gitignored
├── logs/                          # gitignored
│
├── pnpm-workspace.yaml
├── package.json                   # Raíz del monorepo
├── .npmrc
├── .editorconfig
├── .gitattributes
├── docker-compose.yml             # Actualizado para monorepo
├── Dockerfile.api                 # Nuevo
├── Dockerfile.web                 # Nuevo
├── .gitignore
├── PLAN_REFACTORIZACION.md        # Este archivo
└── README.md
```

---

## 4. Sistema de diseño (resumen)

Definido en `apps/web/tailwind.config.ts` + `apps/web/app/globals.css`:

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#1E3A8A` | Sidebar admin, CTAs primarios |
| `--color-brand-yellow` | `#F5A91B` | Navbar público, botón "Reservar" |
| `--color-party-pink` | `#EC4899` | Badges celebración, hover |
| `--color-success` | `#10B981` | "Disponible", waiver válido |
| `--color-warning` | `#F59E0B` | "Quedan pocas unidades" |
| `--color-danger` | `#EF4444` | "Agotado", errores |
| `--color-surface` | `#FAFAFA` | Fondo página |
| `--color-surface-elevated` | `#FFFFFF` | Cards |
| `--color-border` | `#E2E8F0` | Divisores |
| `--color-text-primary` | `#0F172A` | Texto principal |
| `--color-text-muted` | `#64748B` | Texto secundario |

**Tipografías** (cargadas desde Google Fonts en `apps/web/app/layout.tsx`):
- `Titan One` → logo wordmark
- `Plus Jakarta Sans` → headings (700/600/500)
- `Inter` → body (400/500/600)
- `JetBrains Mono` → IDs, QR codes, timestamps

**Componentes base:** shadcn/ui (Button, Card, Dialog, Sheet, Input, Select, Toast, Table, Tabs, Accordion, etc.) con tokens custom.

**Responsive breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`

**Skeletons:** `boneyard-js` con `animate="shimmer"`, `stagger={80}` para cascada.

---

## 5. Fases de trabajo (con commits atómicos)

> **Reglas de commits:**
> - Mensaje en español, claro y corto (< 60 chars en subject).
> - Un commit = un cambio lógico. Si dudas si va en 2 commits, va en 2.
> - Formato: `tipo(scope): descripción` siguiendo Conventional Commits.
> - Tipos: `chore` (config/setup), `feat` (funcionalidad nueva), `fix` (bug), `refactor`, `test`, `docs`, `style`.
> - **NO push al remoto.** Todo local.
> - Branch: `produccion2027`.

---

### FASE 0 — Preparación (sin código, solo docs)

| # | Commit | Contenido |
|---|---|---|
| 1 | `chore: crear PLAN_REFACTORIZACION.md` | Este archivo |
| 2 | `chore: documentar convenciones de commits en COMMIT_STANDARDS.md` | Actualizar el existente con las nuevas reglas |

---

### FASE 1 — Monorepo y tooling

| # | Commit | Contenido |
|---|---|---|
| 3 | `chore: crear pnpm-workspace.yaml` | Define `apps/*` y `packages/*` |
| 4 | `chore: crear package.json raíz` | Scripts: `dev`, `build`, `lint`, `test`, `db:migrate` |
| 5 | `chore: crear .npmrc con configuración pnpm` | `node-linker=hoisted`, `auto-install-peers=true` |
| 6 | `chore: crear .editorconfig y .gitattributes` | Consistencia de fin de línea y encoding |
| 7 | `chore: crear estructura de directorios apps y packages` | Carpetas vacías con `.gitkeep` |
| 8 | `chore: mover código Django a legacy/django` | Preservar todo el código Python actual como referencia |
| 9 | `chore: actualizar .gitignore para monorepo` | Agregar `node_modules`, `dist`, `.next`, `coverage`, etc. |
| 10 | `chore: actualizar docker-compose.yml para monorepo` | Servicios: `db`, `api`, `web` |

---

### FASE 2 — Backend NestJS base

| # | Commit | Contenido |
|---|---|---|
| 11 | `chore(api): inicializar NestJS con TypeScript` | `nest new` adaptado, `package.json`, `tsconfig.json`, `nest-cli.json` |
| 12 | `chore(api): agregar Prisma y @prisma/client` | Dependencias + `prisma init` con datasource MariaDB |
| 13 | `chore(api): crear .env.example con variables backend` | `DATABASE_URL`, `FIREBASE_*`, `SMTP_*`, `JWT_*` |
| 14 | `chore(api): agregar PrismaService global` | Módulo `prisma` exportando PrismaClient |
| 15 | `chore(api): agregar logger global con winston` | Logging estructurado en JSON |
| 16 | `chore(api): agregar exception filter global` | Traducción de errores Prisma/Nest a HTTP |
| 17 | `chore(api): agregar validation pipe global` | `class-validator` + `ValidationPipe({whitelist: true})` |
| 18 | `chore(api): configurar CORS para Next.js` | Orígenes permitidos según entorno |

---

### FASE 3 — Auth + Firebase

| # | Commit | Contenido |
|---|---|---|
| 19 | `chore(api): instalar firebase-admin` | Dependencia |
| 20 | `chore(api): crear módulo auth con Firebase Admin` | Inicialización singleton de la app |
| 21 | `feat(auth): crear guard FirebaseAuthGuard` | Verifica `Authorization: Bearer <token>` |
| 22 | `feat(auth): crear decorator @CurrentUser` | Extrae el user del request |
| 23 | `feat(auth): crear decorator @Public` | Marca rutas sin auth |
| 24 | `feat(auth): crear estrategia de mapeo Firebase UID → User` | `getOrCreate` equivalente al Python |
| 25 | `feat(auth): endpoint GET /api/auth/me` | Devuelve usuario actual |

---

### FASE 4 — Modelos Prisma + migración de datos

| # | Commit | Contenido |
|---|---|---|
| 26 | `feat(db): schema Prisma - modelos Product y Event` | `Product` (con 6 imágenes), `Event` (con slug, partners) |
| 27 | `feat(db): schema Prisma - modelos Like y Comment` | `ProductLike`, `ProductComment`, `CommentReply` |
| 28 | `feat(db): schema Prisma - modelos Waiver V2` | `WaiverQRV2`, `WaiverDataV2`, `WaiverScanV2`, `WaiverDocument` |
| 29 | `feat(db): schema Prisma - modelos Chat` | `ChatAdministrator`, `ChatRoom`, `ChatMessage` |
| 30 | `feat(db): schema Prisma - modelo ContactMessage` | |
| 31 | `feat(db): schema Prisma - modelo WaiverValidator` | |
| 32 | `feat(db): ejecutar migración inicial Prisma` | `prisma migrate dev --name init` |
| 33 | `feat(db): script de import de datos desde dump MariaDB` | Lee `backups/smap_kf_backup_*.sql.gz` y popula Prisma |
| 34 | `test(db): validar conteos post-import` | Script que compara totales antes/después |

---

### FASE 5 — API Products

| # | Commit | Contenido |
|---|---|---|
| 35 | `feat(products): crear módulo Products` | Módulo + controller + service vacíos |
| 36 | `feat(products): DTOs con class-validator` | `CreateProductDto`, `UpdateProductDto`, `QueryProductDto` |
| 37 | `feat(products): endpoint GET /api/products` | Lista con filtros y paginación |
| 38 | `feat(products): endpoint GET /api/products/category/:cat` | Filtro por categoría |
| 39 | `feat(products): endpoint GET /api/products/:id` | Detalle |
| 40 | `feat(products): endpoint POST /api/products` | Crear (admin) |
| 41 | `feat(products): endpoint PATCH /api/products/:id` | Editar (admin) |
| 42 | `feat(products): endpoint DELETE /api/products/:id` | Eliminar (admin) |

---

### FASE 6 — API Likes

| # | Commit | Contenido |
|---|---|---|
| 43 | `feat(likes): crear módulo Likes` | |
| 44 | `feat(likes): endpoint GET /api/likes/product/:id` | Conteo total |
| 45 | `feat(likes): endpoint GET /api/likes/user/:uid/product/:pid` | Si el usuario marcó |
| 46 | `feat(likes): endpoint POST /api/likes/toggle` | Toggle |

---

### FASE 7 — API Comments

| # | Commit | Contenido |
|---|---|---|
| 47 | `feat(comments): crear módulo Comments` | |
| 48 | `feat(comments): endpoint POST /api/comments` | Crear (limpieza UTF-8 como en Django) |
| 49 | `feat(comments): endpoint GET /api/comments/product/:id` | Listar con replies |

---

### FASE 8 — API Waivers V2 (la más importante)

| # | Commit | Contenido |
|---|---|---|
| 50 | `chore(waivers): instalar pdf-lib y qrcode` | Dependencias |
| 51 | `feat(waivers): crear módulo Waivers` | |
| 52 | `feat(waivers): DTOs WaiverCreate y WaiverQuery` | |
| 53 | `feat(waivers): servicio QR con librería qrcode` | Genera DataURL y buffer PNG |
| 54 | `feat(waivers): servicio PDF con pdf-lib` | Layout equivalente al reportlab actual |
| 55 | `feat(waivers): servicio email con nodemailer` | SMTP Gmail + adjuntos |
| 56 | `feat(waivers): endpoint POST /api/v2/waiver` | Crear waiver + PDF + email |
| 57 | `feat(waivers): endpoint GET /api/v2/waiver/:qr` | Obtener por QR |
| 58 | `feat(waivers): endpoint GET /api/v2/waiver/user/:uid` | Lista del usuario |
| 59 | `feat(waivers): endpoint POST /api/v2/waiver/validate` | Valida QR y registra scan |
| 60 | `feat(waivers): endpoint GET /api/v2/waiver/download/:qr` | Descarga PDF |
| 61 | `feat(waivers): endpoint GET /api/v2/waiver/collaborator/scans` | Historial de scans |

---

### FASE 9 — API Push + Chat + Web Messages

| # | Commit | Contenido |
|---|---|---|
| 62 | `feat(push): crear módulo Push` | firebase-admin messaging |
| 63 | `feat(push): endpoint POST /api/push/send` | Envía a token específico |
| 64 | `feat(chat): crear módulo Chat` | |
| 65 | `feat(chat): endpoints ChatRoom CRUD` | |
| 66 | `feat(chat): endpoints ChatMessage` | Enviar, listar, marcar leído |
| 67 | `feat(contact): crear módulo ContactMessages` | |
| 68 | `feat(contact): CRUD web messages` | Listar, marcar leído, eliminar |

---

### FASE 10 — File uploads

| # | Commit | Contenido |
|---|---|---|
| 69 | `feat(uploads): instalar multer` | |
| 70 | `feat(uploads): crear módulo Upload` | |
| 71 | `feat(uploads): endpoint POST /api/upload/product-image` | Guarda en `media/product_images/` |

---

### FASE 11 — Tests backend

| # | Commit | Contenido |
|---|---|---|
| 72 | `chore(api): configurar Jest con nestjs/testing` | |
| 73 | `test(products): unit tests service` | |
| 74 | `test(waivers): integration tests waivers` | |
| 75 | `test(api): e2e tests con supertest` | Cubre los 14 endpoints principales |

---

### FASE 12 — Frontend Next.js base

| # | Commit | Contenido |
|---|---|---|
| 76 | `chore(web): inicializar Next.js 14 con TypeScript` | `create-next-app` con App Router |
| 77 | `chore(web): configurar Tailwind CSS` | `tailwind.config.ts`, `postcss.config.js`, `globals.css` |
| 78 | `chore(web): instalar shadcn/ui` | `components.json`, init de componentes base |
| 79 | `chore(web): cargar fuentes Google (Titan One, Plus Jakarta Sans, Inter)` | En `app/layout.tsx` |
| 80 | `chore(web): definir tokens de tema en Tailwind` | Paleta + tipografías + spacing |
| 81 | `chore(web): instalar boneyard-js` | |
| 82 | `feat(web): componente Header público` | Navbar amarillo sticky con logo |
| 83 | `feat(web): componente Footer` | Azul oscuro con links y redes |
| 84 | `feat(web): componente AdminSidebar` | Sidebar azul oscuro colapsable |
| 85 | `feat(web): layout base público` | `(public)/layout.tsx` |
| 86 | `feat(web): layout base admin` | `(admin)/layout.tsx` |
| 87 | `feat(web): instalar Firebase Client SDK` | |
| 88 | `feat(web): cliente HTTP al backend` | `lib/api.ts` con fetch wrapper + auth headers |

---

### FASE 13 — Frontend público (A1–A7)

| # | Commit | Contenido |
|---|---|---|
| 89 | `feat(home): hero de home pública` | Hero full-width con CTAs |
| 90 | `feat(home): sección categorías destacadas` | 6 cards |
| 91 | `feat(home): sección productos populares` | Grid de ProductCard |
| 92 | `feat(home): sección cómo funciona` | 3 pasos numerados |
| 93 | `feat(home): sección eventos próximos` | Carrusel |
| 94 | `feat(home): sección testimonios` | Avatares + cita |
| 95 | `feat(home): botón flotante WhatsApp` | |
| 96 | `feat(catalog): página catálogo de productos` | Grid + sidebar de filtros |
| 97 | `feat(catalog): componente ProductCard` | Imagen, badge, precio, like, comment count |
| 98 | `feat(catalog): filtros colapsables (categoría, precio)` | |
| 99 | `feat(catalog): búsqueda con autocompletado` | |
| 100 | `feat(catalog): estado vacío + skeleton` | Con boneyard-js |
| 101 | `feat(product): página detalle de producto` | Galería + tabs + sidebar de reserva |
| 102 | `feat(product): lightbox de imágenes` | Fullscreen con navegación |
| 103 | `feat(product): tabs descripción/especificaciones/videos` | |
| 104 | `feat(product): sección de comentarios` | Lista + form (requiere login) |
| 105 | `feat(product): productos similares` | |
| 106 | `feat(events): página de eventos públicos` | Grid de EventCards |
| 107 | `feat(events): página detalle evento público` | |
| 108 | `feat(checkout): stepper de checkout (datos/waiver/confirmación)` | |
| 109 | `feat(checkout): waiver form con tabla dinámica de familiares` | |
| 110 | `feat(checkout): success page con QR + descarga PDF` | |
| 111 | `feat(static): página contacto` | Form + mapa |
| 112 | `feat(static): página sobre nosotros` | |
| 113 | `feat(static): página métodos de pago` | Zelle + QR titular |
| 114 | `feat(static): página términos y condiciones` | |
| 115 | `feat(mobile-app): landing de la app móvil` | QR de descarga + mockup |

---

### FASE 14 — Frontend admin (B1–B13)

| # | Commit | Contenido |
|---|---|---|
| 116 | `feat(admin-auth): página signin` | Split layout desktop / solo form móvil |
| 117 | `feat(admin-auth): integración Firebase Auth Client` | Login con Google |
| 118 | `feat(dashboard): layout admin con sidebar y topbar` | |
| 119 | `feat(dashboard): stat cards con sparklines` | |
| 120 | `feat(dashboard): actividad reciente (timeline)` | |
| 121 | `feat(admin-products): tabla de productos` | |
| 122 | `feat(admin-products): componente DataTable genérico` | Reutilizable |
| 123 | `feat(admin-products): formulario crear producto` | Drop de imágenes con preview |
| 124 | `feat(admin-products): formulario editar producto` | |
| 125 | `feat(admin-products): confirm modal de eliminación` | |
| 126 | `feat(admin-products): bulk actions` | Publicar/despublicar/eliminar |
| 127 | `feat(admin-events): tabla de eventos` | |
| 128 | `feat(admin-events): formulario crear/editar evento` | Con date-picker y mapa |
| 129 | `feat(admin-waivers): tabla de waivers` | |
| 130 | `feat(admin-waivers): tabs por status` | Activos/Expirados/Por usuario |
| 131 | `feat(admin-waivers): scanner QR en puerta` | Vista optimizada tablet/móvil |
| 132 | `feat(admin-waivers): editor de documento legal` | Rich text |
| 133 | `feat(admin-chats): lista de conversaciones` | Split layout |
| 134 | `feat(admin-chats): thread de mensajes` | Burbujas + composer |
| 135 | `feat(admin-messages): bandeja de web messages` | Tipo email |
| 136 | `feat(admin-messages): bulk selection + delete` | |
| 137 | `feat(admin-push): formulario de notificación` | Con preview |
| 138 | `feat(admin-push): selector de segmento` | Todos/por evento/por producto |
| 139 | `feat(admin-metrics): charts con recharts` | Revenue, top productos, fuentes |
| 140 | `feat(admin-users): tabla de usuarios Firebase` | |
| 141 | `feat(admin-sudo): sudo admin panel` | Solo superusuario |
| 142 | `feat(admin-sudo): doble confirmación destructiva` | |

---

### FASE 15 — Integración end-to-end

| # | Commit | Contenido |
|---|---|---|
| 143 | `feat(auth): integración Firebase Auth en login público` | Para checkout y comentarios |
| 144 | `feat(api): cliente HTTP con interceptor de token` | Auto-refresh de token Firebase |
| 145 | `chore(web): configurar rewrites en next.config.js` | Proxy `/api/*` → NestJS en dev |
| 146 | `feat(checkout): end-to-end del flujo waiver` | Front → API → PDF → email |

---

### FASE 16 — Optimización, docs y deploy local

| # | Commit | Contenido |
|---|---|---|
| 147 | `perf(web): configurar next/image para todas las imágenes` | |
| 148 | `perf(web): lazy loading y code splitting` | |
| 149 | `feat(seo): metadata y OpenGraph en páginas públicas` | |
| 150 | `chore: README raíz con overview del monorepo` | |
| 151 | `chore(api): README en apps/api con setup local` | |
| 152 | `chore(web): README en apps/web con setup local` | |
| 153 | `chore: scripts de orquestación dev/start/stop` | `pnpm dev` levanta todo |
| 154 | `chore: docker-compose multi-stage para monorepo` | |
| 155 | `chore: Dockerfile.api multi-stage` | |
| 156 | `chore: Dockerfile.web multi-stage` | |
| 157 | `docs: agregar diagrama de arquitectura en README` | |

---

## 6. Estrategia de preservación de datos

**Sin pérdida de datos garantizada:**

1. **BD MariaDB actual:** se mantiene operativa durante toda la migración. NestJS (vía Prisma) apunta a la misma instancia. Las migraciones Prisma usan los mismos nombres de tablas (`db_table`) que Django actualmente.

2. **Datos legacy** (`managed=False` en Django): `WaiverData` (en `t_app_product_waiverdata`) y `WaiverDataDB` (en `api_waiver_waiverdata`) — se preservan tal cual, no se migran a Prisma, pero quedan accesibles vía Prisma con `@@map` apuntando a la tabla legacy.

3. **Media files:** los 225 archivos en `media/event_images/`, `media/product_images/`, `event_images/` y `product_images/` se quedan en disco. NestJS sirve los archivos estáticos desde `/media/*` (mismo path que Django). Next.js usa `next/image` con dominios permitidos apuntando a `localhost:3001`.

4. **Credenciales Firebase:** el JSON en `credentials/` se preserva. NestJS lo lee desde `FIREBASE_CREDENTIALS_PATH`.

5. **Dump de respaldo:** `backups/smap_kf_backup_*.sql.gz` se mantiene por si rollback es necesario.

6. **App Flutter:** solo cambia `BASE_URL` en `lib/apis/api_manager.dart` cuando vayamos a probar.

---

## 7. Plan de rollback (si algo falla)

El código Django queda **intacto** en `legacy/django/`. Para volver al estado anterior:

```bash
cd "/Users/mrgomez/Proyectos Mario/Kidsfun/smap_project_system"
git stash                                # guarda cambios en curso
git checkout main                        # vuelve a la rama estable
./run_all_in_one.sh                      # arranca Django otra vez
```

O desde Docker:

```bash
docker compose down
docker compose -f docker-compose.yml --profile legacy up -d
```

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de datos en migración | Script de validación de conteos pre/post. Backup del dump siempre accesible. |
| Incompatibilidad Prisma ↔ MariaDB en某些 campos | Probar schema en rama aislada antes de mergear |
| Firebase Admin SDK differences Python/Node | Mantener misma lógica (`verify_id_token` + `get_or_create`) |
| PDF generado difiere visualmente del original | Comparar PDFs lado a lado, ajustar `pdf-lib` hasta matchear |
| Email SMTP bloqueado por Gmail | Usar App Password ya configurado, fallback a MailHog en dev |
| Rendimiento de Prisma vs ORM Django | Prisma es más rápido en promedio, no debería haber regresión |
| App Flutter rompe al cambiar URL | Solo cambia 1 constante, ningún endpoint cambió de path |
| Tiempo total de migración | ~6-8 semanas. Se prioriza flujo público + waivers antes que admin completo |

---

## 9. Orden de ejecución recomendado

Por valor de negocio y dependencias técnicas:

1. **FASE 0-1** (preparación + monorepo) → 1 día
2. **FASE 2-3** (NestJS base + auth) → 1 día
3. **FASE 4** (Prisma + import de datos) → 1 día
4. **FASE 5** (Products API) → 0.5 día — desbloquea frontend público
5. **FASE 12** (Next.js base) → 1 día
6. **FASE 13** (Frontend público A1-A7) → 3-4 días — entrega valor visible rápido
7. **FASE 6-7** (Likes + Comments API) → 0.5 día
8. **FASE 8** (Waivers V2) → 2-3 días — el core del negocio
9. **FASE 9** (Push + Chat + Messages) → 1-2 días
10. **FASE 14** (Admin B1-B13) → 4-5 días
11. **FASE 10-11** (Uploads + Tests) → 1 día
12. **FASE 15-16** (Integración + optimización + docs) → 1-2 días

**Total estimado:** ~16-20 días de trabajo focused.

---

## 10. Criterios de "listo" para cada fase

Antes de marcar una fase como completa:

- [ ] Todos los commits de la fase commiteados en `produccion2027`
- [ ] `pnpm install` funciona desde cero
- [ ] `pnpm dev` levanta todo sin errores
- [ ] Backend responde a los endpoints correspondientes con datos reales
- [ ] Frontend muestra las páginas correspondientes consumiendo el backend
- [ ] Screenshots de evidencia en `/docs/screenshots/` (opcional)
- [ ] Sin push al remoto

---

## 11. Estructura del comando dev (post-migración)

```bash
# Instalar todo
pnpm install

# Levantar todo (BD + api + web)
pnpm dev

# Solo backend
pnpm --filter api dev

# Solo frontend
pnpm --filter web dev

# Migrar DB
pnpm --filter api prisma:migrate

# Tests backend
pnpm --filter api test

# Build producción
pnpm build
```

---

## 12. Próximo paso inmediato

**FASE 0 — Commit #1:** crear este archivo (ya en progreso).

**Después:** FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 12 → FASE 13.

No se hace nada hasta que confirmes que estás de acuerdo con este plan.