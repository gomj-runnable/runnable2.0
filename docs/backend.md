# Backend Architecture (Layered + Repository)

백엔드는 **Layered Architecture + Repository Pattern + Service Layer** 구조를 따른다.

---

## 계층 구조

```
┌─────────────────────────────────────────┐
│  API Handler  (server/api/)             │  HTTP 요청/응답, Zod 검증
├─────────────────────────────────────────┤
│  Service Layer  (server/utils/)         │  비즈니스 로직, 외부 API 호출
├─────────────────────────────────────────┤
│  Repository  (server/repositories/)     │  데이터 접근 추상화
├─────────────────────────────────────────┤
│  Database  (server/database/)           │  Drizzle ORM, PostgreSQL
└─────────────────────────────────────────┘
```

---

## 디렉터리 구조

```
server/
├── api/                    # API 핸들러 (파일 기반 라우팅)
│   ├── auth/               # 인증 (better-auth)
│   ├── boundary/           # 행정경계 GeoJSON
│   ├── district/           # 시군구 조회
│   ├── facilities/         # 시설물 CRUD
│   ├── routes/             # 경로 CRUD + 최적화 + 검색 + 피드백
│   └── weather/            # 날씨 API
│
├── database/
│   ├── schema/             # Drizzle 테이블 정의
│   ├── migrations/         # DB 마이그레이션
│   ├── schema.ts           # 스키마 진입점
│   └── seed.ts             # 시드 데이터
│
├── repositories/           # 데이터 접근 계층
│   ├── route.repository.ts         # 인터페이스 (IRouteRepository)
│   ├── route.repository.drizzle.ts # Drizzle 구현체 (PGlite·Postgres 공용)
│   └── index.ts                    # lazy 싱글턴 export

├── services/               # 도메인 서비스 Facade
│   ├── route.service.ts            # 경로 도메인 로직 (district lookup, fork dedupe)
│   ├── facility.service.ts         # 시설물 조회
│   └── routeInfo.service.ts        # 경로 피드백
│
├── middleware/
│   └── rate-limit.ts       # IP별 속도 제한 (경로별 차등)
│
└── utils/
    ├── auth.ts             # better-auth 설정
    ├── auth.service.ts     # better-auth 위 도메인 wrapper
    ├── error.ts            # 에러 헬퍼 (badRequest, notFound 등) + withExceptionHandler
    ├── session.ts          # requireSession / getSessionUser
    ├── dbMode.ts           # USE_DATABASE_MODE (PGLITE|POSTGRES) 플래그
    ├── district/           # 행정구역 경계 데이터 + 역지오코딩
    ├── routing/            # 경로 최적화
    │   ├── registry.ts     # 라우팅 서비스 레지스트리 (Strategy + Registry 패턴)
    │   ├── tmap.service.ts # TMap 보행자 라우팅
    │   ├── osrm.service.ts # OSRM 보행자 라우팅
    │   ├── common.ts       # RoutingService 인터페이스 + 공통 유틸
    │   └── index.ts        # Side-effect import (서비스 자동 등록)
    └── weather/            # 날씨 데이터 파이프라인
        ├── weather.service.ts   # 메인 서비스 (DI: observed + forecast + airquality)
        ├── observed.adapter.ts  # 관측 데이터 정규화
        ├── forecast.adapter.ts  # 예보 데이터 정규화
        ├── airquality.adapter.ts # 대기질 데이터
        ├── merge.service.ts     # 관측+예보 우선순위 병합
        └── common.ts           # 공통 타입/유틸
```

---

## 적용된 디자인 패턴

| 패턴             | 적용 위치                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| Repository       | `server/repositories/` — 인터페이스 + Drizzle 구현체 (PGlite·Postgres 공용)    |
| Facade (DB)      | `server/database/client.ts` — `getDb()` 단일 진입점 (PGLITE/POSTGRES 분기)     |
| Facade (Service) | `server/services/*.service.ts` — Repository 위 도메인 응집 계층                |
| Template Method  | `server/utils/routing/common.ts` — AbstractRoutingService (검증→API→파싱→보간) |
| Strategy         | `server/utils/routing/` — TMap/OSRM 교체 가능 (AbstractRoutingService 상속)    |
| Registry         | `server/utils/routing/registry.ts` — 전략 등록·조회                            |
| Adapter          | `server/utils/weather/` — 외부 API 응답 정규화                                 |
| Decorator        | `server/utils/error.ts` — withExceptionHandler 래퍼                            |

---

## 에러 처리

| 헬퍼                            | 상태 코드                              |
| ------------------------------- | -------------------------------------- |
| `badRequest()`                  | 400                                    |
| `unauthorized()`                | 401                                    |
| `forbidden()`                   | 403                                    |
| `notFound()`                    | 404                                    |
| `conflict()`                    | 409                                    |
| `internalError()`               | 500                                    |
| `withExceptionHandler(handler)` | H3 에러 전파, ZodError→400, 나머지→500 |

---

## 환경별 구현 교체

`DATABASE_MODE` 환경 변수로 제어:

| 모드       | DB 클라이언트                                                                   | 용도          |
| ---------- | ------------------------------------------------------------------------------- | ------------- |
| `PGLITE`   | PGlite (`@electric-sql/pglite`) — 파일 기반 임베디드 Postgres (`.data/pglite/`) | 개발 (기본값) |
| `POSTGRES` | `pg.Pool` + `drizzle-orm/node-postgres`                                         | 프로덕션      |

PGLITE 모드는 부팅 시 마이그레이션 자동 적용 + users 비어있으면 seed 자동 실행. PostGIS 의존 라인은 sanitizer 가 스킵하고 facility 의 거리 쿼리는 lat/lng + JS haversine 으로 폴백한다.
