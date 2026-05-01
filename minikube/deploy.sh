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

echo "==> Docker 이미지 빌드 (app)"
docker build -t runnable-app:latest -f "$SCRIPT_DIR/Dockerfile" "$PROJECT_ROOT"

echo "==> Docker 이미지 빌드 (migrate)"
docker build -t runnable-migrate:latest -f "$SCRIPT_DIR/Dockerfile.migrate" "$PROJECT_ROOT"

echo "==> Kubernetes 리소스 배포"
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/config/secret.${ENV}.yaml"
kubectl apply -f "$K8S_DIR/config/configmap.${ENV}.yaml"
kubectl apply -f "$K8S_DIR/postgres.yaml"

echo "==> PostgreSQL 준비 대기"
kubectl -n runnable rollout status deployment/postgres --timeout=120s

kubectl apply -f "$K8S_DIR/app.yaml"

echo "==> App 배포 대기"
kubectl -n runnable rollout status deployment/runnable-app --timeout=180s

echo ""
echo "==> 배포 완료!"
echo "    App 접속: http://$(minikube ip):30000"
