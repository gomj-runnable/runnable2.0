---
name: runnable-architecture
description: This skill should be used when the user asks to "러닝 경로 서비스 구조를 정리", "Runnable 아키텍처에 맞게 수정", "front-end와 back-end 패키지 규칙에 맞춰 작업", "README나 CLAUDE 문서를 프로젝트 구조에 맞게 갱신"해야 할 때. 구조 경계와 디렉터리 책임을 빠르게 판별하는 기준으로 쓴다.
---

# Runnable Architecture

> 작업 원칙·패키지 구조·composable 분리 규칙은 `CLAUDE.md`를 기준으로 한다. 이 스킬은 **판단이 모호할 때의 추가 기준**만 둔다.

## 디렉터리 빠른 판단표 (FSD)

| 변경 대상 | 위치 |
|-----------|------|
| 페이지 조합 | `app/pages/` |
| 도메인 엔티티 | `app/entities/{entity}/` (api, lib, model, ui) |
| 사용자 기능 | `app/features/{feature}/` (api, lib, model, ui) |
| 복합 위젯 | `app/widgets/{widget}/` (lib, model, ui) |
| 공용 UI·유틸 | `app/shared/ui/`, `app/shared/lib/` |
| 순수 계산 | 각 슬라이스의 `lib/` |
| 부수 효과 (API·브라우저·지도) | 각 슬라이스의 `api/` |
| 상태 관리 | 각 슬라이스의 `model/` |
| Facade (다수 슬라이스 조합) | `app/widgets/map-shell/model/useRouteMapFacade.ts` |
| 지도 초기화·런타임 | `app/shared/lib/map/` |
| CSS 토큰 | `app/assets/css/base/primitive.css` · `semantic.css` |
| 컴포넌트 외부 CSS | `app/assets/css/components/**` |
| 페이지 CSS | `app/assets/css/pages/**` |
| 공통 타입·스키마·fixture | `shared/**` |
| API·프록시·인증·DB | `server/**` |
| 외부 라이브러리 | `lib/` (직접 수정 금지, 래핑으로 대응) |

## 데이터 경계

- 공통 도메인 타입 → `shared/types/`, 입력 검증 → `shared/schemas/`
- draw 응답 변환 등 공통 해석 규칙 → `shared/schemas/` 내 class
- 프론트·백에서 같은 도메인 정의를 복제하지 않고 `shared/`로 올린다

## 서버 경계

| 경계 | 위치 |
|------|------|
| better-auth 설정 | `server/security/auth/instance.ts` → `server/api/auth/[...all].ts` |
| Auth Service DI | `server/security/auth/service.ts` (IAuthService + Memory/BetterAuth 구현체) |
| DB·ORM | `server/utils/db.ts` · `server/database/schema.ts` |
| 외부 서비스 중계 | `server/routes/` (프론트 직결보다 서버 경유 우선) |
| 요청 미들웨어 | `server/middleware/` (rate-limit 등) |
| 경로 최적화 Strategy·Registry | `server/utils/routing/` (`index.ts`, `registry.ts`, `*.service.ts`, `common.ts`) |
| 행정구역 경계 데이터 조회 | `server/utils/district/` (`boundary.ts`, `seoul-gu-data.ts`, `seoul-dong-data.ts`) |
| Repository 제네릭 팩토리 | `server/repositories/factory.ts` + `index.ts` |

## 적용 디자인 패턴

아래 패턴이 이미 코드베이스에 정착되어 있다. 유사 기능 추가 시 동일 패턴을 따른다.

| 패턴 | 적용 위치 예시 |
|------|---------------|
| Decorator | `app/shared/lib/useAsyncDecorator.ts` — 비동기 함수에 retry/fallback 래핑 |
| StateMachine | `app/shared/lib/usePlaybackStateMachine.ts` — 상태 전이 규칙 |
| Template Method | `server/utils/routing/common.ts` — AbstractRoutingService (검증→API→파싱→보간 skeleton) |
| Strategy | `server/utils/routing/` — TMap/OSRM 서비스가 AbstractRoutingService를 상속 |
| Builder | 복잡한 객체 조립 단계 분리 |
| Factory | `server/repositories/factory.ts` — 구현체 생성 로직 캡슐화 |
| Registry | `server/utils/routing/registry.ts` — 전략 등록·조회 |
| Provider | `app/shared/lib/map/useCesiumRuntime.ts` — 외부 의존성 단일 접근점 |

## 점검 항목

- `app/pages/`가 화면 조합만 수행하는가
- 외부 지도 서버 접근이 서버 프록시로 수렴되는가
- 브라우저 전역 객체가 `app/shared/lib/` 래퍼에 모여 있는가
- 공통 타입·스키마가 `shared/` 기준인가
- 문서가 현재 구조와 일치하는가
