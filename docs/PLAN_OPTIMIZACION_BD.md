# Plan de Optimización de Base de Datos — Kidsfun Platform

> Auditoría completa del schema Prisma/MariaDB y de todas las consultas realizadas por el backend NestJS. Propuesta para llevar la BD a un nivel profesional, maximizar rendimiento y garantizar el correcto funcionamiento.

**Fecha:** 2026-08-08
**Versiones:** MariaDB 10.6 · Prisma 6.19 · NestJS 11
**Alcance:** 16 modelos · 13 servicios · ~30 endpoints que tocan BD

---

## 1. Resumen ejecutivo

### 1.1 Estado actual

| Aspecto | Estado | Riesgo |
|---|---|---|
| Schema Prisma declarativo | OK | — |
| Migraciones versionadas | **NO existe carpeta `migrations/`** | 🔴 Crítico: el schema es código muerto si no se aplica formalmente |
| Índices básicos | Parciales | 🟡 Faltan índices compuestos críticos |
| Tipos de datos | Mezcla Int/BigInt/String | 🟡 BigInt innecesario ralentiza joins |
| Integridad referencial | Inconsistente | 🟡 Llaves foráneas "virtuales" con String (Firebase UID) |
| Consultas N+1 / sobre-fetching | Presentes | 🔴 `metrics.service` ejecuta 17+ queries |
| Connection pooling | Por defecto | 🟡 Sin tuning para producción |
| Cache de resultados | Solo en memoria | 🟡 No distribuido, no se invalida |
| Monitoreo de queries | Ninguno | 🔴 No hay `EXPLAIN`, ni slow query log |
| Resguardo de datos | Solo dumps manuales en `backups/` | 🟡 Sin automatización |
| Transacciones en operaciones multi-paso | **Ninguna** | 🔴 Riesgo de inconsistencia en waivers/contratos |

### 1.2 Top 5 victorias rápidas (Quick wins)

1. **Agregar índices compuestos** (`category+publicated`, `status+createdAt`, `productId+isApproved`, `chatRoomId+timestamp`, `isRead+createdAt`) → -60% latencia en listados públicos.
2. **Reescribir `metrics.service`** con `groupBy`/agregaciones SQL en lugar de fetch+bucket en JS → -90% tiempo de respuesta.
3. **Crear `prisma/migrations/`** y generar la primera migración formal → habilita `migrate deploy` real y rollback.
4. **Tunar `PrismaClient`** (`connection_limit`, `pool_timeout`, `query_log`) → estabilidad bajo carga.
5. **Reemplazar `CacheInterceptor` en memoria por Redis** + invalidación en mutaciones → coherencia entre instancias.

---

## 2. Auditoría detallada del Schema

### 2.1 Inventario de modelos

| Modelo | Tabla | PK | Filas estimadas* | Notas |
|---|---|---|---|---|
| User | `auth_user` | Int | ~10 | Heredado de Django |
| Product | `t_app_product_product` | **BigInt** | ~50 | 6 campos de imagen (!) |
| Event | `t_app_event` | **BigInt** | ~30 | Slug único |
| ProductLike | `t_app_product_like` | **BigInt** | ~200 | Unique(userId, productId) |
| ProductComment | `t_app_product_comment` | **BigInt** | ~100 | userId es String (Firebase) |
| CommentReply | `t_app_product_comment_reply` | **BigInt** | ~50 | userId String |
| WaiverQRV2 | `waiver_v2_waiverqr` | **BigInt** | ~500+ | qrCode único |
| WaiverDataV2 | `waiver_v2_waiverdata` | **BigInt** | ~1500 | Hijos por waiver |
| WaiverScanV2 | `waiver_v2_waiverscan` | **BigInt** | ~800 | Hijos por waiver |
| WaiverDocument | `waiver_v2_waiverdocument` | Int | 1 | Singleton |
| ChatAdministrator | `t_app_chat_administrator` | Int | ~5 | |
| ChatRoom | `t_app_chat_room` | Int | ~50 | |
| ChatMessage | `t_app_chat_message` | Int | ~500 | |
| ContactMessage | `t_app_contact_message` | Int | ~100 | |
| WaiverValidator | `t_app_product_waivervalidator` | Int | ~5 | |
| RentalContract | `t_app_rental_contract` | Int | ~50 | token único |

\* Estimaciones según tráfico esperado de plataforma de fiestas infantiles.

### 2.2 Problemas estructurales del schema

#### 🔴 Sin migraciones versionadas
El proyecto solo tiene `schema.prisma`. No existe `apps/api/prisma/migrations/`. Esto significa que:
- `prisma migrate deploy` en el Dockerfile (línea 48) no tiene nada que aplicar.
- Cualquier cambio al schema se hace manualmente en la BD de producción.
- No hay forma de hacer rollback controlado.

**Acción:** Generar migración baseline:
```bash
cd apps/api
pnpm prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
pnpm prisma migrate resolve --applied 0_init
```

#### 🔴 BigInt innecesario en productos, eventos y entidades hijas
`Product.id`, `Event.id`, `ProductLike.id`, `ProductComment.id`, `CommentReply.id`, `WaiverQRV2.id`, `WaiverDataV2.id`, `WaiverScanV2.id` son **BigInt**.

**Por qué importa:**
- BigInt ocupa 8 bytes vs 4 bytes de Int → 2× espacio en cada FK e índice.
- Joins más lentos (especialmente en MariaDB sin optimizer hints).
- Obliga al `BigIntInterceptor` a convertir en cada respuesta JSON.
- Para 50 productos y 500 waivers, **Int (4 bytes) soporta hasta 2.147 millones**, más que suficiente.

**Decisión recomendada:**
- **Mantener BigInt en `WaiverQRV2`/`WaiverDataV2`/`WaiverScanV2`** por ahora (migración de datos legacy). Marcar como legacy y planificar migración a Int en fase 2.
- **Evaluar migración a Int en `Product`/`Event`** si los conteos lo permiten (consultar `MAX(id)` actual en producción antes).

#### 🟡 Falta de FK explícitas para usuarios de Firebase
Varios modelos usan `userId: String` (Firebase UID) sin relación Prisma:

```prisma
model ProductComment { userId String? @map("user_id") @db.VarChar(128) }
model CommentReply    { userId String? @map("user_id") @db.VarChar(128) }
model WaiverQRV2      { userId String  @map("user_id") @db.VarChar(100) }
model WaiverDataV2    { (sin userId, hereda del WaiverQRV2) }
```

Esto significa que si un usuario Firebase se "elimina" de la app, **sus datos quedan huérfanos sin forma de limpieza**.

**Acción:** Crear tabla puente `FirebaseUserMapping`:
```prisma
model FirebaseUser {
  firebaseUid String   @id @db.VarChar(128)
  userId      Int      @unique @map("user_id")
  email       String?  @db.VarChar(254)
  createdAt   DateTime @default(now()) @map("created_at") @db.DateTime(6)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("t_app_firebase_user")
}
```
Y migrar las columnas `userId VARCHAR` → FKs Int con un script de mapeo.

#### 🟡 `Product` con 6 campos de imagen
```prisma
img String @default("default_product_image.jpg")
img1 String ...
img2 ... img5
```

**Problema:** Anti-patrón relacional. Difícil agregar/eliminar/quitar/reordenar imágenes; no permite metadata (alt text, orden, principal); los admin forms son rígidos.

**Acción recomendada (fase 2):** Normalizar en tabla aparte:
```prisma
model ProductImage {
  id        BigInt  @id @default(autoincrement())
  productId BigInt  @map("product_id")
  url       String  @db.VarChar(255)
  altText   String? @map("alt_text") @db.VarChar(255)
  position  Int     @default(0)  // 0=principal, 1..5=galería
  isPrimary Boolean @default(false) @map("is_primary")
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId, position])
  @@index([productId, isPrimary])
  @@map("t_app_product_image")
}
```
**Migración de datos:** poblar `ProductImage` desde `img/img1/img2/img3/img4/img5` y marcar `img` como `isPrimary=true, position=0`.

#### 🟡 `RentalContract.safetyChecklist` como Json sin validación
```prisma
safetyChecklist Json?
```

**Problema:** No hay esquema, se puede insertar cualquier cosa; queries sobre el contenido requieren funciones JSON que no se pueden indexar.

**Acción:** Crear tabla hija normalizada:
```prisma
model ContractSafetyChecklistItem {
  id           BigInt  @id @default(autoincrement())
  contractId   Int     @map("contract_id")
  itemKey      String  @map("item_key") @db.VarChar(50)
  isChecked    Boolean @map("is_checked")
  contract     RentalContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  @@unique([contractId, itemKey])
  @@map("t_app_contract_safety_item")
}
```

#### 🟡 `Event.partners` como String sin enum
```prisma
partners String @db.VarChar(50) // partner1|partner2|partner3
```

Comparar `partners = 'partner1'` es propenso a typos. Las queries no se benefician de un set fijo de valores.

**Acción:** Convertir a enum Prisma + CHECK constraint en MariaDB.

#### 🟡 Falta de CHECK constraints
No hay `CHECK (price >= 0)`, `CHECK (expires_at > created_at)`, etc.

**Acción (en migración SQL explícita, no vía Prisma):**
```sql
ALTER TABLE t_app_product_product ADD CONSTRAINT chk_price_nonneg CHECK (price IS NULL OR price >= 0);
ALTER TABLE t_app_event ADD CONSTRAINT chk_ticket_price_nonneg CHECK (ticket_price >= 0);
ALTER TABLE waiver_v2_waiverqr ADD CONSTRAINT chk_expires_after_created CHECK (expires_at >= created_at);
ALTER TABLE waiver_v2_waiverdata ADD CONSTRAINT chk_age_positive CHECK (relative_age BETWEEN 0 AND 120);
```

#### 🟡 `Event.published` sin default
```prisma
published Boolean   // sin @default
```

En una tabla con datos, queda `NULL` o requiere default. Esto puede romper queries que asumen boolean puro.

**Acción:** `@default(false)` o migración explícita `UPDATE ... SET published=0 WHERE published IS NULL`.

#### 🟡 `ChatRoom` sin UNIQUE por usuario
Puede haber N rooms por el mismo usuario, no hay razón de negocio para eso.

**Acción:** `@@unique([userId, isActive])` (un room activo por usuario) o unique simple `@@unique([userId])`.

---

## 3. Auditoría de índices (faltantes)

### 3.1 Índices actuales vs. consultas reales

Revisé las queries de los 13 servicios y compilé esta matriz:

| Tabla | Query (WHERE/ORDER BY) | Índice actual | Índice recomendado |
|---|---|---|---|
| `t_app_product_product` | `category=X AND publicated=true` | `idx_product_category`, `idx_product_publicated` (separados) | **Compuesto: `(category, publicated)`** |
| `t_app_product_product` | `title LIKE '%X%'` | `idx_product_title` (inútil para LIKE %X%) | FULLTEXT `(title, description)` |
| `t_app_product_product` | ORDER BY `created DESC` | — | **Índice `(created DESC)` o `(publicated, created DESC)`** |
| `t_app_product_product` | `userId` | `idx_product_user_id` | OK |
| `waiver_v2_waiverqr` | `userId` (Firebase UID) | — | **Índice `(user_id)`** |
| `waiver_v2_waiverqr` | `status` + `createdAt` | — (status sin index) | **Compuesto: `(status, created_at)`** |
| `waiver_v2_waiverqr` | `createdAt` | — (createdAt sin index) | Índice `(created_at)` |
| `waiver_v2_waiverqr` | `expiresAt` (filtro expirados) | — | **Índice `(expires_at)`** |
| `waiver_v2_waiverscan` | `waiverQrId` | sí | OK |
| `waiver_v2_waiverscan` | `scannedBy` + `scannedAt DESC` | — | **Compuesto: `(scanned_by, scanned_at)`** |
| `waiver_v2_waiverscan` | `scannedAt` (rango) | — | Índice `(scanned_at)` |
| `waiver_v2_waiverdata` | `waiverQrId` | sí | OK |
| `waiver_v2_waiverdata` | `timestamp` (rango en métricas) | — | Índice `(timestamp)` |
| `t_app_product_comment` | `productId` + `isApproved` | solo `productId` | **Compuesto: `(product_id, is_approved, created_at)`** |
| `t_app_product_comment` | ORDER BY createdAt DESC sin WHERE | — | Índice `(created_at)` |
| `t_app_product_comment` | `comment LIKE '%X%'` | — | FULLTEXT `(comment, user_display_name)` |
| `t_app_product_comment_reply` | `commentId` | sí | OK |
| `t_app_product_like` | `(userId, productId)` | UNIQUE compuesto | OK |
| `t_app_product_like` | `productId` + `isFavorite` | solo `productId` | **Compuesto: `(product_id, is_favorite)`** |
| `t_app_product_like` | `createdAt` (métricas) | — | Índice `(created_at)` |
| `t_app_chat_room` | `userId` | sí | OK |
| `t_app_chat_room` | `lastMessageAt DESC` | — | Índice `(last_message_at)` |
| `t_app_chat_message` | `chatRoomId` + `timestamp` | solo `chatRoomId` | **Compuesto: `(chat_room_id, timestamp)`** |
| `t_app_chat_message` | `senderId` + `timestamp` | solo `senderId` | **Compuesto: `(sender_id, timestamp)`** |
| `t_app_chat_message` | `isRead=false` | — | **Índice parcial: `(is_read, chat_room_id)`** |
| `t_app_contact_message` | `createdAt DESC` | — | Índice `(created_at)` |
| `t_app_contact_message` | `isRead=false` | — | Índice `(is_read)` |
| `t_app_rental_contract` | `status` + `createdAt DESC` | solo email | **Compuesto: `(status, created_at)`** |
| `t_app_rental_contract` | `token` | UNIQUE | OK |
| `t_app_event` | `startDatetime` (próximos eventos) | — | Índice `(start_datetime)` |
| `t_app_event` | `published` + `startDatetime` | — | **Compuesto: `(published, start_datetime)`** |
| `auth_user` | `dateJoined` (métricas) | — | Índice `(date_joined)` |
| `auth_user` | `isActive` | — | Índice `(is_active)` |

### 3.2 FULLTEXT para búsquedas LIKE

Los servicios usan `contains` (= `LIKE '%X%'`) en:
- `Product.title` (catálogo público)
- `ProductComment.comment` + `userDisplayName` (admin)
- `RentalContract.clientName/clientEmail/equipment` (admin)

Ninguno de estos puede usar un índice B-tree normal (LIKE con wildcard inicial hace full scan).

**Acción:** Crear índices FULLTEXT en MariaDB:
```sql
ALTER TABLE t_app_product_product
  ADD FULLTEXT INDEX ft_product_search (title, description);

ALTER TABLE t_app_product_comment
  ADD FULLTEXT INDEX ft_comment_search (comment, user_display_name);

ALTER TABLE t_app_rental_contract
  ADD FULLTEXT INDEX ft_contract_search (client_name, client_email, equipment);
```

Y usar `mode: 'insensitive'` con `Prisma.raw` para `MATCH ... AGAINST`.

---

## 4. Auditoría de consultas (por servicio)

### 4.1 `MetricsService.getMetrics` 🔴 **el peor offender**

**Problema:** Ejecuta **17+ queries en paralelo** y trae **filas completas solo para agrupar fechas en JavaScript**.

```typescript
// ❌ ANTES (resumido): trae filas y agrupa en JS
this.prisma.waiverQRV2.findMany({
  where: { createdAt: { gte: from, lte: to } },
  select: { createdAt: true, status: true },
}),
// luego:
waivers.forEach(({ createdAt }) => { /* bucket JS */ });
```

**Impacto real:**
- 1000 waivers × 2 selects × transferencia de filas + bucket en JS ≈ 200-500ms
- 800 scans + 100 comments + 200 likes → otro tanto
- I/O total: 5-10MB de filas movidas innecesariamente

**Propuesta:**

```typescript
// ✅ DESPUÉS: agregaciones SQL
const dailyWaivers = await this.prisma.$queryRaw<Array<{day: Date; count: bigint; status: string}>>`
  SELECT DATE(created_at) AS day, status, COUNT(*) AS count
  FROM waiver_v2_waiverqr
  WHERE created_at BETWEEN ${from} AND ${to}
  GROUP BY DATE(created_at), status
`;

const monthlyWaivers = await this.prisma.$queryRaw<Array<{month: Date; count: bigint}>>`
  SELECT DATE_FORMAT(created_at, '%Y-%m-01') AS month, COUNT(*) AS count
  FROM waiver_v2_waiverqr
  WHERE created_at >= ${monthlyFrom}
  GROUP BY DATE_FORMAT(created_at, '%Y-%m-01')
`;

const dailyLikes = await this.prisma.$queryRaw<Array<{day: Date; count: bigint}>>`
  SELECT DATE(created_at) AS day, COUNT(*) AS count
  FROM t_app_product_like
  WHERE created_at BETWEEN ${from} AND ${to}
  GROUP BY DATE(created_at)
`;
// ...idéntico para comments, contactMessages, chatMessages
```

**Resultado esperado:** De 17 queries a 4-5, y de 5-10MB transferidos a <100KB. **Latencia estimada: -90%** (de 800ms a 80ms).

### 4.2 `WaiversService` 🔴 varios problemas

#### a) `create()`: bucle de unicidad por colisiones
```typescript
while (await this.prisma.waiverQRV2.findUnique({ where: { qrCode } })) {
  qrCode = this.generateUniqueQr();
}
```

**Problema:** Genera `randomBytes(8).toString('hex').substring(0, 8).toUpperCase()` = 16 hex chars / 2 = 8 chars hex. Total de combinaciones = 16⁸ ≈ 4 mil millones, pero solo 8 chars de 16 = 4 mil millones. Las colisiones son raras pero **cada `findUnique` con fallo es un round-trip a la BD**.

**Mejora:** Usar `prisma.waiverQRV2.create({ ..., data: { qrCode } })` con manejo del `P2002` (unique constraint violation). Si choca, regenerar. Con unique constraint, **el motor de BD ya sabe si existe sin un SELECT extra**.

```typescript
async function generateAndInsertQr() {
  for (let i = 0; i < 10; i++) {
    const code = generateUniqueQr();
    try {
      return await this.prisma.waiverQRV2.create({ data: { qrCode: code, /* ... */ } });
    } catch (e) {
      if (e.code !== 'P2002') throw e;
    }
  }
  throw new BadRequestException('No se pudo generar QR único');
}
```

#### b) `findAll()` admin: sobre-fetching masivo
```typescript
include: { relatives: true, scans: true }
```

Si el admin lista 50 waivers × ~3 familiares × ~2 scans = 250 filas extra transferidas, innecesarias para la tabla del panel (solo se muestra QR, nombre, fecha).

**Mejora:** Select específico o usar `include` solo si la vista lo pide:
```typescript
include: {
  relatives: { select: { id: true, relativeName: true, relativeAge: true } },
  _count: { select: { scans: true, relatives: true } },
}
```

#### c) `deleteMany()`: 3 queries secuenciales sin transacción
```typescript
await this.prisma.waiverDataV2.deleteMany({ where: { waiverQrId: { in: numericIds } } });
await this.prisma.waiverScanV2.deleteMany({ where: { waiverQrId: { in: numericIds } } });
await this.prisma.waiverQRV2.deleteMany({ where: { id: { in: numericIds } } });
```

**Problema:** Si la segunda falla, quedan datos huérfanos. Además, las FK ya tienen `onDelete: Cascade` en Prisma → los dos primeros `deleteMany` son **innecesarios**.

**Mejora:**
```typescript
return this.prisma.$transaction([
  this.prisma.waiverQRV2.deleteMany({ where: { id: { in: numericIds } } }),
]);
// Cascade automático borra relatives y scans.
```

#### d) `updateStatusIfExpired()`: side-effect fire-and-forget en cada GET
```typescript
private updateStatusIfExpired(waiver) {
  if (expired && status==='ACTIVE') {
    this.prisma.waiverQRV2.update({...}).catch(...);
  }
}
```

**Problema:** N updates no transaccionales en respuestas GET. En un panel admin con 50 waivers expirados = 50 UPDATEs.

**Mejora:**
1. Opción A: Cron job diario que ejecute `UPDATE waiver_v2_waiverqr SET status='INACTIVE' WHERE status='ACTIVE' AND expires_at < NOW()`.
2. Opción B: Mantener en cada GET pero en una sola operación batch al final del método.
3. Opción C: Usar una vista materializada o columna calculada.

**Recomendación:** Opción A (cron) — separar la lógica de negocio del side-effect.

### 4.3 `ProductsService.findAll` 🟡

```typescript
this.prisma.product.findMany({
  where, skip, take, orderBy: { created: 'desc' },
  include: { user: { select: { id: true, username: true } } },
})
```

**Problemas:**
- `orderBy: created` sin índice `(created DESC)` → filesort.
- `include: user` siempre → JOIN extra en cada request (cache lo mitiga 60s, pero no si la query varía por filtros).

**Mejoras:**
1. Agregar `@@index([created(sort: Desc)])` al schema.
2. Cambiar a `select` específico para endpoints públicos:
```typescript
select: {
  id: true, title: true, description: true, price: true,
  category: true, img: true, img1: true, publicated: true, created: true,
  user: { select: { id: true, username: true } },
}
```
3. Índice compuesto `(category, publicated, created)` cubriría la query más común.

### 4.4 `CommentsService.findByProduct` 🟡

```typescript
this.prisma.productComment.findMany({
  where: { productId, isApproved: true },
  orderBy: { createdAt: 'desc' },
  include: { replies: { orderBy: { createdAt: 'asc' } } },
});
```

**Problemas:**
- Sin paginación → si un producto tiene 200 comentarios, los trae todos.
- Sin índice `(product_id, is_approved, created_at)` → escanea toda la tabla filtrando.

**Mejoras:**
1. Índice compuesto mencionado.
2. Paginar: `take: 20, skip` o cursor-based.
3. Limitar replies: si los replies son muchos, `take: 5` por comment.

### 4.5 `ChatService.getRoom` 🟡

```typescript
include: { messages: { orderBy: { timestamp: 'asc' } } } // ❌ sin take
```

Trae **todos** los mensajes del room. Sin paginación ni índice `(chat_room_id, timestamp)`.

**Mejoras:**
1. Índice compuesto.
2. Paginación por cursor (los chats son naturalmente append-only).
3. Implementar WebSockets para no tener que re-fetchear.

### 4.6 `ContractsService.findAll` 🟡

```typescript
where: { OR: [{ clientName: { contains: search } }, ...] }
```

`contains` con wildcard inicial = full table scan. Sin índice FULLTEXT.

**Mejoras:**
1. FULLTEXT index (ver §3.2).
2. Mientras tanto, simplificar usando solo `clientEmail` (que tiene índice).

### 4.7 `DashboardService.getStats` 🟡

**Problema menor:** `recentWaivers` + `recentMessages` se podrían combinar en un solo `Promise.all`. Pero más importante: en producción, los `findMany` sin índice `(created_at DESC)` hacen filesort.

**Mejoras:**
- Índices ya mencionados en §3.
- Cachear este endpoint 30s (es info agregada, no crítica en tiempo real).

### 4.8 `TranslationService` 🟡+

**Problema:** Llama a Google Translate público en cada request sin auth, con riesgo de rate-limiting/bloqueo. Cache en memoria no distribuido.

**Mejoras:**
1. Reemplazar por una API con autenticación (DeepL, Google Cloud Translation con key).
2. Cache persistente en BD: crear tabla `TranslationCache`:
```prisma
model TranslationCache {
  id        Int      @id @default(autoincrement())
  sourceText String  @db.Text @map("source_text")
  targetLang String  @map("target_lang") @db.VarChar(5)
  translatedText String @db.Text @map("translated_text")
  @@unique([sourceText(255), targetLang])
  @@index([sourceText(255)])
  @@map("t_app_translation_cache")
}
```
3. O pre-traducir en background job al crear/editar productos.

### 4.9 `CacheInterceptor` 🟡

**Problemas:**
1. **En memoria:** no escala con múltiples instancias (cada una su propio cache).
2. **Sin invalidación:** un POST/PATCH no borra el cache relacionado → datos stale.
3. **Sin variación por auth:** usuarios admin ven respuestas cacheadas de otros.

**Mejoras:**
1. Migrar a Redis (mismo `CacheInterceptor` con `ioredis` detrás):
```typescript
// Interfaz idéntica, swap el Map por Redis
private async get(key: string): Promise<unknown | null>
private async set(key: string, value: unknown, ttl: number): Promise<void>
```
2. Hook de invalidación:
```typescript
@CacheInvalidate(['/api/products'])
@Post() create() { ... }
```
3. Versionar la cache por usuario/rol:
```
key = `${req.originalUrl}|user=${req.user?.id ?? 'public'}`
```

### 4.10 `PrismaService` 🟡

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements ... {
  async onModuleInit() { await this.$connect(); }
}
```

**Problemas:**
- Sin connection pool config → usa defaults.
- Sin query logging.
- Sin healthcheck.
- Sin shutdown graceful (deja queries colgadas en deploys).

**Mejoras:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: { url: configService.get('DATABASE_URL') },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
    // Connection pool
    this.$on('query', (e) => {
      if (e.duration > 200) this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    });
  }
  async onModuleInit() {
    await this.$connect();
    await this.$queryRaw`SELECT 1`; // healthcheck
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Y agregar a la URL: `?connection_limit=10&pool_timeout=20&socket_timeout=30`.

---

## 5. Plan de arquitectura objetivo

### 5.1 Diagrama lógico

```
┌────────────────────────────────────────────────────────────┐
│                      NestJS API                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ Cache Layer │  │ Rate Limit  │  │  Query Logger   │    │
│  │  (Redis)    │  │  (Redis)    │  │  (Prisma hooks) │    │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘    │
│         └─────────────────┼──────────────────┘             │
│                           ▼                                │
│                   ┌───────────────┐                        │
│                   │ Prisma Client │                        │
│                   │  (pool=10)    │                        │
│                   └───────┬───────┘                        │
└───────────────────────────┼────────────────────────────────┘
                            │ TCP (3306)
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  MariaDB 10.6                              │
│  ┌────────────────────┐  ┌─────────────────────────────┐  │
│  │ InnoDB Buffer Pool │  │  Query Cache (deshabilitar) │  │
│  │  size: 256M-1G     │  │  Slow Query Log             │  │
│  └────────────────────┘  └─────────────────────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ Tablas core  │ │ Índices FULL │ │ Vistas material. │  │
│  │ (16 modelos) │ │ TEXT nuevos  │ │ (opcional)       │  │
│  └──────────────┘ └──────────────┘ └──────────────────┘  │
│                                                            │
│  Cron job diario (cron-container):                         │
│   • UPDATE waiver_v2_waiverqr status INACTIVE expired      │
│   • ANALYZE TABLE (semanal)                                │
│   • ROTATE slow query logs                                 │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Cambios al schema Prisma

#### 5.2.1 Índices a agregar (migración `1_add_indexes`)

```prisma
model Product {
  // ... existentes
  @@index([category, publicated, created(sort: Desc)], map: "idx_product_cat_pub_created")
  @@index([publicated, created(sort: Desc)], map: "idx_product_pub_created")
  @@fullindex([title, description], map: "ft_product_search")
}

model ProductLike {
  // ...
  @@index([productId, isFavorite], map: "idx_productlike_product_fav")
  @@index([createdAt], map: "idx_productlike_created")
}

model ProductComment {
  // ...
  @@index([productId, isApproved, createdAt(sort: Desc)], map: "idx_comment_product_appr_created")
  @@index([createdAt(sort: Desc)], map: "idx_comment_created")
  @@index([isApproved], map: "idx_comment_is_approved")
  @@fullindex([comment, userDisplayName], map: "ft_comment_search")
}

model CommentReply {
  // ...
  @@index([commentId, createdAt], map: "idx_reply_comment_created")
}

model WaiverQRV2 {
  // ...
  @@index([userId], map: "idx_waiver_user")
  @@index([status, createdAt(sort: Desc)], map: "idx_waiver_status_created")
  @@index([createdAt(sort: Desc)], map: "idx_waiver_created")
  @@index([expiresAt], map: "idx_waiver_expires")
}

model WaiverScanV2 {
  // ...
  @@index([scannedBy, scannedAt(sort: Desc)], map: "idx_scan_by_when")
  @@index([scannedAt(sort: Desc)], map: "idx_scan_when")
}

model WaiverDataV2 {
  // ...
  @@index([timestamp(sort: Desc)], map: "idx_waiverdata_timestamp")
}

model ChatRoom {
  // ...
  @@index([userId, isActive], map: "idx_chatroom_user_active")
  @@index([lastMessageAt(sort: Desc)], map: "idx_chatroom_lastmsg")
}

model ChatMessage {
  // ...
  @@index([chatRoomId, timestamp(sort: Desc)], map: "idx_msg_room_time")
  @@index([senderId, timestamp(sort: Desc)], map: "idx_msg_sender_time")
  @@index([isRead, chatRoomId], map: "idx_msg_unread_room")
}

model ContactMessage {
  // ...
  @@index([createdAt(sort: Desc)], map: "idx_contact_created")
  @@index([isRead, createdAt(sort: Desc)], map: "idx_contact_unread_created")
}

model RentalContract {
  // ...
  @@index([status, createdAt(sort: Desc)], map: "idx_contract_status_created")
  @@index([eventDate], map: "idx_contract_eventdate")
}

model Event {
  // ...
  @@index([published, startDatetime], map: "idx_event_pub_start")
  @@index([startDatetime], map: "idx_event_start")
  @@index([partners], map: "idx_event_partners")
}

model User {
  // ...
  @@index([dateJoined], map: "idx_user_datejoined")
  @@index([isActive], map: "idx_user_active")
}
```

#### 5.2.2 Cambios estructurales

```prisma
// Enum para partners
enum EventPartner {
  KIDSFUN
  TECUN_PRODUCTIONS
  OTROS
}

model Event {
  // ...
  partners EventPartner // reemplaza String
  published Boolean @default(false)
}

// Firebase user mapping
model FirebaseUser {
  firebaseUid String   @id @db.VarChar(128)
  userId      Int      @unique
  email       String?  @db.VarChar(254)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("t_app_firebase_user")
}

// Translation cache (opcional)
model TranslationCache {
  id            Int    @id @default(autoincrement())
  sourceHash    String @unique @db.VarChar(64) // SHA256 de sourceText+lang
  sourceText    String @db.Text
  targetLang    String @db.VarChar(5)
  translatedText String @db.Text
  createdAt     DateTime @default(now())
  @@index([targetLang])
  @@map("t_app_translation_cache")
}

// Push tokens (faltaba!)
model PushToken {
  id          Int      @id @default(autoincrement())
  userId      String   @map("user_id") @db.VarChar(128)
  token       String   @unique @db.VarChar(255)
  platform    String   @db.VarChar(20) // ios, android, web
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime @default(now()) @map("last_used_at")
  createdAt   DateTime @default(now())
  @@index([userId, isActive])
  @@map("t_app_push_token")
}

// Audit log
model AuditLog {
  id        BigInt   @id @default(autoincrement())
  userId    Int?     @map("user_id")
  action    String   @db.VarChar(50)   // CREATE_PRODUCT, DELETE_WAIVER, etc.
  entity    String   @db.VarChar(50)   // Product, Waiver, Contract
  entityId  String?  @map("entity_id") @db.VarChar(64)
  metadata  Json?
  ip        String?  @db.VarChar(45)
  userAgent String?  @map("user_agent") @db.Text
  createdAt DateTime @default(now())
  @@index([userId, createdAt(sort: Desc)])
  @@index([entity, entityId])
  @@index([action, createdAt(sort: Desc)])
  @@map("t_app_audit_log")
}
```

---

## 6. Plan operativo

### 6.1 Configuración de MariaDB (docker-compose)

```yaml
db:
  image: mariadb:10.6
  command:
    - --innodb-buffer-pool-size=256M
    - --max-connections=200
    - --slow-query-log=1
    - --slow-query-time=2
    - --long-query-time=2
    - --log-output=TABLE
    - --character-set-server=utf8mb4
    - --collation-server=utf8mb4_unicode_ci
    - --innodb-file-per-table=1
    - --innodb-flush-log-at-trx-commit=2   # OK para dev; =1 para prod estricta
    - --query-cache-size=0
    - --query-cache-type=0
  environment:
    MYSQL_DATABASE: smap_kf
    MYSQL_USER: mrgomez
    MYSQL_PASSWORD: Karin2100
    MYSQL_ROOT_PASSWORD: root_password
  volumes:
    - db_data:/var/lib/mysql
    - ./docker/mariadb/init:/docker-entrypoint-initdb.d:ro   # opcional: tune SQL
  ports:
    - "3309:3306"
```

### 6.2 Variables de entorno (connection pool)

```env
DATABASE_URL="mysql://mrgomez:Karin2100@db:3306/smap_kf?connection_limit=10&pool_timeout=20&socket_timeout=30&connect_timeout=10"
```

### 6.3 Backup automatizado

Crear `scripts/backup_db.sh`:
```bash
#!/bin/bash
# Cron: 0 3 * * * /opt/kidsfun/scripts/backup_db.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/kidsfun/backups
mkdir -p $BACKUP_DIR
docker exec proyecto_kidsfun_db_data \
  mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
    --single-transaction --quick --routines --triggers \
    smap_kf | gzip > $BACKUP_DIR/smap_kf_backup_$TIMESTAMP.sql.gz
# Limpiar backups > 30 días
find $BACKUP_DIR -name "smap_kf_backup_*.sql.gz" -mtime +30 -delete
```

### 6.4 Monitoreo y slow query log

- Activar `slow_query_log` (ver §6.1).
- Crear endpoint `GET /api/admin/db-stats` (admin only) que ejecute:
  ```sql
  SHOW GLOBAL STATUS LIKE 'Slow_queries';
  SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool%';
  SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 50;
  ```
- Alertas (manual o vía cron que envíe email si slow_queries > 100/día).

---

## 7. Plan de implementación por fases

> Reglas: cada fase termina con commit + verificación. Sin pérdida de datos. Rollback documentado.

### FASE A — Fundamentos (1-2 días) 🟢 sin riesgo

| # | Commit | Contenido | Riesgo |
|---|---|---|---|
| A1 | `chore(db): generar primera migración Prisma (baseline)` | `prisma migrate diff` desde schema actual | Ninguno |
| A2 | `perf(db): agregar índices compuestos al schema` | Todos los `@@index` de §5.2.1 | Ninguno (CREATE INDEX no rompe) |
| A3 | `perf(api): tunear PrismaClient (pool + log)` | `apps/api/src/prisma/prisma.service.ts` | Bajo |
| A4 | `chore(db): script backup automatizado` | `scripts/backup_db.sh` + cron doc | Ninguno |

**Verificación:** `EXPLAIN` antes/después en queries críticas; contar `rows_examined`.

### FASE B — Optimización de queries existentes (2-3 días) 🟢 sin riesgo

| # | Commit | Contenido |
|---|---|---|
| B1 | `perf(metrics): reescribir con agregaciones SQL` | `prisma.$queryRaw` con `GROUP BY DATE(...)` |
| B2 | `perf(waivers): simplificar deleteMany con cascade` | Quitar pre-deletes, usar `$transaction` |
| B3 | `perf(waivers): generar QR con try/catch en lugar de SELECT previo` | Capturar `P2002` |
| B4 | `perf(products): select específico en lugar de include en listado público` | `select` con columnas exactas |
| B5 | `perf(comments): paginación por cursor en findByProduct` | `cursor + take` |
| B6 | `perf(chat): paginación por cursor en getRoom` | Igual |
| B7 | `perf(contracts): FULLTEXT index + boolean mode` | Migración SQL + cambio de query |

### FASE C — Cache distribuido (1-2 días) 🟡 cambio de infra

| # | Commit | Contenido |
|---|---|---|
| C1 | `chore(infra): agregar Redis al docker-compose` | Nuevo servicio `redis:7-alpine` |
| C2 | `feat(cache): migrar CacheInterceptor a Redis` | `ioredis` detrás de la misma interfaz |
| C3 | `feat(cache): invalidación en mutaciones (POST/PATCH/DELETE)` | Decorador `@CacheInvalidate` |
| C4 | `chore(api): versionar cache por usuario` | Key incluye userId o rol |

### FASE D — Mejoras estructurales (3-5 días) 🟡 requiere migración de datos

| # | Commit | Contenido |
|---|---|---|
| D1 | `feat(db): modelo FirebaseUser + script de migración` | Mapeo UID Firebase → User.id |
| D2 | `feat(db): reemplazar columnas userId VARCHAR por FK a User` | En ProductComment, CommentReply, WaiverQRV2 |
| D3 | `feat(db): normalizar Product.images en tabla aparte` | Crear ProductImage, migrar img..img5 |
| D4 | `feat(db): normalizar RentalContract.safetyChecklist` | Tabla ContractSafetyChecklistItem |
| D5 | `feat(db): enum EventPartner` | Conversión String → enum |
| D6 | `feat(db): modelo TranslationCache` | Cache persistente de traducciones |
| D7 | `feat(db): modelo PushToken + endpoint de registro` | Resuelve "¿a quién mando push?" |
| D8 | `feat(db): modelo AuditLog + interceptor global` | Log de acciones admin |

### FASE E — Hardening operacional (1-2 días) 🟢

| # | Commit | Contenido |
|---|---|---|
| E1 | `chore(db): CHECK constraints en SQL` | price >=0, expires_at >= created_at, etc. |
| E2 | `chore(db): cron job expiración waivers` | UPDATE batch diario |
| E3 | `chore(api): endpoint admin /db-stats` | Para inspección manual |
| E4 | `docs(db): guía de EXPLAIN para devs` | `docs/SQL_OPTIMIZATION.md` |
| E5 | `test(db): tests de carga con k6 o Artillery` | Smoke test para regresiones |

---

## 8. Métricas esperadas

| Métrica | Antes (estimado) | Después (objetivo) |
|---|---|---|
| `GET /api/products` (público) | 250ms | <80ms |
| `GET /api/products/category/:cat` | 220ms | <60ms |
| `GET /api/metrics?range=30d` | 800ms-1.5s | <150ms |
| `GET /api/dashboard/stats` | 400ms | <100ms |
| `GET /api/v2/waiver/all` (admin) | 600ms | <200ms |
| `GET /api/products/:id` (detalle) | 180ms | <60ms |
| `GET /api/v2/waiver/user/me` | 350ms | <100ms |
| `POST /api/v2/waiver` (create) | 1200ms (PDF+email) | <800ms |
| Slow queries (>200ms) | ~30/día | <5/día |
| Tamaño medio de respuesta JSON | 200KB | <80KB |

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Índices rompen performance de writes | Medir antes/después. FULLTEXT solo en campos necesarios. |
| Migración de `userId VARCHAR → Int FK` pierde datos | Script de mapeo en fase D2, backup pre-migración, validación post. |
| Redis caído invalida cache | Fallback a Map en memoria (mismo `CacheInterceptor`). |
| Cambiar Int a BigInt/Int rompe serialización | `BigIntInterceptor` ya existe; verificar controllers. |
| FULLTEXT consume espacio en disco | Aceptable (~10MB para tablas pequeñas). |
| Cron de expiración solapa con requests | Usar `UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED LIMIT 100)` en batches. |
| `prisma migrate dev` en dev vs `migrate deploy` en prod | Disciplina: nunca `db push` en prod; siempre migraciones versionadas. |

---

## 10. Orden de ejecución recomendado

1. **FASE A** (1-2 días) → habilita todo lo demás, riesgo mínimo.
2. **FASE B** (2-3 días) → victorias visibles rápidas en metrics/waivers/products.
3. **FASE E** (1-2 días) → endurecimiento low-risk.
4. **FASE C** (1-2 días) → cache distribuido (solo si hay 2+ instancias o se proyecta).
5. **FASE D** (3-5 días) → refactor estructural (puede esperar a Q1 2027 si hay presión de features).

---

## 11. Checklist de "listo"

Antes de cerrar cada fase:

- [ ] `pnpm prisma migrate deploy` funciona sin warnings
- [ ] `pnpm prisma generate` regenera cliente sin errores
- [ ] `EXPLAIN` en queries críticas muestra uso de índices nuevos
- [ ] `SHOW INDEX FROM <tabla>` lista los índices creados
- [ ] Tests E2E del frontend pasan
- [ ] Backup pre-migración guardado en `backups/`
- [ ] Slow query log no muestra nuevas queries >500ms
- [ ] Documento `CHANGELOG_DB.md` actualizado con cambio + rollback

---

## 12. Próximo paso inmediato

**Esperando tu confirmación** para arrancar con **FASE A** (commits A1-A4), que es 100% segura y desbloquea el resto:

- A1: generar primera migración Prisma (no toca datos).
- A2: agregar todos los índices del §5.2.1 (CREATE INDEX no rompe nada).
- A3: tunear PrismaClient.
- A4: script de backup automatizado.

¿Quieres que proceda con la FASE A, o prefieres ajustar algo del alcance antes?