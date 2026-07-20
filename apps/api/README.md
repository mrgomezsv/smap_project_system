# apps/api — NestJS Backend

API REST del monolito migrado de Django a NestJS + Prisma.

## Stack

- **NestJS 10** + Express
- **Prisma 5** ORM con MariaDB
- **class-validator** + **class-transformer** para DTOs
- **firebase-admin** para auth + push
- **pdf-lib** + **qrcode** para waivers
- **nodemailer** para emails
- **multer** para uploads
- **Winston** para logging estructurado
- **Jest** + **supertest** para tests

## Estructura

```
src/
├── auth/             # Firebase auth guard + decorators
├── products/         # Catálogo público
├── events/           # Eventos públicos
├── likes/            # Likes
├── comments/         # Comentarios
├── waivers/          # Sistema QR + PDF + email
│   ├── services/
│   │   ├── pdf.service.ts
│   │   ├── qr.service.ts
│   │   └── email.service.ts
│   └── ...
├── chat/             # Chat admin↔cliente
├── contact/          # Web messages (formulario contacto)
├── push/             # Push notifications
├── upload/           # File uploads
├── prisma/           # PrismaService global
├── common/           # Filters, interceptors, pipes
│   ├── filters/
│   └── interceptors/
│       └── bigint.interceptor.ts   # BigInt → Number
├── app.module.ts
└── main.ts
```

## Variables de entorno

```env
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# Database
DATABASE_URL="mysql://user:pass@localhost:3306/kidsfun"

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Kidsfun <noreply@kidsfunyfiestasinfantiles.com>"
```

## Scripts

```bash
pnpm dev             # nest start --watch
pnpm build           # nest build
pnpm start           # node dist/main
pnpm lint            # eslint
pnpm test            # jest
pnpm prisma studio   # GUI de la BD
pnpm prisma migrate dev
```

## Endpoints

| Método | Path | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/products` | ❌ | Lista de productos (público) |
| `GET` | `/api/products/:id` | ❌ | Detalle (público) |
| `POST` | `/api/products` | ✅ | Crear (admin) |
| `GET` | `/api/events` | ❌ | Lista de eventos (público) |
| `GET` | `/api/events/:id` | ❌ | Detalle (público) |
| `POST` | `/api/v2/waiver` | ✅ | Crear waiver + PDF + email |
| `GET` | `/api/v2/waiver/:qr` | ❌ | Obtener por QR |
| `POST` | `/api/v2/waiver/validate` | ✅ | Validar QR (admin puerta) |
| `POST` | `/api/web-messages` | ❌ | Crear mensaje de contacto |
| `POST` | `/api/push/send` | ✅ | Enviar push |
| `GET` | `/api/auth/me` | ✅ | Usuario actual |

Ver `src/` para la lista completa.

## Tests

```bash
pnpm test                 # unit
pnpm test:e2e             # e2e con supertest
```

## Logging

Usa Winston con formato JSON. En desarrollo se imprime en consola; en producción se puede redirigir a un servicio centralizado.
