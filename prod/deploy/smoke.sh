#!/usr/bin/env bash
# 배포 후 헬스체크 + HTTP 200 확인. 실패 시 app 로그를 남기고 비정상 종료.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_env.sh"

echo "==> 헬스체크 대기 (최대 60초)"
for i in $(seq 1 12); do
    STATUS=$(docker inspect -f '{{.State.Health.Status}}' runnable_app_prod 2>/dev/null || echo "starting")
    echo "    [$i/12] app health: $STATUS"
    if [ "$STATUS" = "healthy" ]; then break; fi
    sleep 5
done

# 호스트 수동 실행은 호스트 포트(:3333), CI(jenkins 컨테이너)는 같은 docker 네트워크의 app(:3000)
SMOKE_URL="${SMOKE_URL:-http://localhost:3333}"
echo "==> HTTP 200 확인 ($SMOKE_URL)"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$SMOKE_URL" --max-time 10 || echo "000")
if [ "$HTTP" != "200" ]; then
    echo "ERROR: smoke 실패 (HTTP $HTTP)"
    compose logs --tail=50 app
    exit 1
fi
echo "    OK (HTTP $HTTP)"
