# 2026-04-20 DI 관점 리팩토링 — 디자인 패턴 적용

## 개요

프로젝트 전반의 의존성 결합을 분석하고, Strategy·Provider·Factory·Registry 등 디자인 패턴을 적용하여 테스트 가능성과 확장성을 개선했다.
5명의 팀 worker를 병렬 운용하여 5개 영역을 동시 리팩토링하고 빌드 검증까지 완료했다.

## 1. WeatherService — Strategy + DI + Factory Method

| 파일 | 수정 내용 |
|------|----------|
| `server/utils/weather/common.ts` | `IObservedWeatherAdapter`, `IForecastAdapter`, `IAirQualityAdapter` 인터페이스 추가 |
| `server/utils/weather/weather.service.ts` | 생성자 주입으로 전환, `createWeatherService()` 팩토리 함수 추가 |
| `server/utils/weather/airquality.adapter.ts` | `AirQualityAdapter` 클래스 생성, 모듈 레벨 mutable cache를 인스턴스 필드로 이동 |
| `server/utils/weather/observed.adapter.ts` | `ObservedWeatherAdapter` 클래스 생성, `IObservedWeatherAdapter` 구현 |
| `server/utils/weather/forecast.adapter.ts` | `ForecastAdapter` 클래스 생성, `IForecastAdapter` 구현 |

## 2. Cesium Runtime — Provider + DI

| 파일 | 수정 내용 |
|------|----------|
| `app/composables/sideeffect/useCesiumRuntime.ts` (신규) | `getCesiumRuntime()` 단일 접근점, 타입 안전 캐스트, 미로드 시 에러 throw |
| 14개 sideeffect 파일 | 로컬 `getCesium()` 3종 구현체 제거, `window.Cesium` 직접 접근 제거 → `getCesiumRuntime()` 통합 |
| `shared/types/cesium.ts` | `CesiumRuntime` 타입에 누락 속성 15건 추가 |

## 3. Auth/Session — Interface Segregation + Strategy + Factory + DIP

| 파일 | 수정 내용 |
|------|----------|
| `server/utils/auth.service.ts` (신규) | `IAuthService` 인터페이스, `MemoryAuthService`, `BetterAuthService`, `createAuthService()` |
| `server/utils/auth.ts` | 내부를 Factory로 전환, `authService` 싱글턴 export 추가 |
| `server/utils/session.ts` | `isMemoryMode` 분기 완전 제거, `authService` 위임, `requireRouteOwnership` repository DI |
| `server/api/routes/[routeId]/index.put.ts` | `requireRouteOwnership` 호출에 `routeRepository` 전달 |
| `server/api/routes/[routeId]/index.delete.ts` | 동일 |

## 4. Routing Service — Service Registry + OCP

| 파일 | 수정 내용 |
|------|----------|
| `server/utils/routing/index.ts` | switch 기반 `createRoutingService` 제거, side-effect import + re-export로 전환 |
| `server/api/routes/optimize.post.ts` | `createRoutingService` → `getRoutingService` 호출로 변경 |

## 5. Repository Layer — Lazy Init + Factory

| 파일 | 수정 내용 |
|------|----------|
| `server/repositories/index.ts` | 조건부 import로 불필요한 모듈 로딩 방지 |

## 변경 요약

- **수정 파일:** 28파일 (신규 2파일 포함)
- **변경량:** +410 -316 lines
- **타입 에러 수정:** 24건 (76 → 52, 잔여는 기존 에러)
- **적용 패턴:** Strategy, Factory Method, Provider, Service Registry, DIP, Interface Segregation, Lazy Initialization
