# 11. Claude Code Guide

Claude Code(및 신규 개발자)가 이 저장소에서 **바로 작업에 착수**하기 위한 단일 진입 인덱스입니다. "X 를 하려면 → Y 파일/스킬" 매핑 위주로 정리합니다. 더 깊은 설명이 필요하면 각 섹션 하단의 위키 링크를 따라가세요.

## 11.1 프로젝트 한눈에

**Runnable 2.0** — Cesium 기반 러닝 경로 제작·탐색 서비스 (Nuxt 모노리포).

| 영역   | 스택                                                       |
| ------ | ---------------------------------------------------------- |
| 프론트 | Nuxt 4, Vue 3, Cesium (3D 지도/공간 시각화), FSD 변형 구조 |
| 백엔드 | Nitro Server Routes (H3), Drizzle ORM, PostgreSQL/PostGIS  |
| 인증   | better-auth (세션 쿠키 기반)                               |
| 검증   | Zod (`shared/schemas/`)                                    |
| 테스트 | Vitest + @testcontainers/postgresql, Playwright (E2E)      |
| 패키지 | pnpm `10.28.2`, Node 20                                    |

### 핵심 디렉터리

```
app/                  # 프론트엔드 (FSD)
├─ pages/             # Nuxt 라우팅 진입점
├─ widgets/           # 화면 단위 + Facade 오케스트레이션 (map-shell)
├─ features/          # 기능 단위 (draw-route, explore, camera, ...) 11종
├─ entities/          # 도메인 단위 (route, user, facility, ...)
└─ shared/            # ui / lib / model (lib/map = Cesium 유틸)
server/               # 백엔드 (Nitro)
├─ api/               # HTTP 핸들러 (50+) — 얇게 유지
├─ services/          # 비즈니스 로직 (순수 함수 우선)
├─ repositories/      # 데이터 접근 (interface + Drizzle 구현)
├─ database/          # schema / migrations / seed
├─ http/             # 라우트 래퍼 (commonApiHandler, withAuth, withAdmin)
├─ errors/            # 4xx/5xx 헬퍼
└─ security/auth/     # better-auth 인스턴스
shared/               # 프론트·백 공유 (types / schemas / constants / data)
tests/e2e/            # Playwright E2E
```

> 더 보기 → [2-Architecture](2-Architecture), [4-Server](4-Server), [5-Frontend](5-Frontend)

## 11.2 "무엇을 어디에" 배치 규칙

신규 코드를 어디에 둘지 판단하는 표. 의존 방향은 항상 **하향 단방향**(상위가 하위를 import)입니다.

| 만들려는 것                           | 위치                                            | 파일명 패턴                         | 참고 스킬                     |
| ------------------------------------- | ----------------------------------------------- | ----------------------------------- | ----------------------------- | ------------------------- |
| 양쪽에서 쓰는 도메인 타입/스키마      | `shared/types`, `shared/schemas`, `shared/data` | `*.ts`, `*.schema.ts`               | `create-domain-type`          |
| HTTP 엔드포인트 (CRUD)                | `server/api/<리소스>/`                          | `index.get.ts`, `[id]/index.put.ts` | `create-server-crud`          |
| 데이터 접근 로직                      | `server/repositories/`                          | `*.repository.ts`                   | `create-server-crud`          |
| 비즈니스 규칙(계산·변환)              | `server/services/`                              | `*.service.ts`                      | —                             |
| 외부 API 연동 (V-World/공공데이터 등) | 해당 feature/entity `lib/`                      | Response Class + Local 분리         | `create-api-service`          |
| 프론트 공유 상태(store)               | `entities                                       | features/\*/model/`                 | `use*Store.ts`                | `create-store-composable` |
| Cesium 레이어/토글(부수효과)          | `features/*/api/`                               | `use*Sideeffect.ts`                 | `create-map-layer-sideeffect` |
| 지도 위 부유 UI(칩/패널/컨트롤)       | `widgets                                        | features/\*/ui/`                    | `<Name>.vue` (#overlay 슬롯)  | `create-map-overlay`      |
| 여러 feature 조합(진입점)             | `widgets/map-shell/model/`                      | `use*Facade.ts`                     | —                             |
| 경로 컨텍스트 연동 오버레이 가시성    | `widgets/map-shell/model/`                      | `useOverlayContext.ts` 등           | `sync-overlay-visibility`     |
| 단위 테스트                           | `**/__tests__/`                                 | `<name>.test.ts`                    | —                             |

### Import / Path Alias 규칙

- `~/` = `app/` (절대경로만 사용)
- `#shared/` = `shared/` (타입·스키마 전용)
- 상대경로(`./`)는 **같은 모듈 내부에서만**
- 하향식(downward) import 금지: `entities → features` 같은 역방향 X
- feature 간 교차 의존 금지 — widget facade 계층에서 조합

> 결정 트리 상세 → [2-Architecture](2-Architecture) 2.4

## 11.3 자주 하는 작업별 절차

각 작업은 **"무엇을 만든다 → 어떤 파일/스킬 → 검증"** 흐름입니다. 매핑된 스킬이 있으면 먼저 Skill 을 호출하세요.

### A. 새 도메인 타입 추가

1. `create-domain-type` 스킬 호출
2. `shared/types/<도메인>.ts` (Base / DraftInput / Saved 계층), `shared/schemas/<도메인>.schema.ts` (Zod), `shared/data/` 샘플 동시 생성
3. 검증: `pnpm typecheck`

### B. 서버 CRUD 엔드포인트 추가

1. `create-server-crud` 스킬 호출
2. 생성물: `server/api/<리소스>/` 핸들러 4종 + `server/repositories/<리소스>.repository.ts` (interface + Drizzle) + 팩토리(`index.ts`) 등록
3. 핸들러는 얇게 — `commonApiHandler` / `withAuth` / `withAdmin` 래퍼로 감싸고 로직은 service/repository 에 위임
4. 검증: `__tests__/` 에 PostGIS 통합 테스트 작성 → `pnpm test`

### C. Cesium 지도 레이어/토글 추가

1. `create-map-layer-sideeffect` 스킬 호출
2. `features/<feature>/model/use*Store.ts` (표시 여부 상태) + `features/<feature>/api/use*Sideeffect.ts` (watch → Entity add/remove/clear)
3. Options DI + Init/Destroy 패턴 준수
4. widget facade(`useMapLayersFacade` 등)에서 조합

### D. 지도 위 오버레이 UI 추가

1. `create-map-overlay` 스킬 호출
2. `*/ui/<Name>.vue` 를 `MapShell` 의 `#overlay` 슬롯에 배치, z-index 티어(`app.config.ts`) 준수
3. 경로 선택/그리기 컨텍스트에 따라 표시·숨김이 필요하면 → `sync-overlay-visibility` 스킬 (`MapOverlayContextEnum` 기반 일괄 동기화)

### E. 프론트 공유 상태(store) 추가

1. `create-store-composable` 스킬 호출
2. `*/model/use*Store.ts` — `useState` + `computed` + mutation 함수 3단 구조 (토글 / 데이터 / EnumBase 중 택1)
3. UI 는 store 값만 바인딩, Cesium 조작은 sideeffect 에서 watch 로 반응

### F. 외부 API 연동

1. `create-api-service` 스킬 호출
2. 원본 Response Class ↔ 추상화된 Local Response 분리, `service.requestByXxx()` 패턴
3. 호출부 외 모든 로직은 Local Response 기준

### G. 여러 feature 를 한 화면에서 조합

- 페이지는 `widgets/map-shell/model/useRouteMapFacade()` **하나만** import
- 신규 조합은 sub-facade(`use*Facade.ts`)를 추가하고 진입 facade 에서 묶음

> Frontend composable 책임 분리 상세 → [5-Frontend](5-Frontend)

## 11.4 명령어

```bash
pnpm dev          # 개발 서버 (http://localhost:3000)
pnpm build        # 프로덕션 빌드 (.output)
pnpm seed         # DB 시드 (tsx server/database/seed.ts)

pnpm test         # vitest run (유닛·통합, PostGIS testcontainer 사용)
pnpm test:watch   # vitest watch
pnpm test:cov     # 커버리지 (v8)
pnpm test:e2e     # Playwright E2E

pnpm lint         # eslint app/ server/ shared/
pnpm lint:fix     # eslint --fix
pnpm typecheck    # nuxt typecheck
pnpm format       # prettier --write .
```

> 테스트 인프라 상세 → [6-2-Test-Infrastructure](6-2-Test-Infrastructure), [6-3-Test-Writing-Guide](6-3-Test-Writing-Guide)

## 11.5 품질 게이트 (커밋 전 필수)

Jenkins 운영 파이프라인은 **`pnpm test` 실패 시 배포를 중단**합니다. 커밋 전 로컬에서 게이트를 흉내 내세요.

```bash
pnpm lint:fix && pnpm typecheck && pnpm test && pnpm build
```

| 단계          | 게이트                                                                                |
| ------------- | ------------------------------------------------------------------------------------- |
| pre-commit    | `lint-staged`(eslint --fix / prettier) + `gitleaks` 시크릿 검사 (`.husky/pre-commit`) |
| CI (Actions)  | lint → typecheck → build → e2e (수동 트리거)                                          |
| Jenkins(운영) | Install → Lint → Typecheck → **Test(게이트)** → Build → Migrate → Deploy → Smoke      |

체크리스트:

- [ ] `pnpm lint:fix` 통과 (커밋 전 eslint --fix 필수 — CI 실패 방지)
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과 (새 로직은 `__tests__/` 테스트 동반)
- [ ] 시크릿 평문 없음 (BETTER_AUTH_SECRET, API 키, DB 접속 문자열 등 — gitleaks 가 차단)

> 상세 → [6-4-CI-Gate](6-4-CI-Gate), [8-Contribution](8-Contribution)

## 11.6 Drizzle 마이그레이션 — 수기 작성 주의

> **`drizzle-kit generate` 를 쓰지 않습니다.** 자동 생성은 파괴적 `DROP` 을 만들 수 있어, 마이그레이션 SQL 과 저널을 **손으로** 작성합니다.

규칙:

- 스키마 변경: `server/database/schema/*.ts` 수정
- 마이그레이션: `server/database/migrations/NNNN_<설명>.sql` 을 직접 작성하고 저널(메타)도 손으로 갱신
- 번호는 기존 마지막 파일 다음 순번(예: 마지막이 `0009_postgis_geom_normalize.sql` 이면 `0010_*`)

### 지공간 처리 패턴 ("facilities 패턴")

비공간 컬럼은 Drizzle ORM 으로, geometry 컬럼은 raw SQL(PostGIS)로 분리 관리합니다.

```sql
-- 비공간 (Drizzle insert)
INSERT INTO route_sections (section_id, route_id, attrs) VALUES ($1, $2, $3)

-- 공간 (raw SQL)
UPDATE route_sections
SET geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
WHERE section_id = $2
```

이유: PGlite 미지원 함수 회피 + 스키마 불필요한 복잡화 방지.

> 도메인별 스키마 상세 → [3-Domain-Model](3-Domain-Model), [4-Server](4-Server)

## 11.7 관련 위키 페이지

| 주제                    | 페이지                                             |
| ----------------------- | -------------------------------------------------- |
| 전체 개요               | [1-Overview](1-Overview)                           |
| 아키텍처·배치 결정 트리 | [2-Architecture](2-Architecture)                   |
| 도메인 모델 카탈로그    | [3-Domain-Model](3-Domain-Model)                   |
| 서버 (API/Repo/Service) | [4-Server](4-Server)                               |
| 프론트엔드 (FSD)        | [5-Frontend](5-Frontend)                           |
| 테스트 & TDD            | [6-Testing-and-TDD](6-Testing-and-TDD)             |
| 테스트 인프라           | [6-2-Test-Infrastructure](6-2-Test-Infrastructure) |
| 테스트 작성 가이드      | [6-3-Test-Writing-Guide](6-3-Test-Writing-Guide)   |
| CI 게이트               | [6-4-CI-Gate](6-4-CI-Gate)                         |
| 운영·배포               | [7-Operations](7-Operations)                       |
| 기여(PR/커밋 규칙)      | [8-Contribution](8-Contribution)                   |
| 기능 매트릭스           | [9-Feature-Matrix](9-Feature-Matrix)               |
| 화면별 가이드           | [10-Screens](10-Screens)                           |
