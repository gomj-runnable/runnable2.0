FROM node:20-slim

WORKDIR /app

# 빌드 결과만 복사
COPY .output ./.output

# 환경 변수
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 포트 오픈
EXPOSE 3000

# 서버 실행
CMD ["node", ".output/server/index.mjs"]