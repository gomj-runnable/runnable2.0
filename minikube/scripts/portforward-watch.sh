#!/usr/bin/env bash
# --- port-forward 감시 스크립트 ---
# LaunchAgent에서 실행되며, port-forward가 끊기면 자동 재시작합니다.
# minikube/Pod가 준비될 때까지 대기 후 port-forward를 시작합니다.
#
# LaunchAgent(KeepAlive=true)가 이 스크립트를 관리하므로,
# 스크립트가 종료되면 자동으로 재실행됩니다.

LOCAL_PORT="${LOCAL_PORT:-3333}"
NAMESPACE="runnable"
SERVICE="svc/runnable-app"
TARGET_PORT="3000"
CHECK_INTERVAL=10

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# minikube + Pod Ready 대기
wait_ready() {
    log "minikube 및 Pod 준비 대기..."
    while true; do
        if minikube status &>/dev/null &&
           kubectl -n "$NAMESPACE" get pods 2>/dev/null | grep -q Running; then
            log "minikube + Pod 준비 완료"
            return 0
        fi
        sleep "$CHECK_INTERVAL"
    done
}

# port-forward 실행 (blocking — 연결이 끊기면 반환)
run_forward() {
    log "port-forward 시작 (localhost:${LOCAL_PORT} → ${SERVICE}:${TARGET_PORT})"
    kubectl port-forward -n "$NAMESPACE" "$SERVICE" "${LOCAL_PORT}:${TARGET_PORT}" \
        --address=127.0.0.1 2>&1
    log "port-forward 종료 (exit=$?)"
}

# --- 메인 루프 ---
wait_ready
while true; do
    run_forward
    log "5초 후 재시작..."
    sleep 5
    wait_ready
done
