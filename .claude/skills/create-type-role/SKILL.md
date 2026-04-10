# Create Type Role

복수 API 응답을 하나의 기능에서 사용할 때, **공통 도메인 타입을 먼저 정의**하고 각 API `response.data`를 adapter로 정규화해서 서비스에서 소비하는 패턴.

## 설계 원칙

| 원칙 | 규칙 |
|------|------|
| 공통 타입 우선 | 서비스가 필요로 하는 구조를 `shared/types/`에 먼저 정의. 이름은 API가 아니라 도메인 의미 |
| adapter 분리 | 각 API `response.data` → 공통 타입 변환만 담당. fetch·캐시·비즈니스 판단 금지 |
| 서비스는 공통 타입만 의존 | 서비스 내부에서 특정 API 필드명 직접 참조 금지 |
| API 예외는 adapter에서 흡수 | null 처리, 기본값, 필드명 차이, 단위 변환을 adapter에서 끝낸다 |
| adapter 추가로 확장 | API 추가 시 서비스 수정 없이 adapter만 추가 |

## 폴더 패턴

```
shared/types/<domain>.ts          # 공통 도메인 타입
server/adapters/<domain>/
  ├── api-a.adapter.ts             # ApiAResponse → DomainType
  └── api-b.adapter.ts             # ApiBResponse → DomainType
server/services/<domain>/
  └── <domain>-service.ts          # 공통 타입만 소비
```

프론트·서버 공용 타입은 반드시 `shared/types/`에 둔다. API 응답 원본 타입은 adapter 내부에 한정한다.

## 핵심 예시

```ts
// shared/types/route.ts — 공통 타입
export interface RouteSummary {
  id: string; name: string; distanceMeter: number; source: 'apiA' | 'apiB'
}

// server/adapters/route/api-a.adapter.ts — 변환만 담당
export const adaptApiARoute = (data: ApiARouteItem): RouteSummary => ({
  id: data.route_id, name: data.route_name,
  distanceMeter: data.distance_m ?? 0, source: 'apiA'
})

// server/services/route/route-service.ts — 공통 타입만 소비
export async function getRouteSummaries(): Promise<RouteSummary[]> {
  const [a, b] = await Promise.all([$fetch('/api/a/routes'), $fetch('/api/b/routes')])
  return [...a.data.map(adaptApiARoute), ...b.data.map(adaptApiBRoute)]
}
```

핵심: `getRouteSummaries`는 API 응답 구조를 모른다. 차이는 adapter가 끝낸다.

## 점검 항목

- 공통 타입 이름이 도메인 의미를 반영하는가
- 서비스가 특정 API 필드명에 결합되지 않았는가
- adapter가 변환 책임만 가지는가 (fetch·비즈니스 정책 금지)
- 기본값·형변환이 adapter에 모여 있는가
- 여러 API를 합쳐도 반환 타입이 일관적인가
- 새 API 추가 시 기존 서비스 수정 범위가 최소화되는가
