# 공통 헬퍼 — prod/deploy/*.sh 가 source 한다.
# 프로젝트 루트 위치와 compose 호출 래퍼를 한 곳에서 정의한다.
# (실행 위치와 무관하게 BASH_SOURCE 기준으로 루트를 잡는다.)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT/prod/compose/docker-compose.yml"
# .env.prod 는 gitignored 라 Jenkins 워크스페이스(clone)에는 없다.
# CI 에서는 호스트 마운트 경로를 ENV_FILE 로 주입한다 (compose jenkins 서비스 참조).
ENV_FILE="${ENV_FILE:-$ROOT/.env.prod}"

compose() {
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}
