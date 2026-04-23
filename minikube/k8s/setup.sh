#!/usr/bin/env bash
# =============================================================================
# setup.sh — 맥미니 Minikube + 자동 배포 원클릭 세팅
#
# 사용법:
#   chmod +x setup.sh && ./setup.sh
#
# 사전 준비:
#   1. Docker Desktop 설치
#   2. Minikube 설치: brew install minikube
#   3. kubectl 설치: brew install kubectl
#   4. Docker Hub 계정 (이미지 pull용)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${GREEN}[✓] $1${NC}"; }
warn()    { echo -e "${YELLOW}[!] $1${NC}"; }
error()   { echo -e "${RED}[✗] $1${NC}"; exit 1; }
section() { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEBHOOK_DIR="/opt/webhook"

# =============================================================================
# 1. 사전 검사
# =============================================================================
section "사전 검사"

command -v docker &>/dev/null || error "Docker가 설치되어 있지 않습니다: brew install --cask docker"
command -v minikube &>/dev/null || error "Minikube가 설치되어 있지 않습니다: brew install minikube"
command -v kubectl &>/dev/null || error "kubectl이 설치되어 있지 않습니다: brew install kubectl"
log "필수 도구 확인 완료"

# =============================================================================
# 2. Minikube 클러스터 시작 (8GB RAM 제한)
# =============================================================================
section "Minikube 클러스터"

if minikube status &>/dev/null; then
  warn "Minikube가 이미 실행 중입니다"
else
  log "Minikube 시작 (8GB RAM, 4 CPU)..."
  minikube start \
    --driver=docker \
    --memory=8192 \
    --cpus=4 \
    --disk-size=40g \
    --kubernetes-version=stable
  log "Minikube 시작 완료"
fi

# =============================================================================
# 3. Docker Hub 이미지 Pull Secret 생성
# =============================================================================
section "Docker Hub 인증"

kubectl get namespace runnable &>/dev/null 2>&1 || kubectl apply -f "$SCRIPT_DIR/namespace.yaml"

if kubectl get secret dockerhub-secret -n runnable &>/dev/null 2>&1; then
  warn "dockerhub-secret이 이미 존재합니다"
else
  echo ""
  echo "Docker Hub 인증 정보를 입력하세요 (이미지 pull용):"
  read -rp "  Docker Hub Username: " DOCKER_USER
  read -rsp "  Docker Hub Password/Token: " DOCKER_PASS
  echo ""

  kubectl create secret docker-registry dockerhub-secret \
    -n runnable \
    --docker-server=https://index.docker.io/v1/ \
    --docker-username="$DOCKER_USER" \
    --docker-password="$DOCKER_PASS"
  log "dockerhub-secret 생성 완료"
fi

# =============================================================================
# 4. K8s 매니페스트 적용
# =============================================================================
section "K8s 매니페스트 적용"

kubectl apply -f "$SCRIPT_DIR/namespace.yaml"
kubectl apply -f "$SCRIPT_DIR/configmap.yaml"
kubectl apply -f "$SCRIPT_DIR/secret.yaml"
kubectl apply -f "$SCRIPT_DIR/postgres.yaml"
log "PostgreSQL 배포 완료"

# DB 준비 대기
warn "PostgreSQL 준비 대기 중..."
kubectl wait --for=condition=ready pod -l app=postgres -n runnable --timeout=120s
log "PostgreSQL 준비 완료"

# 마이그레이션 실행
kubectl apply -f "$SCRIPT_DIR/migration-job.yaml"
warn "마이그레이션 실행 대기 중..."
kubectl wait --for=condition=complete job/runnable-migrate -n runnable --timeout=120s
log "마이그레이션 완료"

# App 배포
kubectl apply -f "$SCRIPT_DIR/app.yaml"
warn "App 배포 대기 중..."
kubectl wait --for=condition=ready pod -l app=runnable-app -n runnable --timeout=120s
log "App 배포 완료"

# =============================================================================
# 5. Webhook 자동 배포 서버 설치
# =============================================================================
section "Webhook 서버 설정"

# adnanh/webhook 설치
if command -v webhook &>/dev/null; then
  warn "webhook이 이미 설치되어 있습니다"
else
  log "webhook 설치 중..."
  brew install webhook
  log "webhook 설치 완료"
fi

# webhook 디렉터리 구성
sudo mkdir -p "$WEBHOOK_DIR/k8s"
sudo cp "$SCRIPT_DIR/hooks.json" "$WEBHOOK_DIR/hooks.json"
sudo cp "$SCRIPT_DIR/deploy-webhook.sh" "$WEBHOOK_DIR/deploy.sh"
sudo cp "$SCRIPT_DIR/migration-job.yaml" "$WEBHOOK_DIR/k8s/migration-job.yaml"
sudo chmod +x "$WEBHOOK_DIR/deploy.sh"

# WEBHOOK_SECRET을 hooks.json에 주입
WEBHOOK_SECRET=$(kubectl get secret runnable-secret -n runnable -o jsonpath='{.data.WEBHOOK_SECRET}' | base64 -d)
sudo sed -i '' "s/{{WEBHOOK_SECRET}}/$WEBHOOK_SECRET/g" "$WEBHOOK_DIR/hooks.json"
log "Webhook 설정 파일 배치 완료"

# =============================================================================
# 6. Webhook을 macOS LaunchDaemon으로 등록 (자동 시작)
# =============================================================================
section "Webhook LaunchDaemon 등록"

PLIST_PATH="$HOME/Library/LaunchAgents/com.runnable.webhook.plist"

cat > "$PLIST_PATH" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.runnable.webhook</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/webhook</string>
    <string>-hooks</string>
    <string>/opt/webhook/hooks.json</string>
    <string>-port</string>
    <string>9000</string>
    <string>-verbose</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/opt/webhook/webhook.log</string>
  <key>StandardErrorPath</key>
  <string>/opt/webhook/webhook-error.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
PLIST

# LaunchAgent 등록 및 시작
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
log "Webhook 서버 등록 완료 (포트 9000, 부팅 시 자동 시작)"

# =============================================================================
# 7. 최종 상태 출력
# =============================================================================
section "설정 완료"

echo ""
kubectl get all -n runnable
echo ""

APP_URL=$(minikube service runnable-app -n runnable --url 2>/dev/null || echo "http://$(minikube ip):30000")

log "모든 설정이 완료되었습니다!"
echo ""
echo -e "${YELLOW}  📱 앱 접속:     ${APP_URL}${NC}"
echo -e "${YELLOW}  🔗 Webhook:     http://localhost:9000/hooks/deploy-runnable${NC}"
echo -e "${YELLOW}  📋 앱 로그:     kubectl logs -f deployment/runnable-app -n runnable${NC}"
echo -e "${YELLOW}  🗄️  DB 접속:     kubectl exec -it deployment/postgres -n runnable -- psql -U root -d runnable${NC}"
echo -e "${YELLOW}  🔄 수동 배포:   kubectl rollout restart deployment/runnable-app -n runnable${NC}"
echo ""
echo -e "${BLUE}── GitHub Webhook 설정 ──${NC}"
echo -e "${YELLOW}  1. GitHub repo → Settings → Webhooks → Add webhook${NC}"
echo -e "${YELLOW}  2. Payload URL: http://<맥미니-공인IP>:9000/hooks/deploy-runnable${NC}"
echo -e "${YELLOW}  3. Content type: application/json${NC}"
echo -e "${YELLOW}  4. Secret: secret.yaml의 WEBHOOK_SECRET 값${NC}"
echo -e "${YELLOW}  5. Events: Workflow runs 선택${NC}"
echo ""
echo -e "${BLUE}── 외부 접근 (선택) ──${NC}"
echo -e "${YELLOW}  공유기 포트포워딩: 외부 9000 → 맥미니 내부 IP:9000${NC}"
echo -e "${YELLOW}  또는 Cloudflare Tunnel: cloudflared tunnel --url http://localhost:9000${NC}"
