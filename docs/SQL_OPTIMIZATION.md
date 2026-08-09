# Guía de Optimización SQL — Kidsfun Platform

> Documento de referencia para devs: cómo analizar y optimizar queries que tocan la BD MariaDB.

---

## 1. Cómo analizar queries lentas

### 1.1 Activar slow query log

Ya está configurado en producción vía docker-compose:

```yaml
command:
  - --slow-query-log=1
  - --long-query-time=1   # log queries > 1 segundo
```

### 1.2 Ver las queries lentas recientes

Conectarse al contenedor:
```bash
docker exec -it proyecto_kidsfun-db-1 mysql -u root -p
```

```sql
-- Tabla mysql.slow_log tiene los registros
SELECT start_time, user_host, query_time, sql_text
FROM mysql.slow_log
ORDER BY start_time DESC
LIMIT 20;
```

O por endpoint (admin only):
```bash
curl http://localhost:3001/api/dashboard/db-stats \
  -H "Authorization: Bearer <firebase-token>"
```

### 1.3 Analizar una query específica con EXPLAIN

```sql
EXPLAIN SELECT * FROM t_app_product_product
WHERE category = 'option1' AND publicated = true
ORDER BY created DESC
LIMIT 20;
```

**Qué mirar:**

| Columna | Valor bueno | Valor malo |
|---|---|---|
| `type` | `const`, `eq_ref`, `ref`, `range` | `ALL` (escaneo total) |
| `key` | nombre de índice usado | `NULL` (sin índice) |
| `rows` | bajo (cientos) | alto (millones) |
| `Extra` | `Using index` (covering) | `Using filesort`, `Using temporary` |

---

## 2. Índices disponibles

### 2.1 Tablas Prisma con índices activos

Después de Fase A, las tablas tienen estos índices optimizados:

**`t_app_product_product`:**
- `idx_product_cat_pub_created` (category, publicated, created DESC) ← clave para catálogo
- `idx_product_pub_created` (publicated, created DESC) ← para listar publicados recientes
- `idx_product_category`, `idx_product_publicated`, `idx_product_user_id`, `idx_product_title`

**`waiver_v2_waiverqr`:**
- `idx_waiver_status_created` (status, created_at DESC) ← clave para admin
- `idx_waiver_user` (user_id) ← listado por usuario
- `idx_waiver_expires` (expires_at) ← cron de expiración
- `idx_waiver_created` (created_at DESC) ← métricas

**`t_app_product_comment`:**
- `idx_comment_product_appr_created` (product_id, is_approved, created_at DESC) ← clave para vista pública
- `idx_comment_created` (created_at DESC) ← admin list
- `idx_comment_is_approved` (is_approved) ← moderación

**`t_app_chat_message`:**
- `idx_msg_room_time` (chat_room_id, timestamp DESC) ← clave para chat
- `idx_msg_sender_time` (sender_id, timestamp DESC)
- `idx_msg_unread_room` (is_read, chat_room_id) ← notificaciones de no leídos

**Otros:** ver `apps/api/prisma/schema.prisma` secciones `@@index`.

### 2.2 Cómo verificar uso de índice

```sql
EXPLAIN SELECT * FROM t_app_product_product
WHERE category = 'option1' AND publicated = true
ORDER BY created DESC LIMIT 20;
```

Si `key` muestra `idx_product_cat_pub_created`, está usando el índice compuesto.

---

## 3. Patrones a evitar

### ❌ SELECT *

```typescript
// ❌ MAL: trae todas las columnas
const products = await this.prisma.product.findMany({ where });

// ✅ BIEN: solo lo necesario
const products = await this.prisma.product.findMany({
  where,
  select: { id: true, title: true, price: true, img: true },
});
```

### ❌ LIKE con wildcard inicial

```typescript
// ❌ MAL: full table scan
where: { title: { contains: 'bounce' } }

// ✅ BIEN: usa FULLTEXT (próxima fase D)
where: { title: { search: 'bounce' } }
```

### ❌ Bucket en JS

```typescript
// ❌ MAL: traer todas las filas + agrupar en JS
const waivers = await this.prisma.waiverQRV2.findMany({ select: { createdAt: true } });
const buckets = {}; // agrupar en JS

// ✅ BIEN: agregación SQL
const daily = await prisma.$queryRaw`
  SELECT DATE(created_at) as day, COUNT(*) as count
  FROM waiver_v2_waiverqr
  WHERE created_at BETWEEN ${from} AND ${to}
  GROUP BY DATE(created_at)
`;
```

### ❌ include sin necesidad

```typescript
// ❌ MAL: siempre trae el user
const products = await this.prisma.product.findMany({
  include: { user: true }
});

// ✅ BIEN: solo columnas necesarias
const products = await this.prisma.product.findMany({
  select: {
    id: true, title: true,
    user: { select: { id: true, username: true } }
  }
});
```

---

## 4. CHECK constraints activos

Después de Fase E1:

| Tabla | Constraint | Protege contra |
|---|---|---|
| `t_app_product_product` | `chk_product_price_nonneg` | precios negativos |
| `t_app_event` | `chk_event_ticket_price_nonneg` | ticket price negativo |
| `waiver_v2_waiverqr` | `chk_waiver_expires_after_created` | expires_at < created_at |
| `waiver_v2_waiverdata` | `chk_waiverdata_age_range` | edades fuera de 0-120 |
| `t_app_rental_contract` | `chk_contract_amounts_nonneg` | precios/depósitos negativos |

Si un INSERT/UPDATE viola cualquiera, MariaDB lanza error SQLSTATE `23000`.

---

## 5. Monitoreo

### Endpoint admin

```
GET /api/dashboard/db-stats
Authorization: Bearer <firebase-admin-token>
```

Devuelve:
- Versión de MariaDB y uptime
- Tamaño total de la BD
- Conteos exactos por tabla Prisma
- Lista de índices activos

### Cron job de mantenimiento

```
# Expira waivers vencidos (cambia ACTIVE → INACTIVE)
30 0 * * * /opt/kidsfun/scripts/cron_expire_waivers.sh
```

---

## 6. Cómo agregar un nuevo índice

1. **Análisis:** correr `EXPLAIN` antes de la query.
2. **Diseño:** decidir columnas y orden. Regla: columnas más selectivas primero.
3. **Schema:** agregar `@@index([col1, col2])` en `apps/api/prisma/schema.prisma`.
4. **Migración:** ejecutar:
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name add_index_xxx
   ```
5. **Validar:** correr `EXPLAIN` después y confirmar que usa el nuevo índice.
6. **Probar:** validar datos con `scripts/validate_pre.sh` y `validate_post.sh`.

---

## 7. Procedimiento ante queries lentas

1. Identificar la query (slow log o `db-stats`).
2. Revisar si hay índice apropiado (sección 2).
3. Si no hay índice apropiado, agregarlo (sección 6).
4. Si ya hay índice, revisar `EXPLAIN`:
   - `Using filesort` → falta índice compuesto que cubra `ORDER BY`.
   - `Using temporary` → la query es muy compleja, considerar desnormalizar.
   - `rows` muy alto → la query no usa índice eficiente.
5. Si todo falla, considerar:
   - Vista materializada (tabla pre-calculada).
   - Cache en Redis.
   - Desnormalización controlada.

---

## 8. Herramientas

- **mysql client:** `docker exec -it proyecto_kidsfun-db-1 mysql -u mrgomez -pKarin2100 smap_kf`
- **EXPLAIN:** anteponer `EXPLAIN` a cualquier SELECT.
- **SHOW PROCESSLIST:** ver queries en ejecución (`docker exec ... mysql -e "SHOW PROCESSLIST"`).
- **phpMyAdmin** (opcional): agregar a docker-compose si se requiere GUI.

---

**Última actualización:** Fase E completada.