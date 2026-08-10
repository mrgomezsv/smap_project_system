FROM node:20-alpine AS base

# 1. Instalar pnpm
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

WORKDIR /app

# 2. Copiar archivos de definición de dependencias del monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# 3. Instalar dependencias
RUN pnpm install --frozen-lockfile

# 4. Copiar código fuente de api y esquema de prisma
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/credentials ./apps/api/credentials
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# 5. Generar cliente de Prisma y construir la aplicación NestJS
WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

# 6. Etapa de ejecución (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/apps/api/prisma ./apps/api/prisma
COPY --from=base /app/apps/api/credentials ./apps/api/credentials
COPY media ./media
COPY media ./apps/api/media
COPY --from=base /app/apps/api/src/assets ./apps/api/dist/assets

EXPOSE 3001

WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate resolve --applied 20260809120000_clients_unified_g1 || true; npx prisma migrate deploy && node dist/main.js"]
