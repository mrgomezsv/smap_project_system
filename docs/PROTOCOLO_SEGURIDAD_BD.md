# Protocolo de Seguridad para Cambios de Base de Datos

> **REGLA DE ORO:** Si cualquier validación de este protocolo falla, **NO se procede**. Se reporta al usuario y se espera nueva instrucción.

> **Compromiso:** Ninguna fila existente será modificada o eliminada sin respaldo verificable + validación previa + aprobación explícita del usuario.

---

## 1. Principio fundamental

**Garantía que ofrezco:**
- ✅ **Cero filas eliminadas o sobrescritas** sin tu aprobación explícita por escrito en cada paso riesgoso.
- ✅ **Respaldo verificado** antes de cualquier operación de escritura en la BD.
- ✅ **Validación de paridad** (conteos + checksums) antes y después.
- ✅ **Rollback documentado y probado** para cada operación.
- ✅ **No procederé** si el entorno no es seguro (ej. falta backup, no hay staging, datos no validan).

**Lo que NO puedo garantizar (honestidad):**
- ❌ Que un fallo de hardware durante una operación no cause corrupción (mitigable con backup, pero no eliminable al 100%).
- ❌ Que el servidor MariaDB no tenga bugs propios que causen pérdida (extremadamente raro en MariaDB 10.6 LTS).
- ❌ Que una operación "trivial" en un sistema con millones de filas no tenga un edge case no previsto.

Por eso existe este protocolo: **convertir un riesgo teórico en un riesgo prácticamente cero** mediante redundancia de seguridad.

---

## 2. Clasificación de riesgo por operación

Cada operación del plan está clasificada. **Solo se procederá con operaciones Nivel 0/1/2 sin aprobación explícita** (porque son estructuralmente seguras). **Nivel 3 SIEMPRE requiere tu aprobación escrita.**

### Nivel 0 — `RIESGO CERO` (operaciones de lectura / metadatos)

**Definición:** No tocan filas existentes. Operan sobre catálogos del motor o son queries.

| Operación | Por qué es segura |
|---|---|
| `SELECT` (cualquiera) | No modifica nada. |
| `EXPLAIN` | Idem. |
| `SHOW INDEX`, `SHOW STATUS` | Solo lectura de metadatos. |
| `ANALYZE TABLE` | Solo actualiza estadísticas del optimizador. |
| Crear archivos de migración (sin aplicar) | Solo filesystem. |
| Cambiar código de aplicación | No toca BD directamente. |
| Tuning de PrismaClient (pool, log) | Configuración del cliente, no del schema. |
| Agregar Redis (Fase C) | Infraestructura nueva, no toca datos. |

**Protocolo:** Ninguno. Proceder libremente.

### Nivel 1 — `ADITIVO PURO` (no pueden perder datos por construcción)

**Definición:** Solo agregan objetos nuevos (índices, columnas con default, tablas, constraints permisivos). No modifican ni eliminan filas existentes.

| Operación | Por qué es segura |
|---|---|
| `CREATE INDEX` (sin UNIQUE sobre columna con duplicados) | Solo crea estructura. MariaDB 10.6 hace esto **online sin lock** (ALGORITHM=INPLACE). |
| `CREATE INDEX ... UNIQUE` en columna ya con UNIQUE existente | Idempotente. |
| `ADD COLUMN ... NULL` | No afecta filas existentes (queda NULL). |
| `ADD COLUMN ... DEFAULT 0` | MariaDB 10.6 con `INSTANT` algorithm no reescribe tabla. |
| `CREATE TABLE` (nueva) | Independiente, no afecta tablas existentes. |
| `ADD CONSTRAINT CHECK` que se sabe válida (datos ya cumplen) | Solo agrega validación hacia adelante. |
| Renombrar columna/tabla | Solo cambia metadatos. **Requiere validar que no se rompan FKs o queries en vivo** (ver protocolo). |

**Protocolo obligatorio antes de ejecutar:**
1. ✅ Backup lógico reciente (`mysqldump`).
2. ✅ Verificar que el cambio es compatible con el motor (MariaDB 10.6 soporta `INSTANT`/`INPLACE` para la operación).
3. ✅ Tener script de rollback (`DROP INDEX`, `DROP COLUMN`).
4. ✅ Probar primero en un clon local de la BD (`docker-compose up db` con dump cargado).

### Nivel 2 — `MIGRACIÓN DE DATOS REVERSIBLE` (riesgo bajo con backup)

**Definición:** Modifican datos pero de forma **completamente reversible** porque se hace en pasos atómicos.

| Operación | Por qué es (casi) segura |
|---|---|
| Backfill de columna nueva desde columna vieja (UPDATE) | Reversible: la columna vieja sigue existiendo. |
| `ALTER TABLE ... MODIFY COLUMN type` para ampliación (VARCHAR(50) → VARCHAR(100)) | No pierde datos, solo aumenta capacidad. |
| Cambiar default de columna | No afecta filas existentes. |
| Crear nueva tabla y poblarla con `INSERT ... SELECT` desde tabla vieja | Tabla vieja intacta. Se valida paridad. |

**Protocolo obligatorio:**
1. ✅ Backup completo (no incremental).
2. ✅ **Validación de paridad pre/post** con script que cuente filas + muestre muestra aleatoria.
3. ✅ Ejecutar dentro de `START TRANSACTION ... COMMIT` o ser reversible por instrucción única.
4. ✅ Probar en staging con datos reales (mismo dump).
5. ✅ Plan de rollback explícito (ej. `DROP TABLE nueva_tabla`).

### Nivel 3 — `REQUIERE APROBACIÓN EXPLÍCITA + STAGING` (riesgo medio-alto)

**Definición:** Eliminan, sobrescriben o cambian el tipo/semántica de datos existentes de forma no trivialmente reversible.

| Operación | Riesgo |
|---|---|
| `DROP COLUMN` | Datos en esa columna se pierden. |
| `DROP TABLE` | Datos completos se pierden. |
| `ALTER TABLE ... DROP COLUMN` tras backfill | Pierde la columna vieja (es el punto). |
| Cambio de tipo que pueda truncar (VARCHAR(255) → VARCHAR(50)) | Puede truncar valores largos. |
| Conversión de `Json` a tabla normalizada con pérdida de keys desconocidas | Si hay keys no contempladas, se pierden. |
| Normalización `Product.img/img1/.../img5` → tabla `ProductImage` | Si la migración de datos tiene un bug, se pierden paths. |

**Protocolo OBLIGATORIO (no negociable):**
1. ✅ Backup completo verificado (`mysqldump` + `wc -l` + checksum).
2. ✅ **Staging environment obligatorio** (réplica 1:1 de producción con el mismo dump).
3. ✅ Ejecutar primero en staging, validar con queries de paridad.
4. ✅ Presentar al usuario:
   - Script SQL exacto a ejecutar.
   - Script de validación pre/post.
   - Script de rollback.
   - Estimación de tiempo de bloqueo (lock time) en tablas grandes.
5. ✅ **Aprobación explícita del usuario por escrito** ("procede", "OK", "adelante").
6. ✅ Ejecutar en ventana de mantenimiento (low traffic).
7. ✅ Validación post con script automático + revisión manual.
8. ✅ No marcar como "completado" hasta 24h sin reportes de pérdida.

---

## 3. Mapeo de operaciones del plan a niveles de riesgo

### FASE A — Fundamentos

| Commit | Operación | Nivel | Requiere aprobación |
|---|---|---|---|
| A1 | Generar archivo de migración baseline (sin aplicar) | **N0** | No |
| A1 | Aplicar migración baseline (`migrate deploy`) | **N1** (solo si valida contra DB actual) | No, pero reporta |
| A2 | Agregar índices al schema (CREATE INDEX) | **N1** | No |
| A3 | Tunear PrismaClient (no toca BD) | **N0** | No |
| A4 | Script de backup (no toca BD) | **N0** | No |

### FASE B — Optimización de queries existentes

| Commit | Operación | Nivel | Requiere aprobación |
|---|---|---|---|
| B1-B7 | Reescritura de queries (no toca schema) | **N0** | No |

### FASE C — Cache distribuido

| Commit | Operación | Nivel | Requiere aprobación |
|---|---|---|---|
| C1 | Agregar servicio Redis (nuevo container) | **N0** | No |
| C2-C4 | Cambiar `CacheInterceptor` (no toca BD) | **N0** | No |

### FASE D — Mejoras estructurales

| Commit | Operación | Nivel | Requiere aprobación |
|---|---|---|---|
| D1 | Crear tabla `FirebaseUser` (nueva tabla) | **N1** | No |
| D2 | Reemplazar `userId VARCHAR` por FK a `User` (cambio de tipo) | **N3** | **SÍ — obligatoria** |
| D3 | Normalizar `Product.img/...img5` → tabla `ProductImage` | **N3** | **SÍ — obligatoria** |
| D4 | Normalizar `RentalContract.safetyChecklist` (Json → tabla) | **N3** | **SÍ — obligatoria** |
| D5 | Convertir `Event.partners` String → enum | **N2** | No, pero staging obligatorio |
| D6 | Crear tabla `TranslationCache` | **N1** | No |
| D7 | Crear tabla `PushToken` | **N1** | No |
| D8 | Crear tabla `AuditLog` | **N1** | No |

### FASE E — Hardening operacional

| Commit | Operación | Nivel | Requiere aprobación |
|---|---|---|---|
| E1 | Agregar `CHECK` constraints | **N1** (si validación pre pasa) | No si pasa validación |
| E2 | Cron job `UPDATE waiver_v2_waiverqr SET status='INACTIVE' WHERE expires_at < NOW()` | **N2** | No, pero staging primero |
| E3-E5 | Endpoints de monitoreo, docs, tests | **N0** | No |

---

## 4. Procedimiento estándar por nivel

### Procedimiento N0 (Riesgo Cero)
1. Hacer el cambio.
2. Verificar que funciona.

### Procedimiento N1 (Aditivo Puro)

```
1. ANUNCIO: "Voy a aplicar [operación]. Nivel N1."
2. BACKUP: docker exec db mysqldump > backups/pre_<commit>_<timestamp>.sql
   Verificar: ls -lh backups/pre_<commit>_<timestamp>.sql  (>0 bytes)
3. DRY-RUN: Mostrar el SQL exacto sin ejecutar.
4. EJECUCIÓN: Aplicar cambio.
5. VALIDACIÓN POST:
   - Contar filas (debe ser igual).
   - Probar 3-5 endpoints que usen esa tabla.
   - Revisar slow query log.
6. COMMIT + tag.
```

### Procedimiento N2 (Migración Reversible)

```
1-4. Igual que N1.
5. EJECUCIÓN: Aplicar cambio DENTRO de transacción si es posible.
6. VALIDACIÓN POST:
   - SELECT COUNT(*) antes vs después (debe coincidir).
   - Muestra aleatoria del 10% de filas: comparar campos críticos byte-a-byte.
   - Para UPDATEs: log de filas afectadas, revisar manualmente las primeras 10.
7. PRUEBA DE ROLLBACK:
   - Ejecutar el script de rollback en staging (no en prod).
   - Confirmar que restaura el estado anterior.
8. INFORME al usuario con métricas.
9. COMMIT + tag.
```

### Procedimiento N3 (Requiere Aprobación)

```
1. PRESENTACIÓN al usuario:
   - SQL exacto
   - Script de validación pre
   - Script de validación post
   - Script de rollback
   - Estimación de tiempo de bloqueo
   - Análisis de impacto en queries existentes
2. ESPERAR APROBACIÓN EXPLÍCITA.
3. Crear rama de staging.
4. Cargar dump de producción en staging.
5. Ejecutar en staging.
6. Validar en staging.
7. Reportar resultados al usuario.
8. ESPERAR APROBACIÓN PARA PROD.
9. Backup pre en prod.
10. Aplicar en prod en ventana de mantenimiento.
11. Validar en prod.
12. Monitorear 24h.
13. Reportar al usuario.
14. Solo entonces: COMMIT + tag.
```

---

## 5. Scripts de validación obligatorios

### 5.1 Pre-cambio: `scripts/validate_pre.sh`

```bash
#!/bin/bash
# Ejecutar ANTES de cualquier cambio.
# Captura estado actual: conteos, checksums, muestra.

set -e
DB_NAME=${1:-smap_kf}
OUT=backups/pre_validation_$(date +%Y%m%d_%H%M%S).txt

echo "=== VALIDACIÓN PRE-CAMBIO $(date) ===" > $OUT

for table in \
  auth_user \
  t_app_product_product \
  t_app_event \
  t_app_product_like \
  t_app_product_comment \
  t_app_product_comment_reply \
  waiver_v2_waiverqr \
  waiver_v2_waiverdata \
  waiver_v2_waiverscan \
  waiver_v2_waiverdocument \
  t_app_chat_administrator \
  t_app_chat_room \
  t_app_chat_message \
  t_app_contact_message \
  t_app_product_waivervalidator \
  t_app_rental_contract; do

  COUNT=$(mysql -u mrgomez -p"$DB_PASSWORD" -h localhost -P 3309 $DB_NAME -sN \
    -e "SELECT COUNT(*) FROM $table;")
  echo "$table: $COUNT filas" >> $OUT

  # Checksum rápido (sólo filas como CSV-ish)
  CHECKSUM=$(mysql -u mrgomez -p"$DB_PASSWORD" -h localhost -P 3309 $DB_NAME -sN \
    -e "SELECT MD5(GROUP_CONCAT(id ORDER BY id SEPARATOR '|')) FROM $table;" 2>/dev/null || echo "N/A")
  echo "  MD5(ids): $CHECKSUM" >> $OUT
done

echo "=== Validación guardada en $OUT ==="
cat $OUT
```

### 5.2 Post-cambio: `scripts/validate_post.sh`

```bash
#!/bin/bash
# Ejecutar DESPUÉS del cambio.
# Compara con el archivo pre_validation_*.txt más reciente.

set -e
PRE_FILE=$(ls -t backups/pre_validation_*.txt 2>/dev/null | head -1)

if [ -z "$PRE_FILE" ]; then
  echo "ERROR: No existe archivo pre_validation_*.txt"
  exit 1
fi

echo "=== VALIDACIÓN POST-CAMBIO $(date) ==="
echo "Comparando contra: $PRE_FILE"
echo ""

POST_OUT=backups/post_validation_$(date +%Y%m%d_%H%M%S).txt
echo "=== VALIDACIÓN POST-CAMBIO $(date) ===" > $POST_OUT

EXIT_CODE=0

for table in \
  auth_user \
  t_app_product_product \
  t_app_event \
  t_app_product_like \
  t_app_product_comment \
  t_app_product_comment_reply \
  waiver_v2_waiverqr \
  waiver_v2_waiverdata \
  waiver_v2_waiverscan \
  waiver_v2_waiverdocument \
  t_app_chat_administrator \
  t_app_chat_room \
  t_app_chat_message \
  t_app_contact_message \
  t_app_product_waivervalidator \
  t_app_rental_contract; do

  PRE_COUNT=$(grep "^$table:" $PRE_FILE | awk '{print $2}')
  POST_COUNT=$(mysql -u mrgomez -p"$DB_PASSWORD" -h localhost -P 3309 smap_kf -sN \
    -e "SELECT COUNT(*) FROM $table;")
  POST_CHECKSUM=$(mysql -u mrgomez -p"$DB_PASSWORD" -h localhost -P 3309 smap_kf -sN \
    -e "SELECT MD5(GROUP_CONCAT(id ORDER BY id SEPARATOR '|')) FROM $table;" 2>/dev/null || echo "N/A")

  if [ "$PRE_COUNT" = "$POST_COUNT" ]; then
    STATUS="OK"
  else
    STATUS="MISMATCH"
    EXIT_CODE=1
  fi
  echo "$table: pre=$PRE_COUNT post=$POST_COUNT [$STATUS]" | tee -a $POST_OUT
done

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ TODAS LAS TABLAS CONSISTENTES"
else
  echo "🚨 HAY DIFERENCIAS - NO PROCEDER - REVISAR INMEDIATAMENTE"
fi

exit $EXIT_CODE
```

### 5.3 Backup: `scripts/backup_db.sh`

```bash
#!/bin/bash
# Backup completo con verificación.

set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=backups
mkdir -p $BACKUP_DIR

DB_CONTAINER="proyecto_kidsfun_db_data"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_password}"

DUMP_FILE="$BACKUP_DIR/smap_kf_backup_${TIMESTAMP}.sql.gz"

echo "Creando backup en $DUMP_FILE ..."
docker exec $DB_CONTAINER mysqldump \
  -u root -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --default-character-set=utf8mb4 \
  smap_kf 2>/dev/null | gzip > "$DUMP_FILE"

# Validar que el archivo no está vacío y se puede descomprimir
if [ ! -s "$DUMP_FILE" ]; then
  echo "❌ ERROR: backup vacío"
  exit 1
fi

if ! gunzip -t "$DUMP_FILE" 2>/dev/null; then
  echo "❌ ERROR: backup corrupto (no descomprime)"
  exit 1
fi

SIZE=$(ls -lh "$DUMP_FILE" | awk '{print $5}')
TABLE_COUNT=$(zcat "$DUMP_FILE" | grep -c "^CREATE TABLE")
echo "✅ Backup OK: $DUMP_FILE ($SIZE, $TABLE_COUNT tablas)"
```

---

## 6. Plan revisado: lo que haré vs. lo que pediré aprobación

### ✅ Lo que haré sin pedirte aprobación (N0/N1 con protocolo)

1. **Fase A completa** (4 commits):
   - Generar archivos de migración (sin aplicar).
   - Aplicar migración baseline (N1 — solo crea estructura nueva o no-op).
   - Agregar índices CREATE INDEX (N1 — MariaDB 10.6 online DDL).
   - Tunear PrismaClient.
   - Script de backup.
2. **Fase B completa** (queries, no toca schema).
3. **Fase C completa** (Redis, no toca BD existente).
4. **Fase D parcialmente**:
   - D1, D6, D7, D8 (crear tablas nuevas — N1).
5. **Fase E parcialmente**:
   - E3, E4, E5 (monitoreo/docs/tests).
   - E1 (CHECK constraints — N1, previa validación).
   - E2 (cron job — N2 con validación).

**Para cada uno:**
- Backup previo obligatorio.
- Script de validación pre/post.
- Reporte inmediato con resultados.
- Si hay mismatch en conteos: **paro y te aviso**.

### ⛔ Lo que NO haré sin tu aprobación explícita (N3)

1. **D2**: Cambiar `userId VARCHAR` por FK a `User` (cambio de tipo de columna).
2. **D3**: Normalizar `Product.img/img1/.../img5` → tabla `ProductImage`.
3. **D4**: Normalizar `RentalContract.safetyChecklist` (Json → tabla).
4. **D5**: Conversión String → enum (cambio de tipo en columna con datos).
5. **Cualquier DROP COLUMN/TABLE** posterior a backfill.

**Para cada uno, te entregaré antes de tocar nada:**
- Script SQL exacto.
- Script de validación con conteos esperados.
- Script de rollback completo.
- Estimación de tiempo de bloqueo.
- Resultado de la prueba en staging con dump de producción.
- **Y esperaré tu "OK" antes de aplicar en producción.**

---

## 7. Reglas de rollback

### Rollback inmediato (operación aditiva)

```sql
-- Para CREATE INDEX idx_X
DROP INDEX idx_X ON tabla;

-- Para ADD COLUMN
ALTER TABLE tabla DROP COLUMN nueva_columna;

-- Para CREATE TABLE
DROP TABLE nueva_tabla;
```

### Rollback de UPDATE masivo

```sql
-- El script debe incluir el UPDATE inverso.
-- Ejemplo: si hiciste UPDATE tabla SET col = 'NUEVO' WHERE cond
-- Rollback: UPDATE tabla SET col = 'VIEJO' WHERE cond
-- (por eso el backup pre es crítico)
```

### Rollback desde backup completo

```bash
# Restaurar dump completo en la BD
gunzip < backups/smap_kf_backup_TIMESTAMP.sql.gz | \
  docker exec -i proyecto_kidsfun_db_data \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" smap_kf
```

**Tiempo estimado de restauración:** ~5-15 min para BD de este tamaño.

---

## 8. Compromiso verificable

**Te propongo este flujo de trabajo para Fase A:**

1. Te muestro el SQL exacto de la migración baseline antes de aplicarla.
2. Te muestro el listado exacto de índices que voy a crear.
3. Ejecuto backup.
4. Ejecuto validación pre.
5. Aplico cambios.
6. Ejecuto validación post.
7. Te paso un reporte con:
   - Conteos antes/después por tabla (deben coincidir).
   - Lista de índices creados.
   - Resultado de 5 endpoints de prueba.
8. Si todo OK → commit.
9. Si hay mismatch → paro, te aviso, NO commit.

**¿Procedo con la Fase A bajo este protocolo?** Confirmar y arranco.

Si quieres ajustar algo del protocolo (ej. quieres staging obligatorio también para N1, o quieres un canal de notificación específico), dímelo antes de empezar.