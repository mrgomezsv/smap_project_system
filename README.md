# Kidsfun Platform

Plataforma de **gestión de fiestas infantiles** de Kidsfun y Fiestas Infantiles.

- 🌐 **Sitio público** (catálogo, eventos, checkout, waivers)
- 🔐 **Panel admin** (productos, eventos, waivers, chats, push, métricas, etc.)
- 📱 **App móvil** Flutter (legado) que consume el mismo backend

---

## 🚀 Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | NestJS 10 + TypeScript + Prisma |
| Base de datos | MariaDB 10.6 (existente, preservada) |
| Auth | Firebase Auth (Google + email) |
| Push | Firebase Cloud Messaging |
| Email | nodemailer / SMTP Gmail |
| PDF | pdf-lib + qrcode |
| Monorepo | pnpm workspaces |

---

## 📁 Estructura

```
smap_project_system/
├── apps/
│   ├── api/                # NestJS backend (puerto 3001)
│   └── web/                # Next.js frontend (puerto 3000)
├── packages/
│   └── shared/             # Tipos compartidos (futuro)
├── legacy/
│   └── django/             # Código Django preservado como referencia
├── backups/                # Dumps de BD (gitignored)
├── media/                  # Archivos subidos (gitignored)
├── product_images/         # (gitignored)
├── event_images/           # (gitignored)
├── logs/                   # (gitignored)
├── docker-compose.yml      # DB + API + Web
├── Dockerfile.api
├── Dockerfile.web
├── pnpm-workspace.yaml
└── README.md               # ← este archivo
```

---

## 🛠️ Setup local

### Requisitos

- Node.js 20+
- pnpm 10+
- MariaDB 10.6 (o Docker)
- Credenciales Firebase (opcional para auth en dev)

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local   # si existe
```

Edita `apps/api/.env` con:

```env
DATABASE_URL="mysql://user:pass@localhost:3306/kidsfun"
PORT=3001
CORS_ORIGINS=http://localhost:3000
# Firebase (opcional en dev)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
# SMTP (opcional en dev)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

### 3. Base de datos

```bash
# Si usas docker
docker compose up -d db

# Aplicar schema
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate
```

### 4. Levantar en dev

Desde la raíz:

```bash
pnpm dev          # api (3001) + web (3000) en paralelo
```

O individualmente:

```bash
pnpm --filter api dev
pnpm --filter web dev
```

Abre:
- Web: http://localhost:3000
- Admin: http://localhost:3000/admin/dashboard
- API: http://localhost:3001/api

---

## 🐳 Docker

```bash
docker compose up --build
```

Servicios:
- `db` — MariaDB 10.6
- `api` — NestJS en puerto 3001
- `web` — Next.js en puerto 3000

---

## 📚 Documentación por app

- [Backend (apps/api)](./apps/api/README.md)
- [Frontend (apps/web)](./apps/web/README.md)
- [Plan de refactorización](./PLAN_REFACTORIZACION.md)
- [Convenciones de commits](./COMMIT_STANDARDS.md)

---

## 🏛️ Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                         USUARIOS                              │
│   🌐 Web (Next.js)          📱 App móvil (Flutter)            │
└─────────────────┬────────────────────────┬────────────────────┘
                  │ HTTPS                  │ HTTPS + Firebase
                  ▼                        ▼
┌──────────────────────────────────────────────────────────────┐
│                  Next.js (apps/web) :3000                     │
│  • App Router + RSC       • Tailwind + shadcn/ui              │
│  • Firebase Auth Client   • Public + /admin/* layouts         │
└─────────────────────────────┬────────────────────────────────┘
                              │ /api/* (rewrite en dev)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  NestJS (apps/api) :3001                      │
│  • Prisma ORM         • class-validator                       │
│  • Firebase Admin     • @nestjs/notifications                 │
│  • pdf-lib + qrcode   • multer (uploads)                      │
└─────────────────────────────┬────────────────────────────────┘
                              │ Prisma
                              ▼
┌──────────────────────────────────────────────────────────────┐
│             MariaDB 10.6 (t_app_product_*, etc.)              │
│  • Schema preservado del Django legacy                        │
│  • Migrado vía Prisma con @@map                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│               Firebase (externo, opcional en dev)            │
│  • Auth (Google + email)   • Cloud Messaging (push)           │
└──────────────────────────────────────────────────────────────┘
```

### Flujo waiver (ejemplo end-to-end)

1. Cliente en `/productos/X` → click **Reservar** → `/checkout`
2. Completa 3 pasos (datos → familiares → confirmar)
3. En confirmar: si no está logueado, redirige a `/cuenta`
4. Login con Google o email → vuelve al checkout
5. Submit → `POST /api/v2/waiver` con token Firebase
6. Backend: genera QR, crea PDF, envía email
7. Redirect a `/checkout/success?qr=XXX` → descarga PDF, guarda QR

---

## 📜 Licencia

Privado — Kidsfun y Fiestas Infantiles © 2026
