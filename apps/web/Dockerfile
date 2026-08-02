FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/tsconfig*.json ./apps/web/
COPY apps/web/next.config.* ./apps/web/
COPY apps/web/tailwind.config.* ./apps/web/
COPY apps/web/postcss.config.* ./apps/web/

WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["pnpm", "start"]
