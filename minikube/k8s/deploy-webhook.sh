#!/usr/bin/env bash
# =============================================================================
# deploy-webhook.sh — GitHub Webhook으로 트리거되는 자동 배포 스크립트
#
# 실행 흐름:
#   1. Docker Hub에서 최신 이미지 pull
#   2. 마이그레이션 Job 재실행
#   3. App Deployment rolling restart
# =============================================================================

set -euo pipefail

NAMESPACE="runnable"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/opt/webhook/deploy.log"

log() { echo "[${TIMESTAMP}] $1" | tee -a "$LOG_FILE"; }

log "=== 배포 시작 ==="

# 1. 마이그레이션 Job 재실행 (기존 Job 삭제 후 재생성)
log "마이그레이션 실행..."
kubectl delete job runnable-migrate -n "$NAMESPACE" --ignore-not-found
kubectl apply -f /opt/webhook/k8s/migration-job.yaml

# 마이그레이션 완료 대기 (최대 120초)
if kubectl wait --for=condition=complete job/runnable-migrate -n "$NAMESPACE" --timeout=120s; then
  log "마이그레이션 완료"
else
  log "마이그레이션 실패 — 배포 중단"
  exit 1
fi

# 2. App 롤링 재시작 (최신 이미지 pull)
log "앱 롤링 재시작..."
kubectl rollout restart deployment/runnable-app -n "$NAMESPACE"

# 롤아웃 완료 대기
if kubectl rollout status deployment/runnable-app -n "$NAMESPACE" --timeout=120s; then
  log "배포 완료"
else
  log "롤아웃 실패"
  exit 1
fi

log "=== 배포 정상 완료 ==="
