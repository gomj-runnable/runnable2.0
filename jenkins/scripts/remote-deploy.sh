#!/usr/bin/env bash
# =============================================================================
# remote-deploy.sh — 원격 서버 롤링 업데이트 스크립트
#
# Jenkins Deploy 단계에서 원격 서버로 SCP 후 실행된다.
# 사용법: ./remote-deploy.sh <DOCKER_REPO> <BUILD_TAG> <DEPLOY_PATH>
#
# 동작:
#   1. 새 이미지 Pull
#   2. DB 마이그레이션 실행
#   3. App 컨테이너 롤링 교체 (다운타임 최소화)
#   4. 헬스체크 확인
#   5. 실패 시 자동 롤백
# =============================================================================

set -euo pipefail

DOCKER_REPO="${1:?'DOCKER_REPO 필요'}"
BUILD_TAG="${2:?'BUILD_TAG 필요'}"
DEPLOY_PATH="${3:?'DEPLOY_PATH 필요'}"

COMPOSE_FILE="${DEPLOY_PATH}/docker-compose.yml"
APP_SERVICE="app"
HEALTH_URL="http://localhost:3000/"
HEALTH_RETRIES=20
HEALTH_INTERVAL=3

# --- 색상 출력 ---
log()   { echo "[$(date '+%H:%M:%S')] [INFO]  $1"; }
warn()  { echo "[$(date '+%H:%M:%S')] [WARN]  $1"; }
error() { echo "[$(date '+%H:%M:%S')] [ERROR] $1"; exit 1; }

cd "$DEPLOY_PATH" || error "배포 경로로 이동 실패: ${DEPLOY_PATH}"

# =============================================================================
# 1. 새 이미지 Pull
# =============================================================================
log "새 이미지 Pull: ${DOCKER_REPO}:${BUILD_TAG}"
docker pull "${DOCKER_REPO}:${BUILD_TAG}"
docker pull "${DOCKER_REPO}:migrate-${BUILD_TAG}"

# 현재 실행 중인 app 이미지 ID 보존 (롤백용)
PREVIOUS_IMAGE=$(docker compose -f "$COMPOSE_FILE" images "$APP_SERVICE" --format json 2>/dev/null \
    | grep -o '"Image":"[^"]*"' | head -1 | cut -d'"' -f4) || true
log "이전 이미지: ${PREVIOUS_IMAGE:-없음}"

# latest 태그를 새 빌드로 교체
docker tag "${DOCKER_REPO}:${BUILD_TAG}" "${DOCKER_REPO}:latest"
docker tag "${DOCKER_REPO}:migrate-${BUILD_TAG}" "${DOCKER_REPO}:migrate"

# =============================================================================
# 2. DB 마이그레이션
# =============================================================================
log "DB 마이그레이션 실행..."
docker compose -f "$COMPOSE_FILE" up -d db
docker compose -f "$COMPOSE_FILE" run --rm migrate
log "DB 마이그레이션 완료"

# =============================================================================
# 3. App 컨테이너 롤링 교체
# =============================================================================
log "App 컨테이너 롤링 업데이트 시작..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate "$APP_SERVICE"

# =============================================================================
# 4. 헬스체크
# =============================================================================
log "헬스체크 대기 중... (최대 ${HEALTH_RETRIES}회)"
HEALTHY=false
for i in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -sf --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
        HEALTHY=true
        log "헬스체크 통과 (${i}/${HEALTH_RETRIES})"
        break
    fi
    warn "헬스체크 대기... (${i}/${HEALTH_RETRIES})"
    sleep "$HEALTH_INTERVAL"
done

# =============================================================================
# 5. 결과 처리 — 실패 시 롤백
# =============================================================================
if [ "$HEALTHY" = true ]; then
    log "배포 성공: ${DOCKER_REPO}:${BUILD_TAG}"

    # 댕글링 이미지 정리
    docker image prune -f > /dev/null 2>&1 || true
    exit 0
else
    warn "헬스체크 실패 — 롤백 시작"

    if [ -n "${PREVIOUS_IMAGE:-}" ]; then
        docker tag "$PREVIOUS_IMAGE" "${DOCKER_REPO}:latest" 2>/dev/null || true
        docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate "$APP_SERVICE"
        log "이전 이미지로 롤백 완료: ${PREVIOUS_IMAGE}"
    else
        warn "롤백할 이전 이미지 없음 — 수동 확인 필요"
    fi

    error "배포 실패: 헬스체크 통과하지 못함"
fi
