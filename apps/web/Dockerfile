FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY media ./media
COPY media ./apps/web/public/media
COPY apps/web/tsconfig*.json ./apps/web/
COPY apps/web/next.config.* ./apps/web/
COPY apps/web/tailwind.config.* ./apps/web/
COPY apps/web/postcss.config.* ./apps/web/

WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA0f6Kx-Ixq77JzDAKMbxwvZFBXYaoRK4M
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=smap-kf.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=smap-kf
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=smap-kf.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=270487164933
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:270487164933:web:6575488d5a733fe878a46c

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
COPY --from=base /app/media ./apps/web/public/media
COPY --from=base /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000

COPY --from=base /app/apps/web/node_modules/next/dist/bin/next ./node_modules/next/dist/bin/next

WORKDIR /app/apps/web
CMD ["node", "./node_modules/next/dist/bin/next", "start"]
