# 템플릿 패턴

SKILL.md 규칙의 구체적 코드 패턴. `{Domain}`, `{ApiA}` 등은 실제 도메인 이름으로 치환한다.

## 분기 경계: 호출부만

```typescript
// ✅ 올바른 패턴 — 호출부만 분기
const observedSlots = await observedAdapter.requestByDate(date)   // → LocalResponse[]
const forecastSlots = await forecastAdapter.requestByDate(date)    // → LocalResponse[]

// 이후 모든 로직은 LocalResponse만 다룬다
const merged = mergeSlots(observedSlots, forecastSlots)  // 공통 함수
const filtered = filterByHour(merged, hour)              // 공통 함수
const displayed = formatForDisplay(filtered)             // 공통 함수
```

```typescript
// ❌ 잘못된 패턴 — API별로 후속 로직이 다름
const observed = await observedAdapter.requestByDate(date)
const forecast = await forecastAdapter.requestByDate(date)

const filteredObserved = filterObserved(observed)  // API-A 전용 함수
const filteredForecast = filterForecast(forecast)  // API-B 전용 함수
```

## 공통 Local Response

```typescript
// shared/types/{domain}.ts

/** 공통 Local Response — 모든 API 소스의 통합 인터페이스 */
export interface {Domain}LocalResponse {
    // 모든 API에서 공통으로 추출 가능한 필드
    date: string
    time: string
    value: number
    label: string

    // 출처 식별 (디버깅/우선순위용)
    source: {Domain}Source
}

/** 데이터 출처 식별 */
export type {Domain}Source = 'apiA' | 'apiB' | 'fallback'
```

## Adapter

```typescript
// server/utils/{domain}/{sourceA}.adapter.ts
import { {ApiA}OriginalResponse, type {Domain}LocalResponse } from '#shared/types/{domain}'

export async function requestByDate(date: string): Promise<{Domain}LocalResponse[]> {
    const res = await fetch(API_A_URL)
    const original = new {ApiA}OriginalResponse(await res.json())

    return original.items.map(item => ({
        date: item.fcstDate,
        time: item.fcstTime,
        value: Number(item.fcstValue),
        label: mapCategoryToLabel(item.category),
        source: 'apiA' as const,
    }))
}
```

## Merge

```typescript
// server/utils/{domain}/merge.service.ts

/** 소스별 우선순위 */
const SOURCE_PRIORITY: Record<{Domain}Source, number> = {
    apiA: 3,    // 최우선 (실측)
    apiB: 2,    // 차선 (예보)
    fallback: 1 // 최후
}

/** 동일 키의 데이터가 여러 소스에 있으면 우선순위가 높은 것을 채택 */
export function mergeResponses(
    ...sources: {Domain}LocalResponse[][]
): {Domain}LocalResponse[] {
    const map = new Map<string, {Domain}LocalResponse>()

    for (const slots of sources) {
        for (const slot of slots) {
            const key = `${slot.date}_${slot.time}`
            const existing = map.get(key)

            if (!existing || SOURCE_PRIORITY[slot.source] > SOURCE_PRIORITY[existing.source]) {
                map.set(key, slot)
            }
        }
    }

    return Array.from(map.values()).sort(/* 시간순 */)
}
```

## Service 오케스트레이터

```typescript
// server/utils/{domain}/{domain}.service.ts

class {Domain}Service {
    async requestByDate(date: string): Promise<{Domain}LocalResponse[]> {
        // 여러 adapter를 병렬 호출 + 개별 실패 허용
        const [slotsA, slotsB] = await Promise.all([
            adapterA.requestByDate(date).catch(() => []),
            adapterB.requestByDate(date).catch(() => []),
        ])

        // 공통 merge 함수로 통합
        return mergeResponses(slotsA, slotsB)
    }
}
```