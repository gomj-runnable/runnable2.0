# 6.3 테스트 작성 가이드

## 1) 순수 함수 (가장 흔한 패턴)

`server/services/safety/normalize.ts` 같은 순수 함수.

```ts
// server/services/safety/__tests__/normalize.test.ts
import { describe, expect, it } from 'vitest'
import { zScore, normalCdf, normalize } from '../normalize'

describe('zScore', () => {
    it('평균이면 0 을 반환한다', () => {
        expect(zScore(5, 5, 1)).toBe(0)
    })

    it('표준편차가 0 이면 0 을 반환해 NaN 을 피한다', () => {
        expect(zScore(5, 5, 0)).toBe(0)
    })
})
```

체크리스트:

- `describe` 는 함수명, `it` 는 행동 한 가지
- assertion 은 한 가지 행동을 검증
- 엣지 케이스 (빈 입력 / 0 / 음수) 별도 테스트

## 2) Repository (DB 통합 테스트)

Testcontainers 기반 실제 PostGIS 컨테이너 사용.

```ts
// server/repositories/__tests__/route.repository.test.ts
import { describe, expect, it, beforeEach, inject } from 'vitest'
import { initTestDb, truncateAll } from '../pgContainer'
import { createRouteRepositoryDrizzle } from '../route.repository.drizzle'

describe('RouteRepository (drizzle + postgres)', () => {
  let db, repo
  beforeEach(async () => {
    db = await initTestDb(inject('databaseUrl'))
    repo = createRouteRepositoryDrizzle(db)
    await truncateAll(db)
  })

  it('upsert 후 같은 id 로 조회 가능', async () => {
    await repo.upsert({ id: 'r1', name: 'test', ... })
    expect(await repo.findById('r1')).toMatchObject({ id: 'r1' })
  })
})
```

- 파일명은 `.test.ts` 패턴을 따른다
- `inject('databaseUrl')` 로 전역 PostGIS 컨테이너 URI 획득
- `beforeEach` 마다 `truncateAll(db)` 로 테스트 간 격리 보장
- migration 은 `initTestDb()` 에서 자동 적용

## 3) Composable (Vue / Nuxt)

`server/test/setup.ts` 의 `useState` 스텁 덕에 Nuxt 런타임 없이도 컴포저블을 호출할 수 있습니다.

```ts
// app/shared/lib/__tests__/useFormatUtils.test.ts
import { describe, expect, it } from 'vitest'
import { useFormatUtils } from '../useFormatUtils'

describe('useFormatUtils', () => {
    it('1500m → "1.5 km"', () => {
        const { formatDistance } = useFormatUtils()
        expect(formatDistance(1500)).toBe('1.5 km')
    })
})
```

## 4) Adapter (외부 API)

`server/services/weather/airquality.adapter.ts` 같은 어댑터는 raw 응답 → 도메인 객체 변환만 하니, **고정 fixture** 로 테스트.

```ts
import fixture from './fixtures/airquality.raw.json'

it('PM10 80 은 "보통" 등급', () => {
    const result = parseAirQuality(fixture)
    expect(result.pm10Grade).toBe('보통')
})
```

- HTTP 호출 자체는 테스트하지 않음 — adapter 의 입출력만
- fixture 는 옆 `fixtures/` 디렉터리에 두기

## 5) API 핸들러 (Nitro)

E2E 또는 통합 테스트로 검증 (Playwright). 핸들러 자체는 **얇게** — 비즈니스 로직은 service 로 위임해 service 단위 테스트로 커버.

## TDD 사이클 예시 — "거리 계산 추가"

1. **Red** — 실패하는 테스트

    ```ts
    it('두 점 사이 거리는 Haversine 결과', () => {
        expect(distanceKm(p1, p2)).toBeCloseTo(1.234, 3)
    })
    ```

    → `distanceKm` 없음 → 실패

2. **Green** — 가장 단순한 구현

    ```ts
    export function distanceKm(a, b) {
        /* haversine */
    }
    ```

3. **Refactor** — 매직 넘버 추출 / 헬퍼 분리 / 테스트 가독성 개선

4. 다음 행동 (예: 빈 배열) 으로 1 로 돌아가기

## 흔한 함정과 해결

| 함정                           | 해결                                                          |
| ------------------------------ | ------------------------------------------------------------- |
| 테스트가 너무 느림             | DB 의존이라면 Testcontainers 사용, 외부 API 라면 adapter 분리 |
| 테스트가 깨지기 쉬움           | 구현 디테일 (private 메서드 / 내부 구조) 검증하지 말 것       |
| 테스트가 길고 복잡함           | 단위가 너무 크다 — 더 작은 함수로 분리                        |
| 한 테스트가 다른 테스트에 영향 | 전역 상태 / 모듈 import-time 부수효과 제거                    |

다음 → [6-4-CI-Gate](6-4-CI-Gate)
