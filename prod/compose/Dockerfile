# ── 런타임 전용 (빌드는 호스트/Jenkins 에서 수행) ──
# 빌드 컨텍스트: 프로젝트 루트 (prod/compose/docker-compose.yml 의 build.context: ../..)
FROM node:20-slim

RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY .output ./.output
COPY lib ./lib

RUN chown -R app:app /app

USER app

ENV ENVIRONMENT_MODE=PRODUCT
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
