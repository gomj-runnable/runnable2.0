# prod/compose 패키지

Runnable 운영용 docker-compose 형상. minikube/k8s 흐름을 대체.

운영 코드는 `prod/` 아래에서 역할별로 분리한다.

- `prod/compose/` — docker-compose 형상(서비스 정의 / Dockerfile / jenkins 이미지)
- `prod/deploy/` — 배포 단계 스크립트(`migrate.sh` / `deploy.sh` / `smoke.sh`). Jenkinsfile 이 호출.

## 구조

```
prod/
├── compose/
│   ├── docker-compose.yml   # 서비스 정의 (db / app / migrate / jenkins)
│   ├── Dockerfile           # app 런타임 (Nuxt .output)
│   ├── Dockerfile.migrate   # drizzle-kit push + seed (일회성)
│   ├── jenkins/             # JCasC 커스텀 Jenkins 이미지
│   └── README.md
└── deploy/
    ├── _env.sh              # 공통: 루트 경로 + compose() 래퍼
    ├── migrate.sh           # db up + drizzle push + seed
    ├── deploy.sh            # app 재빌드 + 무중단 교체 + prune
    └── smoke.sh             # 헬스체크 + HTTP 200 확인

(프로젝트 루트)
├── .env.prod               # 운영 시크릿 (gitignored)
└── .env.prod.example       # 시크릿 템플릿
```

빌드 컨텍스트는 항상 **프로젝트 루트** (`../..`).
운영 env(`.env.prod`)도 **프로젝트 루트**에서 읽는다 (`--env-file .env.prod`, compose 정의의 `env_file: ../../.env.prod`).

## 실행

프로젝트 루트에서:

```bash
# 기동
docker compose -f prod/compose/docker-compose.yml --env-file .env.prod up -d

# 마이그레이션 (필요 시)
docker compose -f prod/compose/docker-compose.yml --env-file .env.prod --profile migrate run --rm migrate

# 상태/로그
docker compose -f prod/compose/docker-compose.yml ps
docker compose -f prod/compose/docker-compose.yml logs -f app

# 종료
docker compose -f prod/compose/docker-compose.yml down
```

`prod/compose/` 디렉토리에서 직접 실행도 가능:

```bash
cd prod/compose
docker compose --env-file ../../.env.prod up -d
```

## 서비스

| 서비스    | 이미지 / 빌드                          | 포트                | 비고                           |
| --------- | -------------------------------------- | ------------------- | ------------------------------ |
| `db`      | imresamu/postgis:17-3.5-alpine         | 127.0.0.1:5433→5432 | 볼륨 `runnable_db_prod_data`   |
| `app`     | build: prod/compose/Dockerfile         | **3333→3000**       | Tailscale Funnel 진입점        |
| `migrate` | build: prod/compose/Dockerfile.migrate | —                   | profile=migrate, 일회성        |
| `jenkins` | build: ./jenkins (JCasC)               | 8080, 50000         | docker.sock 마운트 + 보안 재현 |

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
docker compose -f prod/compose/docker-compose.yml exec db \
  pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > backup.dump

# 복원
docker compose -f prod/compose/docker-compose.yml exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backup.dump
```

## CI/CD 흐름

`Jenkinsfile` (프로젝트 루트). 트리거: **master push (githubPush)** / 수동.

1. `Install` — pnpm install
2. `Lint`
3. `Typecheck`
4. `Test` — **TDD 게이트** (실패 시 abort)
5. `Build` — `pnpm build` → `.output`
6. `DockerCheck` — docker daemon 확인
7. `Migrate` — `bash prod/deploy/migrate.sh`
8. `Deploy` — `bash prod/deploy/deploy.sh` (app 재빌드 → 무중단 교체)
9. `Smoke` — `bash prod/deploy/smoke.sh` (healthcheck + `curl localhost:3333` 200)

배포 단계 로직은 `prod/deploy/*.sh` 에 분리돼 있어 Jenkins 외부에서 수동 실행도 동일하게 가능하다.

```bash
bash prod/deploy/migrate.sh
bash prod/deploy/deploy.sh
bash prod/deploy/smoke.sh
```

## Jenkins 보안 (JCasC) — #181

컨테이너 재생성 시 보안 설정 유실을 막기 위해 `prod/compose/jenkins/` 의 JCasC 로
보안 realm·권한·CSRF 를 이미지에 박는다.

- `prod/compose/jenkins/Dockerfile` — lts + plugins + casc 설정
- `prod/compose/jenkins/plugins.txt` — configuration-as-code 등 필수 플러그인
- `prod/compose/jenkins/jenkins.casc.yaml` — 로컬 사용자 realm + 익명읽기 차단 + CRUMB

적용에 필요한 `.env.prod` 변수:

```bash
JENKINS_ADMIN_ID=admin
JENKINS_ADMIN_PASSWORD=<강력한 비밀번호>
```

적용 (기존 `jenkins_home` 볼륨 유지된 채 보안만 재구성):

```bash
docker compose -f prod/compose/docker-compose.yml --env-file .env.prod \
  up -d --build jenkins
```

> 이후 `http://localhost:8080` 은 로그인 필수가 되고 익명 접근이 차단된다.
> 관리자 비밀번호 변경은 `.env.prod` 수정 후 `up -d --build jenkins` 재실행.

## 트러블슈팅

| 증상                          | 원인                   | 조치                                                                           |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `db` healthcheck 실패         | PGDATA 권한/볼륨 손상  | `docker volume rm runnable_db_prod_data` + `migrate` 재실행 (데이터 손실 주의) |
| `app` 즉시 종료               | `.output` 빌드 누락    | 호스트에서 `pnpm build` 후 재배포                                              |
| Jenkins 에서 `docker` 못 찾음 | docker CLI 마운트 누락 | compose 정의에 `/opt/homebrew/bin/docker:/usr/local/bin/docker:ro` 확인        |
| port 3333 점유                | 옛 LaunchAgent 잔존    | `launchctl unload ~/Library/LaunchAgents/com.runnable.portforward.plist`       |
| Tailscale Funnel 502          | app 컨테이너 다운      | `docker compose -f prod/compose/docker-compose.yml ps` 확인                    |
