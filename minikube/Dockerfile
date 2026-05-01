# ── 런타임 전용 (빌드는 호스트에서 수행) ──
FROM node:20-slim

WORKDIR /app

COPY .output ./.output
COPY lib ./lib

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
