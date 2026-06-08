#!/usr/bin/env bash
# =============================================================================
# scrub-secrets-history.sh — git history 에서 평문 시크릿 파일 제거 (#173)
#
# 대상 파일 (과거 커밋에만 존재, 현재 워킹트리·master 에는 없음):
#   - minikube/k8s/config/secret.prod.yaml
#   - minikube/k8s/config/secret.dev.yaml
#
# 노출 경로(2026-06-08 점검 기준):
#   master 본문에는 없음. origin/refactor/facilities-geom-eav 스테일 브랜치를
#   통해서만 도달 가능 (커밋 226452b / 8f49682 / 3bbace7).
#
# ─────────────────────────────────────────────────────────────────────────────
# ⚠️  전제: 이 스크립트는 "노출 흔적 제거"만 한다. 자격증명 무효화가 아니다.
#     공개 레포에 한 번 push 된 시크릿은 이미 유출된 것으로 간주해야 한다.
#     → BETTER_AUTH_SECRET / GITHUB_TOKEN / POSTGRES_PASSWORD / TMAP_API /
#       WEBHOOK_SECRET / ADMIN_SEED_PASSWORD / 기상청·공공데이터 키 전부
#       반드시 로테이트(재발급)할 것. (#173 1단계)
# ─────────────────────────────────────────────────────────────────────────────
#
# 두 가지 제거 경로:
#
#   [경로 A — 권장, 가장 단순] 스테일 브랜치 삭제
#     시크릿은 refactor/facilities-geom-eav 에만 있으므로, 이 브랜치를 지우면
#     origin 에서 시크릿 커밋으로의 ref 경로가 사라진다. master rewrite 불필요.
#       git push origin --delete refactor/facilities-geom-eav
#     단, 이 브랜치는 폐기된 minikube/k8s 작업 38개 고유 커밋을 포함하므로
#     "이 히스토리를 영구 폐기해도 되는지" 사람이 판단한 뒤 실행할 것.
#
#   [경로 B — 전체 rewrite] 모든 ref 에서 파일 자체를 제거
#     브랜치를 보존하면서 시크릿 파일만 모든 히스토리에서 도려낸다.
#     이 스크립트가 수행하는 것이 경로 B 다.
#
# 실행:
#   bash scripts/security/scrub-secrets-history.sh           # 로컬 rewrite + 검증까지만 (안전)
#   CONFIRM_PUSH=yes bash scripts/security/scrub-secrets-history.sh   # rewrite 후 origin force-push 까지
#
# 협업자: rewrite 후 전원 fresh clone 필요. 기존 클론은 폐기.
# =============================================================================

set -euo pipefail

REPO_URL="https://github.com/gomj-runnable/runnable2.0.git"   # 이전된 신규 위치
WORKDIR="$(mktemp -d -t runnable-scrub-XXXXXX)"
MIRROR="${WORKDIR}/mirror.git"
PATHS=(
    "minikube/k8s/config/secret.prod.yaml"
    "minikube/k8s/config/secret.dev.yaml"
)

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

# ── 0. 사전 점검 ──
command -v git-filter-repo >/dev/null 2>&1 || {
    red "git-filter-repo 미설치. 설치: brew install git-filter-repo (또는 pip install git-filter-repo)"
    exit 1
}

bold "==> #173 git history 시크릿 제거 (경로 B: 전체 rewrite)"
echo "    대상 파일:"
for p in "${PATHS[@]}"; do echo "      - $p"; done
echo "    작업 디렉터리: ${WORKDIR}"
echo ""
red   "⚠️  진행 전 확인: 노출된 자격증명을 모두 로테이트했는가?"
red   "    안 했다면 지금 중단하고 #173 1단계(로테이트)부터 끝내라."
read -r -p "    로테이트 완료했고 계속하려면 'rotated' 입력: " ACK
[ "$ACK" = "rotated" ] || { echo "중단."; rm -rf "$WORKDIR"; exit 1; }

# ── 1. mirror 클론 (모든 ref 포함) ──
bold "==> 1) mirror 클론 (백업 겸 작업본)"
git clone --mirror "$REPO_URL" "$MIRROR"
cp -r "$MIRROR" "${WORKDIR}/mirror-backup.git"
green "    백업: ${WORKDIR}/mirror-backup.git (rewrite 실패 시 복구용)"

# ── 2. 시크릿 파일 도려내기 ──
bold "==> 2) filter-repo 로 시크릿 파일 전체 히스토리 제거"
FILTER_ARGS=()
for p in "${PATHS[@]}"; do FILTER_ARGS+=(--path "$p"); done
git -C "$MIRROR" filter-repo --force --invert-paths "${FILTER_ARGS[@]}"

# ── 3. 검증: 시크릿이 정말 사라졌는지 ──
bold "==> 3) 검증 — 어떤 ref 에서도 시크릿 파일이 안 잡혀야 정상"
LEFT=0
for p in "${PATHS[@]}"; do
    if git -C "$MIRROR" log --all --oneline -- "$p" 2>/dev/null | grep -q .; then
        red "    ❌ 여전히 존재: $p"
        LEFT=1
    fi
done
if [ "$LEFT" -ne 0 ]; then
    red "rewrite 검증 실패 — push 하지 않음. 백업으로 복구하라."
    exit 1
fi
green "    ✅ 모든 ref 에서 시크릿 파일 제거 확인"

# ── 4. force-push (게이트) ──
if [ "${CONFIRM_PUSH:-no}" = "yes" ]; then
    bold "==> 4) origin 으로 force-push (--mirror)"
    red "    되돌릴 수 없다. 협업자 전원 fresh clone 필요."
    read -r -p "    정말 push 하려면 'force-push' 입력: " PUSHACK
    [ "$PUSHACK" = "force-push" ] || { echo "push 취소."; exit 1; }
    git -C "$MIRROR" remote set-url origin "$REPO_URL"
    git -C "$MIRROR" push --mirror --force
    green "    ✅ force-push 완료. GitHub 캐시/PR diff 의 잔여 blob 은"
    green "       GitHub Support 에 cache purge 요청으로 마무리."
else
    bold "==> 4) force-push 건너뜀 (CONFIRM_PUSH 미설정)"
    echo "    로컬 rewrite + 검증까지 완료. 실제 반영하려면:"
    echo "      CONFIRM_PUSH=yes bash scripts/security/scrub-secrets-history.sh"
    echo "    rewrite 결과 확인: ${MIRROR}"
fi

echo ""
green "끝. 작업 디렉터리: ${WORKDIR} (확인 후 수동 삭제)"
