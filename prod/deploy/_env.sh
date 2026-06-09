# 공통 헬퍼 — prod/deploy/*.sh 가 source 한다.
# 프로젝트 루트 위치와 compose 호출 래퍼를 한 곳에서 정의한다.
# (실행 위치와 무관하게 BASH_SOURCE 기준으로 루트를 잡는다.)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT/prod/compose/docker-compose.yml"
ENV_FILE="$ROOT/.env.prod"

compose() {
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}
