# ── 런타임 전용 (빌드는 호스트에서 수행) ──
FROM node:20-slim

RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY .output ./.output
COPY lib ./lib
# /admin/uml 사이드바용 prebuilt 캐시. 컨테이너에는 소스 트리가 없으므로
# 호스트에서 `pnpm build` 시 생성된 features.json 을 동봉한다.
COPY .omc/uml-cache ./.omc/uml-cache

RUN chown -R app:app /app

USER app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
