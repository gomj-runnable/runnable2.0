<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# server

## Purpose
Nitro 기반 백엔드. 러닝 경로 CRUD API, 사용자 인증, 서울 행정경계, 날씨 데이터 서비스를 제공한다.
프론트엔드에서 직접 외부 서비스에 접근하기보다 서버 경유 경계를 우선한다.

## Key Files
| File | Description |
|------|-------------|
| `utils/db.ts` | Drizzle ORM + pg.Pool 연결 (DATABASE_URL) |
| `utils/auth.ts` | better-auth 설정 및 초기화 |
| `utils/error.ts` | 공통 에러 처리 유틸 |
| `database/schema.ts` | Drizzle 테이블 정의 진입점 |
| `database/seed.ts` | DB 시드 데이터 (`pnpm seed`) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `api/auth/` | better-auth catch-all 핸들러 |
| `api/boundary/` | 서울 행정경계 GeoJSON API |
| `api/routes/` | 러닝 경로 CRUD — list, create, sections |
| `api/weather/` | 날씨 데이터 API (관측+예보 병합) |
| `database/schema/` | Drizzle 테이블 스키마 (users) |
| `repositories/` | 데이터 접근 계층 (Repository 패턴) |
| `utils/weather/` | 날씨 서비스 내부 모듈 |

## For AI Agents

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...all]` | * | better-auth 인증 (로그인, 회원가입 등) |
| `/api/boundary/seoul` | GET | 서울 행정경계 GeoJSON |
| `/api/routes` | GET | 저장된 경로 목록 조회 |
| `/api/routes` | POST | 경로 + 구간 생성 (Zod 검증) |
| `/api/routes/:routeId/sections` | GET | 특정 경로의 구간 목록 |
| `/api/weather/:date` | GET | 특정 날짜 날씨 데이터 (관측+예보 병합) |

### Repository Pattern
- `route.repository.ts` — 인터페이스/계약 정의
- `route.repository.memory.ts` — 인메모리 구현 (개발/프로토타입)
- 향후 PostgreSQL 구현체로 교체 가능 (같은 인터페이스)

### Weather Service Architecture
```
기상청 관측 API → observed.adapter.ts ─┐
                                        ├→ merge.service.ts → weather.service.ts → API response
기상청 예보 API → forecast.adapter.ts ─┘
```
- `common.ts`: 공유 타입·상수
- `observed.adapter.ts`: 관측 데이터 파싱·변환
- `forecast.adapter.ts`: 예보 데이터 파싱·변환
- `merge.service.ts`: 관측+예보 병합 로직
- `weather.service.ts`: 서비스 진입점 (런타임 config에서 API 키 사용)

### Working In This Directory
- `server/api/`는 기능 엔드포인트, `server/routes/`는 프록시·정적 핸들러
- Drizzle 테이블 추가 시 `database/schema/`에 파일 생성 후 `database/schema.ts`에서 re-export
- 외부 API 키는 `runtimeConfig`로 관리 (WEATHER_KOR, OPEN_DATA)
- 새 API 추가 시 입력 검증에 Zod 스키마 사용 (`shared/schemas/`)
- Repository 인터페이스 변경 시 모든 구현체 동기화 필수

### Testing Requirements
- `pnpm typecheck` 통과
- API 엔드포인트는 요청/응답 스키마 기반 검증

## Dependencies

### Internal
- `shared/types/` — 도메인 타입
- `shared/schemas/` — Zod 검증 스키마
- `shared/constants/` — 상수

### External
- Drizzle ORM + pg — PostgreSQL 접근
- better-auth — 인증
- Zod — 런타임 검증
- Nitro — 서버 런타임

<!-- MANUAL: -->
