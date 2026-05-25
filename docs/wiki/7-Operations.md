# 7. Operations

배포 · 운영 환경.

## 7.1 환경 / 포트

| 환경                             | 포트 | 용도                   |
| -------------------------------- | ---- | ---------------------- |
| 개발 (`pnpm dev`)                | 3001 | 핫 리로딩, 빠른 피드백 |
| 프로덕션 프리뷰 (`pnpm preview`) | 3000 | 빌드 후 산출물 확인    |

## 7.2 인프라 구성

```mermaid
flowchart LR
    Dev["로컬 호스트<br/>(pnpm build · preview)"] -. Tailscale .-> User
    Jen[Jenkins CI/CD] --> Compose[docker-compose]
    Compose --> App[app 컨테이너<br/>:3333 → :3000]
    Compose --> PG[(PostGIS<br/>db 컨테이너)]
    App --> PG
```

| 컴포넌트           | 역할                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| **docker-compose** | 단일 호스트 운영 형상 — `docker-compose.yml` (db + app + jenkins + migrate)  |
| **Jenkins**        | CI/CD — `Jenkinsfile` (Install → Lint → Typecheck → Test → Build → Deploy)   |
| **Tailscale**      | 외부 노출 — 로컬 포트를 HTTPS 로 인터넷 공개 (관련 스킬: `tailscale-funnel`) |
| **PostGIS**        | 운영 DB (개발은 PGlite 인메모리도 가능)                                      |

## 7.3 Docker / 빌드 정책

**중요** — 빌드는 반드시 **호스트(macOS)** 에서 실행하세요.

> Docker Linux 컨테이너 안에서 `pnpm build` 를 돌리면 Vue 번들이 깨지는 케이스가 확인됨. 호스트에서 빌드한 산출물만 Docker 에 복사하는 방식으로 운용합니다.

## 7.4 환경 변수 / 시드

| 명령                         | 용도            |
| ---------------------------- | --------------- |
| `pnpm install`               | 의존성 설치     |
| `pnpm seed`                  | DB 시드 (개발)  |
| `pnpm dev`                   | 개발 서버       |
| `pnpm build && pnpm preview` | 프로덕션 프리뷰 |

환경 변수 상세는 `nuxt.config.ts` + 로컬 `.env` 참고.

## 7.5 관련 문서

- `docs/infra/docker-compose.md` — docker-compose 운영 + Jenkins CI/CD 흐름
- `docs/local-setup.md` — 로컬 셋업
- `docs/infra/` — 인프라 디테일
- 스킬 `tailscale-funnel` — 외부 노출 설정
