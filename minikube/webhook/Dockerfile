FROM node:20-alpine

WORKDIR /app

COPY server.mjs .

ENV WEBHOOK_PORT=3001

EXPOSE 3001

CMD ["node", "server.mjs"]
