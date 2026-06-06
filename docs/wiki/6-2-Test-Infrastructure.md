# 6.2 테스트 인프라

현재 Runnable 2.0의 테스트 인프라 현황입니다.

## 도구

| 도구                       | 버전   | 용도                              |
| -------------------------- | ------ | --------------------------------- |
| Vitest                     | 4.1.5  | 유닛 테스트 러너                  |
| @nuxt/test-utils           | 4.0.3  | Nuxt 컴포저블 테스트 헬퍼         |
| Playwright                 | 1.60.0 | E2E 테스트                        |
| @testcontainers/postgresql | latest | DB 통합 테스트용 PostGIS 컨테이너 |

## 설정 파일

### vitest.config.ts

- `globals: true` — `describe`, `it`, `expect` 전역 사용
- `environment: 'node'` — Node 환경 (DOM 필요 시 개별 파일에서 override)
- `globalSetup: ['server/test/globalSetup.ts']` — Testcontainers PostGIS 컨테이너 부트스트랩
- `setupFiles: ['server/test/setup.ts']` — Nuxt 런타임 스텁
- `fileParallelism: false` — 단일 컨테이너 공유를 위한 순차 실행
- 테스트 대상 경로: `app/**`, `server/**`, `shared/**` + Nuxt layers

### server/test/globalSetup.ts

Testcontainers 기반 PostGIS 컨테이너(`imresamu/postgis:17-3.5-alpine`)를 부트스트랩하고, 연결 URI를 `provide('databaseUrl')`로 전달합니다. 테스트 시작/종료 시 컨테이너 생성/정리를 처리합니다. (관련 헬퍼: `server/test/pgContainer.ts`)

### server/test/setup.ts

Nuxt 런타임의 `useState` 를 Vue 의 `ref` 로 **스텁** 처리합니다. 컴포저블 테스트 시 Nuxt 컨텍스트 없이도 동작하도록 만드는 역할입니다.

### playwright.config.ts

- `testDir: 'tests/e2e'`
- 30초 timeout, CI 환경에서 2회 재시도
- `webServer`: `pnpm dev` 자동 기동 후 테스트

## 디렉터리 규약

```
{대상 디렉터리}/
  ├─ 구현.ts
  └─ __tests__/
     └─ 구현.test.ts
```

20개 이상의 `__tests__/` 디렉터리가 이 규약을 따르고 있습니다 (총 ≈4,710 줄 테스트 코드).

## 테스트 종류별 위치

| 종류      | 패턴        | 위치 예시                                 |
| --------- | ----------- | ----------------------------------------- |
| 유닛      | `*.test.ts` | `server/services/__tests__/*.test.ts`     |
| 통합 (DB) | `*.test.ts` | `server/repositories/__tests__/*.test.ts` |
| E2E       | `*.spec.ts` | `tests/e2e/*.spec.ts`                     |

## 실행 명령

```bash
pnpm test             # CI 모드 — 한 번 돌고 종료
pnpm test:watch       # 변경 감지 — 개발 중
pnpm test:e2e         # Playwright E2E
pnpm test:e2e:update  # E2E 스냅샷 갱신
```

## 테스트 실행 요구사항

- **Docker 데몬 필수** — Testcontainers가 PostGIS 컨테이너를 기동합니다.
    - 로컬: colima 또는 Docker Desktop 실행
    - CI (Jenkins): docker.sock 마운트 필수
- 테스트는 순차 실행(`fileParallelism: false`)으로 단일 컨테이너를 공유합니다.

## 현 시점의 한계

- Vue 컴포넌트 자체 테스트는 미적용 (composable / model 위주로 단위 분리)
- E2E 테스트 디렉터리(`tests/e2e/`)는 비어 있어 단계적으로 추가 필요

다음 → [6-3-Test-Writing-Guide](6-3-Test-Writing-Guide)
