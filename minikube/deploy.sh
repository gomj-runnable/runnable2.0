#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-dev}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "사용법: bash deploy.sh [dev|prod]  (기본값: dev)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$SCRIPT_DIR/k8s"

echo "==> 환경: $ENV"

echo "==> minikube 상태 확인"
minikube status || minikube start

echo "==> minikube Docker 환경 설정"
eval $(minikube docker-env)

echo "==> Docker 이미지 빌드 (app - 로컬 테스트용)"
docker build -t runnable-app:latest -f "$SCRIPT_DIR/Dockerfile" "$PROJECT_ROOT"

echo "==> Docker 이미지 빌드 (image-watcher)"
docker build -t image-watcher:latest -f "$SCRIPT_DIR/webhook/Dockerfile" "$SCRIPT_DIR/webhook"

echo "==> Kubernetes 리소스 배포"
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/config/secret.${ENV}.yaml"
kubectl apply -f "$K8S_DIR/config/configmap.${ENV}.yaml"
kubectl apply -f "$K8S_DIR/postgres.yaml"

# ghcr.io private 이미지 pull용 Secret 생성
GHCR_TOKEN=$(kubectl -n runnable get secret runnable-secret -o jsonpath='{.data.GHCR_TOKEN}' 2>/dev/null | base64 -d)
if [ -n "$GHCR_TOKEN" ]; then
  echo "==> ghcr.io imagePullSecret 생성"
  kubectl -n runnable delete secret ghcr-pull-secret --ignore-not-found
  kubectl -n runnable create secret docker-registry ghcr-pull-secret \
    --docker-server=ghcr.io \
    --docker-username=all4land-runnable \
    --docker-password="$GHCR_TOKEN"
fi

echo "==> PostgreSQL 준비 대기"
kubectl -n runnable rollout status deployment/postgres --timeout=120s

kubectl apply -f "$K8S_DIR/app.yaml"
kubectl apply -f "$K8S_DIR/webhook.yaml"

echo "==> App 배포 대기"
kubectl -n runnable rollout status deployment/runnable-app --timeout=180s

echo "==> Image Watcher 배포 대기"
kubectl -n runnable rollout status deployment/image-watcher --timeout=60s

echo ""
echo "==> 배포 완료!"
echo "    App 접속: http://$(minikube ip):30000"
echo ""
echo "==> Image Watcher 상태:"
echo "    ghcr.io/all4land-runnable/runnable2.0:latest 를 60초 간격으로 감시 중"
echo "    로그 확인: kubectl -n runnable logs -f deployment/image-watcher"
