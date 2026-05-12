#!/usr/bin/env bash
# --- Colima + Minikube 통합 시작 스크립트 ---
# 재부팅 시 LaunchAgent에서 실행됩니다.
# 1) Colima(Docker) 시작
# 2) Minikube 시작

set -euo pipefail

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/mjkim"

# 1) Colima 시작
if colima status &>/dev/null; then
    log "Colima 이미 실행 중"
else
    log "Colima 시작 중..."
    colima start 2>&1
    log "Colima 시작 완료"
fi

# Docker 소켓 대기 (최대 60초)
WAIT=0
while ! docker info &>/dev/null; do
    if [ $WAIT -ge 60 ]; then
        log "ERROR: Docker 소켓 대기 타임아웃 (60초)"
        exit 1
    fi
    sleep 2
    WAIT=$((WAIT + 2))
done
log "Docker 준비 완료"

# 2) Minikube 시작
if minikube status &>/dev/null; then
    log "Minikube 이미 실행 중"
else
    log "Minikube 시작 중..."
    minikube start --driver=docker 2>&1
    log "Minikube 시작 완료"
fi

log "모든 서비스 시작 완료"
