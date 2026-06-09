#!/usr/bin/env bash
# app 이미지 재빌드 + 컨테이너 무중단 교체 (rolling update).
# "테스트 성공 시에만 신규 이미지로 교체" 원칙 — 호출 측(Jenkins)이 게이트를 보장한다.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_env.sh"

echo "==> app 이미지 재빌드"
compose build app

echo "==> app 컨테이너 교체 (db 등 의존 서비스는 유지)"
compose up -d --no-deps app

echo "==> dangling 이미지 정리"
docker image prune -f
