#!/usr/bin/env bash
# DB 보장 + 마이그레이션 (drizzle push + seed). 일회성.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_env.sh"

echo "==> db 서비스 기동 (이미 떠있으면 noop)"
compose up -d db

echo "==> migrate 일회성 실행 (drizzle push + seed)"
compose --profile migrate run --rm --build migrate
