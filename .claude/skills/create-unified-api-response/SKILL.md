---
name: create-unified-api-response
description: This skill should be used when the user asks to "여러 API 응답을 통합", "다중 API 소스를 하나로 합쳐", "공통 Response를 만들어", "서로 다른 API의 결과를 같은 인터페이스로 처리"해야 할 때. 한 기능에서 2개 이상 외부 API를 사용할 때 공통 Local Response를 정의하고, 호출부 외의 모든 로직이 동일한 함수를 쓰도록 강제하는 규칙을 정의한다.
---

# Create Unified API Response

한 기능에서 2개 이상의 서로 다른 외부 API를 사용할 때, 공통 Local Response를 정의하여 **호출부(`service.requestBy000()`)를 제외한 모든 후속 로직이 같은 함수를 사용**하도록 통일하는 규칙.

## 핵심 원칙

1. **각 API마다 원본 Response Class** — `create-api-service` 스킬 규칙 적용
2. **공통 Local Response 하나** — 모든 API 결과가 변환되는 단일 인터페이스
3. **호출부만 분기, 나머지는 통일** — `service.requestByX()` 반환 이후의 코드는 API 출처를 모른다

## 구조

```
shared/types/{domain}.ts
├── {ApiA}OriginalResponse       ← class: API-A 원본
├── {ApiB}OriginalResponse       ← class: API-B 원본
└── {Domain}LocalResponse        ← interface: 공통 추상화 응답 (하나만)

server/utils/{domain}/
├── {domain}.service.ts          ← 오케스트레이터: 여러 adapter 호출 + merge
├── {sourceA}.adapter.ts         ← API-A 호출 + 원본 → 공통 변환
├── {sourceB}.adapter.ts         ← API-B 호출 + 원본 → 공통 변환
├── merge.service.ts             ← 공통 Local Response 병합/우선순위 (선택)
└── common.ts                    ← 공통 유틸

server/api/{domain}/
└── [...].get.ts                 ← 엔드포인트, service만 호출

app/composables/
├── sideeffect/use{Domain}Sideeffect.ts  ← API 호출
├── store/use{Domain}Store.ts            ← 공통 Local Response 상태 관리
└── action/use{Domain}Transform.ts       ← 공통 Local Response 변환 (선택)
```

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

## 공통 Local Response 설계

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

### source 필드 규칙

- 공통 Local Response에 `source` 필드를 **필수**로 둔다
- 병합 시 우선순위 판단에 사용: 예) `observed > forecast > fallback`
- 디버깅 시 데이터 출처를 추적 가능

## Adapter 패턴

각 adapter는 **자신의 API 호출 + 공통 Local Response 변환**만 책임진다.

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

## Merge 패턴

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

## 기존 프로젝트 사례: Weather

| 구성 요소 | 파일 |
|-----------|------|
| API-A 원본 | `VilageFcstResponse` (forecast.adapter.ts) |
| API-B 원본 | KMA 텍스트 응답 (observed.adapter.ts) |
| 공통 Local Response | `HourlyWeather` (shared/types/weather.ts) |
| source 필드 | `WeatherSlotSource: 'observed' \| 'forecast' \| 'fallback'` |
| Merge | `merge.service.ts` — source 우선순위 기반 |
| 오케스트레이터 | `weather.service.ts` — Promise.all + catch fallback |

→ 코드: [examples/unified.ts](examples/unified.ts)

## 새 통합 API 추가 절차

1. **공통 Local Response 정의** — `shared/types/{domain}.ts`에 단일 interface + source 타입
2. **각 API 원본 Response Class** — `create-api-service` 스킬 규칙 적용
3. **Adapter 생성** — API별 `{source}.adapter.ts`, 반환은 공통 Local Response
4. **Merge 서비스 생성** — `merge.service.ts`에 우선순위 기반 병합
5. **오케스트레이터 생성** — `{domain}.service.ts`에서 adapter 병렬 호출 + merge
6. **후속 로직 작성** — 공통 Local Response만 사용하는 함수로 통일

## 점검 항목

- 공통 Local Response가 **하나의 interface**로 정의되었는가
- `source` 필드가 포함되어 있는가
- 각 adapter의 반환값이 공통 Local Response 타입인가
- `service.requestBy000()` 호출부 이후의 코드가 API 출처에 의존하지 않는가
- API별 전용 함수가 adapter 내부에만 존재하는가
- 개별 API 실패 시 다른 API로 계속 동작하는가 (graceful fallback)
- 병합 우선순위가 명시적으로 정의되었는가

## 관련 스킬

- `create-api-service` — 단일 API의 원본 Response Class + Local Response 분리 규칙
