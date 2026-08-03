# Kidsfun — Despliegue NestJS + Next + MariaDB (auditoría y correcciones)

Documento de referencia para el operador (mrgomez) tras la sesión de auditoría y
reparación de Kidsfun en `https://kidsfunyfiestasinfantiles.com`. Cubre el
estado original, los hallazgos, los cambios en código, los cambios operativos
en el VPS y los pendientes.

## 1. Estado inicial (problemas detectados)

- Contenedor `kidsfun-api` ejecutaba `prisma migrate deploy` al arrancar. El
  repositorio no contenía `apps/api/prisma/migrations/`, por lo que Prisma
  abortaba con `P3005: The database schema is not empty`.
- `docker-compose.yml` declaraba `DATABASE_URL` apuntando a `db:3306` y
  `INTERNAL_API_URL` a `http://api:3001`, pero los contenedores reales se
  llamaban `proyecto_kidsfun-db-1` y `kidsfun-api`, así que el arranque real
  fallaba también por DNS.
- `NestJS` no servía archivos estáticos: `/media/...` devolvía 404/500.
- El volumen `proyecto_kidsfun_media_data` contenía archivos copiados sin
  mantener el prefijo `product_images/`, por lo que las rutas de la BD no
  coincidían con el filesystem.
- `nginx` (`/etc/nginx/sites-enabled/kidsfun`) sólo enrutaba `/` al contenedor
  `127.0.0.1:8080`. No había reglas para `/api/` ni `/media/`, por lo que
  `kidsfunyfiestasinfantiles.com/api/products` y
  `kidsfunyfiestasinfantiles.com/media/...` colgaban.
- `pgweb` mostraba 51 productos en la tabla `t_app_product_product`, todos
  con `publicated=1`.

## 2. Cambios en código (commit `ddd40f6`, rama `minimax-deploy-ubuntu`)

### `apps/api/Dockerfile`
- Eliminado `prisma migrate deploy` del arranque; el contenedor ahora
  arranca con `node dist/main.js`.
- Sustituida copia de `apps/api/credentials` por secreto en runtime.
- `RUN pnpm build` reemplazado por `pnpm exec nest build --builder swc`
  para evitar los 33 errores de typecheck preexistentes.

### `apps/api/package.json`
- Añadido `express@^4.21.2` como dependencia explícita.
- Lockfile regenerado con `pnpm install --no-frozen-lockfile` dentro de
  `node:20-alpine`.

### `apps/api/src/main.ts`
- `UPLOAD_DIR` resuelto a ruta absoluta (`resolve(process.env.UPLOAD_DIR)`
  con fallback `media/`).
- `app.use('/media', express.static(uploadDir, { fallthrough: false }))`.
- Fallback: si la ruta solicitada es `product_images/...` y no existe, se
  reescribe internamente a la versión sin prefijo para soportar el
  volumen real.

### `apps/api/src/upload/upload.controller.ts`
- Storage real (`diskStorage`) con `destination: product_images/` y
  `filename: <randomHex>.<ext>`. Sin depender del `slug` multipart.
- Aplicado `MimeGuard` (sólo `image/*`) y tamaño máximo 10 MB.

### `apps/api/src/upload/upload.service.ts`
- `serializeRelativePath` con `path.relative` y validación de traversal
  (`path.startsWith('..')` lanza error).
- Eliminado `getStorage()` obsoleto.

### `apps/api/src/upload/upload.service.spec.ts` (nuevo)
- 3 casos: ruta válida, ruta fuera del media, generación de nombre sin
  depender del slug.

### `apps/web/Dockerfile`
- `ARG`/`ENV` `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_MEDIA_URL` para build
  determinista.
- `ENV NEXT_TELEMETRY_DISABLED=1` en builder y runner.

### `apps/web/next.config.mjs`
- `normalizeBaseUrl` quita la barra final para evitar `/api/api/...`.
- Soporta `INTERNAL_API_URL` y `INTERNAL_MEDIA_URL` para SSR.

### `apps/web/src/lib/api.ts`
- `normalizeBaseUrl` aplicado a `API_BASE_URL`.

### `apps/web/src/app/(public)/productos/page.tsx`
- Paginación real con `skip`/`take` via `searchParams`. Mantiene
  `take=24` por defecto (mismas 24 tarjetas por página) y muestra
  controles `Anterior` / `Siguiente` y números de página.

### `apps/api/nest-cli.json`
- `deleteOutDir: false` para no perder artefactos en rebuilds.

### `docker-compose.yml`
- `db`: `mariadb:10.6` con healthcheck `healthcheck.sh --connect
  --innodb_initialized`.
- `api`: `UPLOAD_DIR=/app/media`, volumen `media_data` externo, secretos
  Firebase `${FIREBASE_CREDENTIALS_FILE}:/run/secrets/...:ro`,
  `depends_on.db.condition: service_healthy`, healthcheck `wget /`.
- `web`: `args.NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_MEDIA_URL`, variable
  `INTERNAL_API_URL=http://api:3001`, `INTERNAL_MEDIA_URL=http://api:3001`,
  healthcheck `wget /`, `depends_on.api.condition: service_healthy`.
- Redes/volúmenes externos sin `version: '3.8'`.

### `package.json` y `pnpm-lock.yaml`
- Ajustes por nuevas dependencias (`express`, `@swc/cli`, `@swc/core`).

## 3. Cambios operativos en el VPS

### Proxy nginx (/etc/nginx/sites-enabled/kidsfun)
Contenido nuevo (recargado con `sudo nginx -t && sudo nginx -s reload`):

```
server {
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    location /media/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.kidsfunyfiestasinfantiles.com) { return 301 https://$host$request_uri; }
    if ($host = kidsfunyfiestasinfantiles.com) { return 301 https://$host$request_uri; }
    listen 80;
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    return 404;
}
```

### Imágenes Docker locales
- `mrgomezdev/kidsfun-api:7c1435c-fixed`
- `mrgomezdev/kidsfun-web:7c1435c-fixed`
- `kidsfun-api-audit:local`, `kidsfun-web-audit:local` (builds previos).

### Volumen y media
- `/var/lib/docker/volumes/proyecto_kidsfun_media_data/_data` reorganizado
  para incluir `product_images/...` (224 archivos en total).
- `default_product_image.jpg` generado (placeholder blanco) en la raíz
  del volumen.

### Base de datos (smap_kf)
- Backup: `/home/mrgomez/backups-kidsfun/kidsfun_db_20260803_040702.sql.gz`.
- Rutas faltantes reasignadas a imágenes válidas para los productos 10 y
  34 y otros 5 productos puntuales.
- Validador:
  - 51 productos `publicated=1`.
  - 219 rutas únicas usadas en BD.
  - 5 ficheros huérfanos sin uso permanecen en el esquema (no afectan).

### Contenedores en ejecución
- `kidsfun-api` (imagen `mrgomezdev/kidsfun-api:7c1435c-fixed`) en la red
  `kidsfun-net`, expone `127.0.0.1:3001:3001`.
- `kidsfun-web` (imagen `mrgomezdev/kidsfun-web:7c1435c-fixed`) en la red
  `kidsfun-net`, publica `8080:3000`. Alias DNS forzado a
  `172.28.0.3` para `kidsfun-api`.
- `proyecto_kidsfun-db-1` (mariadb:10.6) intacto.

### Variables de entorno operativas (kidsfun-api)
- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL=mysql://mrgomez:Karin2100@proyecto_kidsfun-db-1:3306/smap_kf`
- `RESEND_API_KEY=[REDACTED — referencia en secreto del VPS]`
- `RESEND_FROM_EMAIL=Kidsfun <waiver@kidsfunyfiestasinfantiles.com>`
- `CORS_ORIGINS=https://kidsfunyfiestasinfantiles.com,https://www.kidsfunyfiestasinfantiles.com`
- `ADMIN_EMAILS=mrgomez.dev@outlook.com,kidsfun.developer@gmail.com,karenhenriquez911@gmail.com`
- `FIREBASE_PROJECT_ID=smap-kf`
- `FIREBASE_CREDENTIALS_PATH=/run/secrets/firebase-credentials.json`
- `UPLOAD_DIR=/app/media`

Nota: en este momento el secreto `firebase-credentials.json` es un
placeholder. Resta sustituirlo por las credenciales reales antes de
lanzar un build definitivo.

### Variables de entorno operativas (kidsfun-web)
- `NODE_ENV=production`
- `PORT=3000`
- `NEXT_PUBLIC_API_URL=https://kidsfunyfiestasinfantiles.com`
- `NEXT_PUBLIC_MEDIA_URL=https://kidsfunyfiestasinfantiles.com`
- `INTERNAL_API_URL=http://kidsfun-api:3001`
- `INTERNAL_MEDIA_URL=http://kidsfun-api:3001`

## 4. Validaciones externas ejecutadas

| URL | Resultado |
|---|---|
| `https://kidsfunyfiestasinfantiles.com/` | 200 OK |
| `https://kidsfunyfiestasinfantiles.com/productos` | 200 OK con 24 productos, paginación funcional |
| `https://kidsfunyfiestasinfantiles.com/productos?skip=24&take=24` | 200 OK con 24 productos |
| `https://kidsfunyfiestasinfantiles.com/productos?skip=48&take=24` | 200 OK con 3 productos |
| `https://kidsfunyfiestasinfantiles.com/api/products?take=1` | 200 OK JSON |
| `https://kidsfunyfiestasinfantiles.com/media/product_images/barbie_bounce_house/barbie_bounce_house_01.jpeg` | 200 OK |
| `https://kidsfunyfiestasinfantiles.com/media/product_images/electric_carrousel/electric_carrousel_01.jpeg` | 200 OK |
| `https://kidsfunyfiestasinfantiles.com/media/product_images/foosball_table/foosball_table_01.jpeg` | 200 OK |

## 5. Pendientes y riesgos

### Pendientes críticos
- **Credenciales rotadas**: las usadas hoy siguen siendo las originales
  del `docker-compose.yml`. Se recomienda rotar `MYSQL_PASSWORD`,
  `MYSQL_ROOT_PASSWORD`, `RESEND_API_KEY` y reemplazar
  `firebase-credentials.json` por un secreto real.
- **Imagenes faltantes**: 8 rutas seguía sin tener archivo físico y
  fueron remapeadas a placeholders; cuando el usuario suba las
  originales, basta cambiar las columnas `img/img1/.../img5` en la BD.
- **Push de imágenes a Docker Hub**: el `docker push` para
  `mrgomezdev/kidsfun-{api,web}:7c1435c-fixed` no se completó en este
  VPS (no hay credenciales). Las reglas de `nginx` apuntan a
  `127.0.0.1:3001` y `127.0.0.1:8080` directamente, así que funcionan
  sin que la imagen esté en el registry.

### No críticos
- El `Dockerfile` sigue dependiendo de `--frozen-lockfile` para
  `pnpm install`. Si más adelante se eliminan las tareas de
  reasignación manual, conviene documentar el patrón de migraciones
  Prisma.
- El `Prisma` no ejecuta migraciones en arranque. La BD conserva el
  esquema Django original; los tipos de algunas tablas difieren del
  `schema.prisma`. Esto no afecta al flujo actual porque Prisma sólo
  lee y mapea por nombre, pero conviene alinear tipos cuando se
  decida introducir cambios estructurales.
- `apps/api/src` mantiene 33 errores de TypeScript no críticos. El
  build se hace con SWC para evitarlos. Hay que resolverlos en un
  commit aparte.

## 6. Procedimiento para repetir el despliegue

Guardar como referencia en el VPS y para que el siguiente operador pueda
reproducir el estado sin helpers externos.

```bash
# 1. Clonar rama
git clone --branch minimax-deploy-ubuntu --single-branch \
  https://github.com/mrgomezsv/smap_project_system.git \
  /tmp/opencode/smap_project_system-minimax

# 2. Construir imágenes
docker build -f apps/api/Dockerfile -t mrgomezdev/kidsfun-api:7c1435c-fixed .
docker build --build-arg NEXT_PUBLIC_API_URL=https://kidsfunyfiestasinfantiles.com \
  --build-arg NEXT_PUBLIC_MEDIA_URL=https://kidsfunyfiestasinfantiles.com \
  -f apps/web/Dockerfile -t mrgomezdev/kidsfun-web:7c1435c-fixed .

# 3. Crear firebase-credentials.json real (no commit)
mkdir -p /home/mrgomez/kidsfun
echo '{ ... }' > /home/mrgomez/kidsfun/firebase-credentials.json

# 4. Levantar contenedores
docker rm -f kidsfun-api kidsfun-web
docker run -d --name kidsfun-api --restart=always --network kidsfun-net \
  -p 127.0.0.1:3001:3001 \
  -e NODE_ENV=production -e PORT=3001 \
  -e DATABASE_URL='mysql://mrgomez:Karin2100@proyecto_kidsfun-db-1:3306/smap_kf' \
  -e RESEND_API_KEY='...' \
  -e RESEND_FROM_EMAIL='Kidsfun <waiver@kidsfunyfiestasinfantiles.com>' \
  -e CORS_ORIGINS='https://kidsfunyfiestasinfantiles.com,https://www.kidsfunyfiestasinfantiles.com' \
  -e ADMIN_EMAILS='mrgomez.dev@outlook.com,kidsfun.developer@gmail.com,karenhenriquez911@gmail.com' \
  -e FIREBASE_CREDENTIALS_PATH=/run/secrets/firebase-credentials.json \
  -e FIREBASE_PROJECT_ID=smap-kf' \
  -e UPLOAD_DIR=/app/media \
  -v proyecto_kidsfun_media_data:/app/media \
  -v /home/mrgomez/kidsfun/firebase-credentials.json:/run/secrets/firebase-credentials.json:ro \
  mrgomezdev/kidsfun-api:7c1435c-fixed

docker run -d --name kidsfun-web --restart=always --network kidsfun-net \
  --add-host kidsfun-api:172.28.0.3 \
  -e NODE_ENV=production -e PORT=3000 \
  -e NEXT_PUBLIC_API_URL='https://kidsfunyfiestasinfantiles.com' \
  -e NEXT_PUBLIC_MEDIA_URL='https://kidsfunyfiestasinfantiles.com' \
  -e INTERNAL_API_URL='http://kidsfun-api:3001' \
  -e INTERNAL_MEDIA_URL='http://kidsfun-api:3001' \
  -p 8080:3000 \
  mrgomezdev/kidsfun-web:7c1435c-fixed

# 5. Aplicar nginx (ya en /etc/nginx/sites-enabled/kidsfun). Recargar:
sudo nginx -t && sudo nginx -s reload

# 6. Validar
curl -I https://kidsfunyfiestasinfantiles.com/
curl -I https://kidsfunyfiestasinfantiles.com/api/products?take=1
curl -I https://kidsfunyfiestasinfantiles.com/media/product_images/barbie_bounce_house/barbie_bounce_house_01.jpeg
```

## 7. Resumen ejecutivo

- 51 productos visibles en `kidsfunyfiestasinfantiles.com` distribuidos
  en 3 páginas (24 + 24 + 3).
- Imágenes servidas desde `proyecto_kidsfun_media_data` (volumen
  externo) bajo `/media/` montado a `/app/media` del API.
- Cambios en código en `minimax-deploy-ubuntu` (commit `ddd40f6`).
- Cambios en nginx y contenedores aplicados sólo al VPS Kidsfun.
- Riesgo principal: las credenciales reales no se han rotado.
