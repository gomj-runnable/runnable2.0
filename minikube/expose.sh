#!/usr/bin/env bash
set -euo pipefail

# --- Runnable 외부 공개 스크립트 ---
# minikube 서비스를 Tailscale Funnel로 외부에 공개합니다.
# 사용법: bash minikube/expose.sh

LOCAL_PORT=31000  # minikube NodePort(30000)와 충돌 방지

echo "==> 1. 기존 포트포워드 정리"
lsof -ti:${LOCAL_PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "==> 2. minikube 상태 확인"
if ! minikube status &>/dev/null; then
  echo "    minikube가 꺼져 있습니다. 시작합니다..."
  colima status &>/dev/null || colima start
  minikube start
fi
eval $(minikube docker-env)

echo "==> 3. Pod 상태 확인"
kubectl -n runnable get pods
echo ""

echo "==> 4. Pod Ready 대기 (최대 60초)"
kubectl -n runnable wait --for=condition=Ready pod -l app=runnable-app --timeout=60s

echo "==> 5. kubectl port-forward 시작 (localhost:${LOCAL_PORT} → svc:3000)"
nohup kubectl port-forward -n runnable svc/runnable-app ${LOCAL_PORT}:3000 --address=127.0.0.1 > /tmp/runnable-portforward.log 2>&1 &
PF_PID=$!
sleep 3

# port-forward 성공 확인
if ! kill -0 $PF_PID 2>/dev/null; then
  echo "    port-forward 실패. 로그:"
  cat /tmp/runnable-portforward.log
  echo ""
  echo "    minikube IP로 직접 시도합니다..."
  MINIKUBE_IP=$(minikube ip)
  TARGET="http://${MINIKUBE_IP}:30000"
else
  TARGET="http://localhost:${LOCAL_PORT}"
fi

echo "==> 6. 서비스 응답 확인: ${TARGET}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${TARGET}" --max-time 10 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "    경고: 서비스 응답 코드 ${HTTP_CODE} (200이 아님)"
  echo "    Pod 로그 확인:"
  kubectl -n runnable logs deployment/runnable-app --tail=10
  exit 1
fi
echo "    OK (HTTP ${HTTP_CODE})"

echo "==> 7. Tailscale Funnel 연결"
if ! command -v tailscale &>/dev/null; then
  echo "    tailscale CLI가 없습니다. brew install tailscale 로 설치하세요."
  exit 1
fi

sudo tailscale funnel --https=443 off 2>/dev/null || true
sudo tailscale funnel --bg --https=443 "${TARGET}"

echo ""
echo "==> 완료! 외부 접속 URL:"
tailscale funnel status 2>/dev/null | grep "https://" | head -1
echo ""
echo "    port-forward PID: ${PF_PID:-없음}"
echo "    종료하려면: sudo tailscale funnel --https=443 off && kill ${PF_PID:-0} 2>/dev/null"
