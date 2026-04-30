# ── Stage 1: Build ──
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

# 의존성 캐시 레이어
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 복사 & 빌드
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# ── Stage 2: Runtime ──
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/lib ./lib

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
