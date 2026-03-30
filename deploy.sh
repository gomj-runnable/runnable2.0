#!/usr/bin/env bash
# =============================================================================
# deploy.sh — 영복교회 웹사이트 운영 배포 스크립트
#
# 사용법:
#   ./deploy.sh              # 전체 배포 (기본)
#   ./deploy.sh --no-cache   # Docker 캐시 없이 풀 빌드
#   ./deploy.sh --rollback   # 이전 이미지로 롤백
#
# 사전 준비:
#   1. 서버에 Docker + Docker Compose v2 설치
#   2. .env 파일 생성 (.env.production.example 참고)
#   3. SSL 인증서 준비 (Let's Encrypt 권장)
# =============================================================================

set -euo pipefail

# --- 동시 배포 방지 ---
LOCK_FILE="/tmp/yb_church_deploy.lock"
exec 200>"$LOCK_FILE"
flock -n 200 || { echo "❌ 다른 배포가 진행 중입니다."; exit 1; }

# --- 색상 출력 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
error()   { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; exit 1; }
section() { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════${NC}"; }

# --- 옵션 파싱 ---
NO_CACHE=""
ROLLBACK=false

for arg in "$@"; do
  case $arg in
    --no-cache) NO_CACHE="--no-cache" ;;
    --rollback) ROLLBACK=true ;;
  esac
done

# --- 기본 설정 ---
COMPOSE_FILE="docker-compose.yml"
APP_SERVICE="app"
IMAGE_NAME="yb-church-app"
BACKUP_DIR="./backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# --- .env 안전하게 읽기 (source 대신 grep 기반) ---
load_env_var() {
  local key="$1"
  local val
  val=$(grep -E "^${key}=" .env | head -1 | cut -d'=' -f2-)
  # 앞뒤 따옴표 제거
  val="${val#\"}"
  val="${val%\"}"
  val="${val#\'}"
  val="${val%\'}"
  echo "$val"
}

# =============================================================================
# 롤백 모드
# =============================================================================
if [ "$ROLLBACK" = true ]; then
  section "롤백 실행"

  if ! docker image inspect "${IMAGE_NAME}:previous" &>/dev/null; then
    error "롤백할 이전 이미지(${IMAGE_NAME}:previous)가 없습니다."
  fi

  warn "현재 app 컨테이너를 이전 이미지로 교체합니다..."
  docker compose -f "$COMPOSE_FILE" stop "$APP_SERVICE"
  docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:rollback_${TIMESTAMP}" 2>/dev/null || true
  docker tag "${IMAGE_NAME}:previous" "${IMAGE_NAME}:latest"
  docker compose -f "$COMPOSE_FILE" up -d "$APP_SERVICE"

  log "롤백 완료!"
  exit 0
fi

# =============================================================================
# 사전 검사
# =============================================================================
section "사전 검사"

# Docker 실행 확인
docker info &>/dev/null || error "Docker가 실행 중이지 않습니다."
log "Docker 실행 중"

# Docker Compose v2 확인
docker compose version &>/dev/null || error "Docker Compose v2가 필요합니다. 'docker compose' (하이픈 없음) 명령 확인."
log "Docker Compose v2 확인"

# docker-compose.yml 존재 확인
if [ ! -f "$COMPOSE_FILE" ]; then
  error "${COMPOSE_FILE} 파일이 없습니다."
fi
log "Compose 파일 확인"

# .env 파일 확인
if [ ! -f ".env" ]; then
  error ".env 파일이 없습니다. .env.production.example을 참고해서 .env를 생성하세요."
fi
log ".env 파일 확인"

# 필수 환경변수 확인 (안전한 방식)
POSTGRES_USER=$(load_env_var "POSTGRES_USER")
POSTGRES_PASSWORD=$(load_env_var "POSTGRES_PASSWORD")
POSTGRES_DB=$(load_env_var "POSTGRES_DB")

[ -z "$POSTGRES_USER" ]     && error ".env에 POSTGRES_USER가 없습니다."
[ -z "$POSTGRES_PASSWORD" ] && error ".env에 POSTGRES_PASSWORD가 없습니다."
[ -z "$POSTGRES_DB" ]       && error ".env에 POSTGRES_DB가 없습니다."
log "필수 환경변수 확인"

# =============================================================================
# DB 백업 (기존 컨테이너가 실행 중인 경우)
# =============================================================================
section "데이터베이스 백업"

if docker compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "running"; then
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/yb_church_db_${TIMESTAMP}.sql.gz"

  warn "DB 백업 시작..."
  docker compose -f "$COMPOSE_FILE" exec -T db pg_dump \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    | gzip > "$BACKUP_FILE"

  # 백업 무결성 확인
  if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "DB 백업 완료: $BACKUP_FILE ($BACKUP_SIZE)"
  else
    rm -f "$BACKUP_FILE"
    error "DB 백업 파일 손상 — 배포를 중단합니다."
  fi

  # 7일 이상 된 백업 삭제
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
  log "오래된 백업 정리 완료 (7일 초과분 삭제)"
else
  warn "DB 컨테이너가 실행 중이 아니어서 백업을 건너뜁니다."
fi

# =============================================================================
# 이전 이미지 태그 보존 (롤백용)
# =============================================================================
section "이미지 빌드 준비"

# docker compose images에서 실제 이미지명 확인 후 태깅
CURRENT_IMAGE=$(docker compose -f "$COMPOSE_FILE" images "$APP_SERVICE" --format json 2>/dev/null \
  | grep -o '"Image":"[^"]*"' | head -1 | cut -d'"' -f4) || true

if [ -n "$CURRENT_IMAGE" ] && docker image inspect "$CURRENT_IMAGE" &>/dev/null 2>&1; then
  docker tag "$CURRENT_IMAGE" "${IMAGE_NAME}:previous" 2>/dev/null || true
  log "이전 이미지를 '${IMAGE_NAME}:previous' 태그로 보존"
else
  warn "보존할 이전 이미지가 없습니다 (최초 배포)."
fi

# =============================================================================
# Docker 이미지 빌드
# =============================================================================
section "이미지 빌드"

log "빌드 시작... (시간이 걸릴 수 있습니다)"
docker compose -f "$COMPOSE_FILE" build $NO_CACHE "$APP_SERVICE"
log "이미지 빌드 완료"

# =============================================================================
# DB 컨테이너 먼저 기동 (신규 배포 시)
# =============================================================================
section "서비스 시작"

log "DB 컨테이너 기동..."
docker compose -f "$COMPOSE_FILE" up -d db

log "DB 헬스체크 대기 중..."
RETRIES=30
until docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    error "DB 헬스체크 실패 (타임아웃). 로그 확인: docker compose logs db"
  fi
  sleep 2
done
log "DB 준비 완료"

# =============================================================================
# Drizzle 스키마 마이그레이션
# (Nuxt .output에는 drizzle-kit이 포함되지 않으므로 소스 기반 임시 컨테이너 사용)
# =============================================================================
section "DB 스키마 동기화"

warn "drizzle-kit push 실행 중..."
docker run --rm \
  --network yb_church_network \
  -e DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}" \
  -v "$(pwd)":/workspace \
  -w /workspace \
  node:24-alpine \
  sh -c "
    corepack enable &&
    corepack prepare pnpm@latest --activate &&
    pnpm install --frozen-lockfile --ignore-scripts &&
    pnpm drizzle-kit push --force
  "

# 마이그레이션 실패 시 배포 중단
if [ $? -ne 0 ]; then
  error "스키마 동기화 실패 — 배포를 중단합니다. 수동 실행: pnpm drizzle-kit push"
fi
log "스키마 동기화 완료"

# =============================================================================
# App + Nginx 기동
# =============================================================================
section "앱 배포"

log "App 컨테이너 재시작..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate "$APP_SERVICE"

log "App 헬스체크 대기 중..."
RETRIES=20
until docker compose -f "$COMPOSE_FILE" ps "$APP_SERVICE" | grep -q "healthy\|running"; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    warn "App 헬스체크 타임아웃. 로그를 확인하세요: docker compose logs $APP_SERVICE"
    break
  fi
  sleep 3
done

# --- Smoke test: 최종 접속 확인 ---
log "최종 접속 확인 중..."
sleep 3
SMOKE_RETRIES=5
SMOKE_OK=false
while [ $SMOKE_RETRIES -gt 0 ]; do
  if curl -sf --max-time 5 http://localhost:3000/ > /dev/null 2>&1; then
    SMOKE_OK=true
    break
  fi
  SMOKE_RETRIES=$((SMOKE_RETRIES - 1))
  sleep 2
done

if [ "$SMOKE_OK" = true ]; then
  log "서비스 정상 응답 확인"
else
  warn "서비스 응답 없음 — 로그를 확인하세요: docker compose logs app nginx"
fi

# =============================================================================
# 사용하지 않는 이미지 정리
# =============================================================================
section "정리"

# 댕글링 이미지 (태그 없는 이미지) 삭제
docker image prune -f
# 빌드 캐시 2GB 초과분 삭제 (25GB NVMe 기준)
docker builder prune -f --keep-storage 2gb
log "이미지 및 빌드 캐시 정리 완료"

# =============================================================================
# 최종 상태 출력
# =============================================================================
section "배포 완료 ✨"

docker compose -f "$COMPOSE_FILE" ps

echo ""
log "배포가 완료되었습니다!"
echo -e "${YELLOW}  📋 로그 확인: docker compose logs -f app${NC}"
echo -e "${YELLOW}  🗄️  DB 확인:   docker compose exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}${NC}"
echo -e "${YELLOW}  🔄 롤백:       ./deploy.sh --rollback${NC}"
