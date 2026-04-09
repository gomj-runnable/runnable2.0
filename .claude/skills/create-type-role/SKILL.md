# Create Type Role

하나의 기능에서 복수 API 응답을 사용할 때, 공통 도메인 타입을 먼저 정의하고 각 API `response.data`를 정규화(adaptor)해서 공통 서비스에서 소비하는 규칙.

## 1) 문제정의

서로 다른 API가 같은 기능을 위해 비슷한 데이터를 내려줘도, 응답 구조와 필드 이름은 자주 다르다.

이 차이를 서비스 레이어나 화면 코드에서 직접 흡수하기 시작하면:

- 서비스가 특정 API 응답 shape에 직접 결합된다.
- 기능이 늘수록 `if`, `map`, optional chaining이 서비스 곳곳에 흩어진다.
- 다른 API로 교체하거나 추가할 때 공통 로직을 재사용하기 어렵다.
- 프론트와 서버가 공유해야 하는 도메인 의미가 응답 스펙에 종속된다.

해결 기준은 단순하다. **API 응답 타입을 바로 쓰지 말고, 기능 기준의 공통 타입을 먼저 만든다.**

## 2) 설계 원칙

- **공통 도메인 타입 우선**
  - 서비스가 실제로 필요로 하는 데이터 구조를 먼저 `shared/types`에 정의한다.
  - 타입 이름은 API 이름이 아니라 도메인 의미로 짓는다.
- **어댑터 분리**
  - 각 API의 `response.data`를 공통 타입으로 변환하는 함수는 adapter로 분리한다.
  - adapter는 변환 책임만 가진다. fetch, 캐시, 비즈니스 판단을 섞지 않는다.
- **서비스는 공통 타입만 의존**
  - `server/services` 또는 공통 서비스는 adapter가 반환한 공통 타입만 다룬다.
  - 서비스 내부에서 특정 API 필드명 (`item_nm`, `routeList`, `result.items`)을 직접 참조하지 않는다.
- **API별 예외는 adapter에서 흡수**
  - null 처리, 기본값 주입, 필드명 차이, 좌표/단위 변환은 adapter에서 끝낸다.
- **도메인 기준으로 확장**
  - API가 추가되면 서비스 수정이 아니라 adapter 추가로 대응할 수 있어야 한다.

## 3) 폴더 / 파일 패턴

기본 기준은 아래처럼 잡는다.

```text
shared/
└── types/
    └── route.ts               # 공통 도메인 타입

server/
├── services/
│   └── route/
│       └── route-service.ts   # 공통 타입만 소비하는 서비스
└── adapters/
    └── route/
        ├── api-a.adapter.ts   # ApiAResponse -> RouteSummary
        └── api-b.adapter.ts   # ApiBResponse -> RouteSummary
```

- 공통 타입: `shared/types/**`
- API 응답별 정규화: `server/adapters/**`
- 공통 기능 조합: `server/services/**`

프론트와 서버가 같이 쓰는 기능이면 type은 반드시 `shared/types`에 둔다.
특정 API 응답 원본 타입이 필요하면 adapter 파일 내부 또는 API 클라이언트 근처에 한정해 둔다.

## 4) 구현 단계 체크리스트

- [ ] 이 기능에서 공통으로 다뤄야 하는 도메인 필드가 무엇인지 먼저 정리했는가
- [ ] 공통 도메인 타입을 `shared/types`에 먼저 정의했는가
- [ ] 각 API `response.data`의 원본 shape를 공통 타입에 직접 노출하지 않았는가
- [ ] API별 adapter 함수를 분리했는가
- [ ] null, 빈 배열, 필드 누락, 타입 차이를 adapter에서 정규화했는가
- [ ] 서비스가 공통 타입만 입력받거나 반환하도록 구성했는가
- [ ] 서비스 내부에서 특정 API 필드명을 직접 참조하지 않는가
- [ ] 새 API 추가 시 adapter만 추가하면 되는 구조인가

## 5) 예시 코드

### 공통 타입

```ts
// shared/types/route.ts
export interface RouteSummary {
  id: string
  name: string
  distanceMeter: number
  source: 'apiA' | 'apiB'
}
```

### API A adapter

```ts
// server/adapters/route/api-a.adapter.ts
import type { RouteSummary } from '~/shared/types/route'

interface ApiARouteItem {
  route_id: string
  route_name: string
  distance_m: number | null
}

export function adaptApiARoute(data: ApiARouteItem): RouteSummary {
  return {
    id: data.route_id,
    name: data.route_name,
    distanceMeter: data.distance_m ?? 0,
    source: 'apiA',
  }
}
```

### API B adapter

```ts
// server/adapters/route/api-b.adapter.ts
import type { RouteSummary } from '~/shared/types/route'

interface ApiBRouteItem {
  id: number
  title: string
  lengthKm?: number
}

export function adaptApiBRoute(data: ApiBRouteItem): RouteSummary {
  return {
    id: String(data.id),
    name: data.title,
    distanceMeter: Math.round((data.lengthKm ?? 0) * 1000),
    source: 'apiB',
  }
}
```

### 서비스 조합

```ts
// server/services/route/route-service.ts
import type { RouteSummary } from '~/shared/types/route'
import { adaptApiARoute } from '~/server/adapters/route/api-a.adapter'
import { adaptApiBRoute } from '~/server/adapters/route/api-b.adapter'

export async function getRouteSummaries(): Promise<RouteSummary[]> {
  const [apiAResponse, apiBResponse] = await Promise.all([
    $fetch<{ data: Array<{ route_id: string; route_name: string; distance_m: number | null }> }>('/api/a/routes'),
    $fetch<{ data: Array<{ id: number; title: string; lengthKm?: number }> }>('/api/b/routes'),
  ])

  return [
    ...apiAResponse.data.map(adaptApiARoute),
    ...apiBResponse.data.map(adaptApiBRoute),
  ]
}
```

핵심은 `getRouteSummaries`가 더 이상 API 응답 구조를 모른다는 점이다.
서비스는 `RouteSummary` 배열만 조합하고, API 차이는 adapter가 끝낸다.

## 6) 리뷰 체크리스트

- [ ] 공통 타입 이름이 API 이름이 아니라 도메인 의미를 반영하는가
- [ ] 서비스가 특정 API 응답 필드명에 직접 결합되지 않았는가
- [ ] adapter가 fetch/비즈니스 정책까지 떠안지 않고 변환 책임만 가지는가
- [ ] API별 기본값 처리와 형 변환이 adapter에 모여 있는가
- [ ] 동일 기능에서 여러 API를 합쳐도 반환 타입이 일관적인가
- [ ] 프론트/서버 공통으로 쓰는 타입이 `shared/types`에 정의되어 있는가
- [ ] 새 API 추가 시 기존 서비스 수정 범위가 최소화되는가
