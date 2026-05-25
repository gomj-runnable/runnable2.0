# compose 패키지

Runnable 운영용 docker-compose 형상. minikube/k8s 흐름을 대체.

## 구조

```
compose/
├── docker-compose.yml   # 서비스 정의 (db / app / migrate / jenkins)
├── Dockerfile           # app 런타임 (Nuxt .output)
├── Dockerfile.migrate   # drizzle-kit push + seed (일회성)
├── .env.prod            # 운영 시크릿 (gitignored)
├── .env.prod.example    # 시크릿 템플릿
└── README.md
```

빌드 컨텍스트는 항상 **프로젝트 루트** (`..`).

## 실행

프로젝트 루트에서:

```bash
# 기동
docker compose -f compose/docker-compose.yml --env-file compose/.env.prod up -d

# 마이그레이션 (필요 시)
docker compose -f compose/docker-compose.yml --env-file compose/.env.prod --profile migrate run --rm migrate

# 상태/로그
docker compose -f compose/docker-compose.yml ps
docker compose -f compose/docker-compose.yml logs -f app

# 종료
docker compose -f compose/docker-compose.yml down
```

`compose/` 디렉토리에서 직접 실행도 가능:

```bash
cd compose
docker compose --env-file .env.prod up -d
```

## 서비스

| 서비스    | 이미지 / 빌드                        | 포트                | 비고                         |
| --------- | ------------------------------------ | ------------------- | ---------------------------- |
| `db`      | imresamu/postgis:17-3.5-alpine       | 127.0.0.1:5433→5432 | 볼륨 `runnable_db_prod_data` |
| `app`     | build: ../compose/Dockerfile         | **3333→3000**       | Tailscale Funnel 진입점      |
| `migrate` | build: ../compose/Dockerfile.migrate | —                   | profile=migrate, 일회성      |
| `jenkins` | jenkins/jenkins:lts                  | 8080, 50000         | docker.sock 마운트           |

## 외부 노출 (Tailscale Funnel)

호스트의 Tailscale Funnel 이 이미 `localhost:3333` 으로 연결되어 있음:

```
https://<INTERNAL_HOST> → localhost:3333 → runnable_app_prod:3000
```

확인:

```bash
tailscale funnel status
```

## 데이터

```bash
# 백업
docker compose -f compose/docker-compose.yml exec db \
  pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > backup.dump

# 복원
docker compose -f compose/docker-compose.yml exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backup.dump
```

## CI/CD 흐름

`Jenkinsfile` (프로젝트 루트):

1. `Install` — pnpm install
2. `Lint`
3. `Typecheck`
4. `Test` — **TDD 게이트** (실패 시 abort)
5. `Build` — `pnpm build` → `.output`
6. `DockerCheck` — docker daemon 확인
7. `Migrate` — `compose --profile migrate run --rm migrate`
8. `Deploy` — `compose build app` → `compose up -d --no-deps app`
9. `Smoke` — runnable_app_prod healthcheck + `curl localhost:3333` 200 확인

## 트러블슈팅

| 증상                          | 원인                   | 조치                                                                           |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `db` healthcheck 실패         | PGDATA 권한/볼륨 손상  | `docker volume rm runnable_db_prod_data` + `migrate` 재실행 (데이터 손실 주의) |
| `app` 즉시 종료               | `.output` 빌드 누락    | 호스트에서 `pnpm build` 후 재배포                                              |
| Jenkins 에서 `docker` 못 찾음 | docker CLI 마운트 누락 | compose 정의에 `/opt/homebrew/bin/docker:/usr/local/bin/docker:ro` 확인        |
| port 3333 점유                | 옛 LaunchAgent 잔존    | `launchctl unload ~/Library/LaunchAgents/com.runnable.portforward.plist`       |
| Tailscale Funnel 502          | app 컨테이너 다운      | `docker compose -f compose/docker-compose.yml ps` 확인                         |
