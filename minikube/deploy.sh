#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$SCRIPT_DIR/k8s"

echo "==> minikube 상태 확인"
minikube status || minikube start

echo "==> minikube Docker 환경 설정"
eval $(minikube docker-env)

echo "==> Docker 이미지 빌드"
docker build -t runnable-app:latest -f "$SCRIPT_DIR/Dockerfile" "$PROJECT_ROOT"

echo "==> Kubernetes 리소스 배포"
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/secret.yaml"
kubectl apply -f "$K8S_DIR/configmap.yaml"
kubectl apply -f "$K8S_DIR/postgres.yaml"

echo "==> PostgreSQL 준비 대기"
kubectl -n runnable rollout status deployment/postgres --timeout=120s

kubectl apply -f "$K8S_DIR/app.yaml"

echo "==> App 배포 대기"
kubectl -n runnable rollout status deployment/runnable-app --timeout=180s

echo ""
echo "==> 배포 완료!"
echo "    접속: minikube service runnable-app -n runnable"
echo "    또는: http://$(minikube ip):30000"
