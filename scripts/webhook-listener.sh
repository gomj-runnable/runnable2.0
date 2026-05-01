#!/usr/bin/env bash
# =============================================================================
# Docker Hub Webhook Listener
# Docker Hub push 알림을 받아 컨테이너를 rolling update한다.
#
# 사용법: bash scripts/webhook-listener.sh
# 포트: 9000 (Tailscale funnel :8443 또는 직접 노출)
# Docker Hub Webhook URL: http://<host>:9000/webhook
# =============================================================================
set -euo pipefail

PORT=9000
IMAGE="myeongjunkim0615/runnable:latest"
CONTAINER_NAME="runnable_app"
LOG="/tmp/runnable-webhook.log"

echo "==> Webhook listener 시작 (port ${PORT})"
echo "    Docker Hub Webhook URL에 http://<host>:${PORT}/webhook 등록"

while true; do
    # nc로 HTTP 요청 수신
    RESPONSE="HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\"}"
    REQUEST=$(echo -e "$RESPONSE" | nc -l -p $PORT 2>/dev/null || echo -e "$RESPONSE" | nc -l $PORT 2>/dev/null)

    # POST 요청인지 확인
    if echo "$REQUEST" | grep -q "POST"; then
        echo "[$(date)] Webhook 수신 — rolling update 시작" | tee -a "$LOG"

        # 1. 새 이미지 pull
        echo "  → docker pull ${IMAGE}" | tee -a "$LOG"
        docker pull "$IMAGE" 2>&1 | tee -a "$LOG"

        # 2. 기존 컨테이너 정보 보존
        OLD_ID=$(docker ps -q -f name="$CONTAINER_NAME" 2>/dev/null || true)

        # 3. 새 컨테이너 시작
        echo "  → 새 컨테이너 시작" | tee -a "$LOG"
        docker run -d --name "${CONTAINER_NAME}_new" \
            -p 3001:3000 \
            -e USE_DATABASE_MODE=POSTGRES \
            -e DATABASE_URL=postgres://root:root1234@host.docker.internal:6432/runnable \
            -e BETTER_AUTH_SECRET=runnable-better-auth-secret \
            -e BETTER_AUTH_URL=https://macmini.tail070e2e.ts.net \
            -e BETTER_AUTH_TRUSTED_ORIGINS=https://macmini.tail070e2e.ts.net,http://localhost:3000 \
            -e ADMIN_SEED_PASSWORD=admin1234 \
            -e ROUTE_MODE=TMAP \
            -e NODE_ENV=production \
            -e TZ=Asia/Seoul \
            "$IMAGE" 2>&1 | tee -a "$LOG"

        # 4. 헬스체크 (새 컨테이너가 3001에서 응답하는지)
        sleep 5
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 --max-time 10 2>/dev/null || echo "000")

        if [ "$HTTP_CODE" = "200" ]; then
            echo "  → 새 컨테이너 정상 (HTTP ${HTTP_CODE})" | tee -a "$LOG"

            # 5. 기존 컨테이너 종료
            if [ -n "$OLD_ID" ]; then
                docker stop "$CONTAINER_NAME" 2>/dev/null || true
                docker rm "$CONTAINER_NAME" 2>/dev/null || true
            fi

            # 6. 새 컨테이너를 3000 포트로 전환
            docker stop "${CONTAINER_NAME}_new" 2>/dev/null
            docker rm "${CONTAINER_NAME}_new" 2>/dev/null

            docker run -d --name "$CONTAINER_NAME" --restart unless-stopped \
                -p 3000:3000 \
                -e USE_DATABASE_MODE=POSTGRES \
                -e DATABASE_URL=postgres://root:root1234@host.docker.internal:6432/runnable \
                -e BETTER_AUTH_SECRET=runnable-better-auth-secret \
                -e BETTER_AUTH_URL=https://macmini.tail070e2e.ts.net \
                -e BETTER_AUTH_TRUSTED_ORIGINS=https://macmini.tail070e2e.ts.net,http://localhost:3000 \
                -e ADMIN_SEED_PASSWORD=admin1234 \
                -e ROUTE_MODE=TMAP \
                -e NODE_ENV=production \
                -e TZ=Asia/Seoul \
                "$IMAGE" 2>&1 | tee -a "$LOG"

            sleep 3
            FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 10 2>/dev/null || echo "000")
            echo "  → Rolling update 완료 (HTTP ${FINAL_CODE})" | tee -a "$LOG"
        else
            echo "  → 새 컨테이너 실패 (HTTP ${HTTP_CODE}), 롤백" | tee -a "$LOG"
            docker stop "${CONTAINER_NAME}_new" 2>/dev/null || true
            docker rm "${CONTAINER_NAME}_new" 2>/dev/null || true
        fi
    fi
done
