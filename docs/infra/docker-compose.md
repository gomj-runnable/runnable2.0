# docker-compose 운영

Runnable 앱을 단일 호스트 docker-compose 로 운영하는 가이드. minikube/k8s 흐름을 대체한다.

## 사전 요구

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 또는 임의의 docker daemon (compose v2 포함)
- 루트에 `.env.prod` (템플릿은 `.env.prod.example`)

## 형상

```
docker-compose.yml
├─ db        PostGIS 17 — named volume runnable_db_prod_data
├─ app       Nuxt .output 컨테이너 — 외부 3333 → 컨테이너 3000
├─ migrate   drizzle-kit push + seed (profile: migrate, 일회성)
└─ jenkins   CI/CD — jenkins_home(external) + /var/run/docker.sock 마운트
```

네트워크: `runnable_net` (bridge) — 모든 서비스 같은 네트워크.

## 명령

```bash
# 운영 기동
docker compose --env-file .env.prod up -d db app jenkins

# 마이그레이션 (필요할 때만)
docker compose --env-file .env.prod --profile migrate run --rm migrate

# 상태/로그
docker compose ps
docker compose logs -f app

# 갱신 (Jenkins 가 자동 수행 — 수동 시)
docker compose --env-file .env.prod build app
docker compose --env-file .env.prod up -d --no-deps app

# 종료
docker compose down
```

## Jenkins 파이프라인

`Jenkinsfile` 단계:

1. `Install` — pnpm install
2. `Lint`
3. `Typecheck`
4. `Test` — **TDD 게이트**. 실패 시 배포 중단
5. `Build` — `pnpm build` → `.output`
6. `DockerCheck` — docker daemon 확인
7. `Migrate` — `compose --profile migrate run --rm migrate`
8. `Deploy` — `compose build app` → `compose up -d --no-deps app`
9. `Smoke` — `runnable_app_prod` healthcheck 대기 + `curl localhost:3333` 200 확인

## 외부 공개 (Tailscale Funnel)

`app:3333` 외부 포트는 minikube 시점과 동일. Funnel 설정 변경 불필요.

```bash
sudo tailscale funnel --bg --https=443 http://localhost:3333
```

## 데이터 백업/복원

```bash
# 백업
docker compose exec db pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > backup.dump

# 복원
docker compose exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backup.dump
```

## 트러블슈팅

| 증상                             | 원인                   | 조치                                                                            |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| `db` healthcheck 실패            | PGDATA 권한/볼륨 손상  | `docker volume rm runnable_db_prod_data` 후 `migrate` 재실행 (데이터 손실 주의) |
| `app` 컨테이너 즉시 종료         | `.output` 빌드 누락    | 호스트에서 `pnpm build` 후 재배포                                               |
| Jenkins 가 `docker` 명령 못 찾음 | docker CLI 마운트 누락 | compose 정의에 `/opt/homebrew/bin/docker:/usr/local/bin/docker:ro` 확인         |
| port 3333 점유                   | 이전 LaunchAgent 잔존  | `launchctl unload ~/Library/LaunchAgents/com.runnable.portforward.plist`        |

## 이전 (minikube → compose)

자세한 이주 이력은 `git log` 의 `chore: migrate to docker-compose` 시점 참고. PostGIS 데이터는 `pg_dump → pg_restore` 로 일회성 이주.
