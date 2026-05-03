#!/usr/bin/env bash
set -euo pipefail

# --- port-forward 관리 스크립트 ---
# Jenkins 빌드 종료 후에도 지속되는 port-forward를 관리합니다.
# PID 파일로 프로세스를 추적하여 중복 실행을 방지합니다.
#
# 사용법:
#   bash minikube/scripts/portforward.sh start   # 시작 (기존 프로세스 교체)
#   bash minikube/scripts/portforward.sh stop    # 중지
#   bash minikube/scripts/portforward.sh status  # 상태 확인

LOCAL_PORT="${LOCAL_PORT:-3333}"
PID_FILE="/tmp/runnable-portforward.pid"
LOG_FILE="/tmp/runnable-portforward.log"

start() {
    stop 2>/dev/null || true

    echo "==> port-forward 시작 (localhost:${LOCAL_PORT} → svc/runnable-app:3000)"
    nohup kubectl port-forward -n runnable svc/runnable-app "${LOCAL_PORT}:3000" \
        --address=127.0.0.1 > "$LOG_FILE" 2>&1 &
    local pid=$!
    disown "$pid" 2>/dev/null || true
    echo "$pid" > "$PID_FILE"

    # 프로세스 생존 확인 (최대 5초)
    for i in 1 2 3 4 5; do
        sleep 1
        if ! kill -0 "$pid" 2>/dev/null; then
            echo "ERROR: port-forward 프로세스가 즉시 종료됨. 로그:"
            cat "$LOG_FILE"
            return 1
        fi
        # 포트 응답 확인
        if curl -s -o /dev/null -w '' "http://localhost:${LOCAL_PORT}" --max-time 1 2>/dev/null; then
            echo "    OK — PID ${pid}, localhost:${LOCAL_PORT}"
            return 0
        fi
    done

    echo "    PID ${pid} 실행 중이나 아직 응답 없음 (Pod 기동 대기 중일 수 있음)"
}

stop() {
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            echo "==> port-forward 중지 (PID ${pid})"
        fi
        rm -f "$PID_FILE"
    fi
    # 혹시 남아있는 프로세스도 정리
    lsof -ti:"${LOCAL_PORT}" 2>/dev/null | xargs kill -9 2>/dev/null || true
}

status() {
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            local code
            code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${LOCAL_PORT}" --max-time 3 2>/dev/null || echo "000")
            echo "RUNNING — PID ${pid}, HTTP ${code}"
            return 0
        fi
    fi
    echo "STOPPED"
    return 1
}

case "${1:-start}" in
    start)  start ;;
    stop)   stop ;;
    status) status ;;
    *)      echo "Usage: $0 {start|stop|status}"; exit 1 ;;
esac
