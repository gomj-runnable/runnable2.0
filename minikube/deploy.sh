#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-prod}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "사용법: bash deploy.sh [dev|prod]  (기본값: prod)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$SCRIPT_DIR/k8s"

echo "==> 환경: $ENV"

echo "==> minikube 상태 확인"
minikube status || minikube start

echo "==> 호스트에서 Nuxt 빌드"
cd "$PROJECT_ROOT"
pnpm build

echo "==> minikube Docker 환경 설정"
eval $(minikube docker-env)

echo "==> Docker 이미지 빌드 (호스트 빌드 결과 복사)"
docker build --no-cache -t runnable-app:latest -f "$SCRIPT_DIR/Dockerfile" "$PROJECT_ROOT"

echo "==> Migrate 이미지 빌드"
docker build -t runnable-migrate:latest -f "$SCRIPT_DIR/Dockerfile.migrate" "$PROJECT_ROOT"

echo "==> Kubernetes 리소스 배포"
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/config/secret.${ENV}.yaml"
kubectl apply -f "$K8S_DIR/config/configmap.${ENV}.yaml"
kubectl apply -f "$K8S_DIR/postgres.yaml"

echo "==> PostgreSQL 준비 대기"
kubectl -n runnable rollout status deployment/postgres --timeout=120s

echo "==> DB 마이그레이션 실행"
kubectl delete job runnable-migrate -n runnable --ignore-not-found
kubectl apply -f "$K8S_DIR/migration-job.yaml"
kubectl wait --for=condition=complete job/runnable-migrate -n runnable --timeout=120s

kubectl apply -f "$K8S_DIR/app.yaml"

echo "==> App Pod 강제 재시작 (새 이미지 반영)"
kubectl -n runnable rollout restart deployment/runnable-app

echo "==> App 배포 대기"
kubectl -n runnable rollout status deployment/runnable-app --timeout=180s

echo "==> 기존 port-forward 정리"
pkill -f "kubectl port-forward.*runnable" 2>/dev/null || true
sleep 1

echo "==> port-forward 시작 (localhost:3000 → Pod:3000)"
nohup kubectl port-forward -n runnable svc/runnable-app 3000:3000 --address=0.0.0.0 > /tmp/port-forward.log 2>&1 &
sleep 3

echo "==> 서비스 응답 확인"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 10 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "    경고: 서비스 응답 코드 ${HTTP_CODE}"
  kubectl -n runnable logs deployment/runnable-app --tail=10
  exit 1
fi
echo "    OK (HTTP ${HTTP_CODE})"

# --- Tailscale Funnel 연결 (운영 환경만) ---
if [[ "$ENV" == "prod" ]] && command -v tailscale &> /dev/null; then
  echo ""
  echo "==> Tailscale Funnel 연결"
  sudo tailscale funnel --https=443 off 2>/dev/null || true
  sudo tailscale funnel --bg --https=443 http://localhost:3000
  echo "==> 외부 접속 URL:"
  tailscale funnel status 2>/dev/null | grep "https://" | head -1
fi

echo ""
echo "==> 배포 완료!"
echo "    운영서버: http://localhost:3000"
echo "    외부접속: https://macmini.tail070e2e.ts.net"
