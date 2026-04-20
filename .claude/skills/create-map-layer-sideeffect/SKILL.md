---
name: create-map-layer-sideeffect
description: This skill should be used when the user asks to "지도 레이어를 추가", "Cesium Entity/Primitive 레이어를 구현", "레이어 토글 기능을 만들어", "지도 위에 새로운 데이터 레이어를 표시"해야 할 때. Cesium Entity 생명주기(add/remove/clear) + Options DI + Init/Destroy 패턴을 정의한다.
---

# Create Map Layer Sideeffect

Cesium 지도 위에 Entity/Primitive 레이어를 추가할 때 따르는 sideeffect composable 구현 규칙.

## 반복 패턴 근거

6개 sideeffect 파일이 동일한 add/remove/clear/watch/cleanup 구조를 반복한다:

| 파일 | 렌더링 방식 | 저장소 구조 |
|------|------------|------------|
| `useRouteListSideeffect.ts` | Entity (Polyline + Point) | `shallowRef<Entity[]>` |
| `useRouteClosingSideeffect.ts` | Entity (Polyline + Point) | `shallowRef<Entity[]>` |
| `useRouteDrawSideeffect.ts` | Entity (Polyline + Point) | `shallowRef<Entity[]>` |
| `useFacilitySideeffect.ts` | Entity (Billboard) | `Map<FacilityType, Entity[]>` |
| `useBoundarySideeffect.ts` | Entity (Polyline + Label) | `shallowRef<Entity[]>` |
| `useWeatherSideeffect.ts` | DataSource + Primitive | `shallowRef<DataSource>` |

## 핵심 원칙

| 항목 | 규칙 |
|------|------|
| 의존성 주입 | `Use{Name}SideeffectOptions` 인터페이스로 viewer + store refs 전달 |
| viewer 필수 | `viewer: ShallowRef<CesiumViewer \| null>` — 모든 Options에 포함 |
| Cesium 접근 | `getCesiumRuntime()`으로 접근 — `window.Cesium` 직접 사용 금지 |
| null 가드 | viewer는 `if (!v) return`으로 가드, Cesium은 `getCesiumRuntime()`이 미로드 시 throw |
| 엔티티 저장소 | `shallowRef<Entity[]>` 또는 `Map<string, Entity[]>` |
| 비동기 에러 격리 | `withErrorBoundary`로 API 호출 래핑 — 실패가 전체 초기화를 깨뜨리지 않도록 격리 |
| 클린업 | `onBeforeUnmount` 또는 `destroy()` 반환으로 엔티티 정리 보장 |
| store 분리 | 상태는 store composable에서 관리, sideeffect는 렌더링만 담당 |

## 구조

```
app/composables/sideeffect/use{Name}Sideeffect.ts
app/composables/store/use{Name}Store.ts          ← 상태 관리 (별도 스킬)
```

## Options 인터페이스

```typescript
import type { ShallowRef, Ref, ComputedRef } from 'vue'
import type { CesiumViewer } from '#shared/types/cesium'

export interface Use{Name}SideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    // store에서 주입받는 상태 refs
    items: Ref<{Item}[]>
    activeTypes: Ref<Set<{Type}>>
    isActive: ComputedRef<boolean>
}
```

## 필수 import

```typescript
import { getCesiumRuntime } from '~/composables/sideeffect/useCesiumRuntime'
import { withErrorBoundary } from '~/composables/action/useAsyncDecorator'
```

## 스켈레톤 — Entity 방식

```typescript
import { shallowRef, watch, onBeforeUnmount } from 'vue'
import type { Entity as CesiumEntity } from '#shared/types/cesium'
import { getCesiumRuntime } from '~/composables/sideeffect/useCesiumRuntime'

export const use{Name}Sideeffect = (options: Use{Name}SideeffectOptions) => {
    // 1. 엔티티 저장소
    const entities = shallowRef<CesiumEntity[]>([])

    // 2. 추가 함수
    const show{Layer} = (data: {Data}) => {
        const v = options.viewer.value
        if (!v) return
        const Cesium = getCesiumRuntime() // throws if not loaded

        const entity = v.entities.add({
            /* Cesium entity definition */
        })
        entities.value = [...entities.value, entity]
    }

    // 3. 제거 함수
    const remove{Layer} = () => {
        const v = options.viewer.value
        if (!v) return
        entities.value.forEach(e => v.entities.remove(e))
        entities.value = []
    }

    // 4. 상태 감시 → 자동 동기화
    watch(options.isActive, (active) => {
        if (active) {
            options.items.value.forEach(item => show{Layer}(item))
        } else {
            remove{Layer}()
        }
    })

    // 5. 클린업
    onBeforeUnmount(() => remove{Layer}())

    return { show{Layer}, remove{Layer} }
}
```

## 스켈레톤 — Map 저장소 (다중 타입)

`useFacilitySideeffect.ts` 패턴. 타입별로 Entity를 그룹 관리할 때 사용한다.

```typescript
import { getCesiumRuntime } from '~/composables/sideeffect/useCesiumRuntime'

const entityMap = shallowRef(new Map<{Type}, CesiumEntity[]>())

const showByType = (type: {Type}, items: {Item}[]) => {
    removeByType(type)
    const v = options.viewer.value
    if (!v) return
    const Cesium = getCesiumRuntime()

    const created = items.map(item => v.entities.add({ /* ... */ }))
    const next = new Map(entityMap.value)
    next.set(type, created)
    entityMap.value = next
}

const removeByType = (type: {Type}) => {
    const v = options.viewer.value
    const existing = entityMap.value.get(type)
    if (!v || !existing) return
    existing.forEach(e => v.entities.remove(e))
    const next = new Map(entityMap.value)
    next.delete(type)
    entityMap.value = next
}

const removeAll = () => {
    const v = options.viewer.value
    if (!v) return
    entityMap.value.forEach(list => list.forEach(e => v.entities.remove(e)))
    entityMap.value = new Map()
}
```

## 스켈레톤 — Init/Destroy 반환 패턴

`useCameraSideeffect.ts`, `useBoundarySideeffect.ts` 패턴. 비동기 초기화가 필요할 때 사용한다.

```typescript
import { getCesiumRuntime } from '~/composables/sideeffect/useCesiumRuntime'
import { withErrorBoundary } from '~/composables/action/useAsyncDecorator'

export const use{Name}Sideeffect = (options: Use{Name}SideeffectOptions) => {
    // ... 엔티티 저장소, show/remove 함수

    // withErrorBoundary로 비동기 호출 래핑
    const _fetchData = withErrorBoundary(
        () => $fetch('/api/{domain}/'),
        { retry: 1, fallback: [] }
    )

    const init = async () => {
        const data = await _fetchData()
        // watch 등록, 이벤트 리스너 추가
        watch(options.isActive, handler)
    }

    const destroy = () => {
        remove{Layer}()
        // 이벤트 리스너 제거
    }

    return { init, destroy, show{Layer}, remove{Layer} }
}
```

## withErrorBoundary 사용 패턴

비동기 API 호출이 실패해도 전체 sideeffect 초기화가 깨지지 않도록 격리한다.

```typescript
import { withErrorBoundary } from '~/composables/action/useAsyncDecorator'

// 기본: 실패 시 빈 배열 반환
const safeFetch = withErrorBoundary(
    () => $fetch('/api/data'),
    { fallback: [] }
)

// retry 포함: 1회 재시도 후 fallback
const fetchWithRetry = withErrorBoundary(
    () => $fetch('/api/data'),
    { retry: 1, fallback: null }
)

// init에서 사용
const init = async () => {
    const data = await safeFetch()
    if (data.length) show{Layer}(data)
}
```

## 렌더링 방식 선택 기준

| 조건 | 방식 | 이유 |
|------|------|------|
| 개별 선택/클릭 필요 | Entity | `Entity.id`로 pick 가능 |
| 대량 렌더링 (1000+) | Primitive | GPU 배치 렌더링 |
| GeoJSON 일괄 로드 | DataSource | `GeoJsonDataSource.load()` |
| 동적 스타일 변경 필요 | Entity | Property 바인딩 |

## 새 레이어 추가 절차

1. **store 생성** — `composables/store/use{Name}Store.ts` (토글 상태 + 데이터)
2. **sideeffect 생성** — `composables/sideeffect/use{Name}Sideeffect.ts` (이 스킬 적용)
3. **Options 정의** — viewer + store refs 주입 인터페이스
4. **렌더링 방식 결정** — Entity / Primitive / DataSource 중 선택
5. **페이지 연결** — `pages/index.vue`에서 store + sideeffect 조합

## 점검 항목

- Options 인터페이스에 `viewer: ShallowRef<CesiumViewer | null>`이 포함되었는가
- store를 내부에서 직접 import하지 않고 Options로 주입받는가
- `window.Cesium` 직접 참조 없이 `getCesiumRuntime()`을 사용하는가
- `getCesiumRuntime()` 호출 지점에서 throw 가능성을 인지하고 적절히 처리하는가
- 비동기 API 호출이 `withErrorBoundary`로 래핑되어 실패를 격리하는가
- 제거 함수가 `viewer.entities.remove()` 후 저장소를 초기화하는가
- `onBeforeUnmount` 또는 `destroy()`에서 모든 엔티티를 정리하는가
- watch 동기화 시 이전 엔티티를 먼저 제거한 뒤 새로 추가하는가
- sideeffect가 상태를 직접 소유하지 않고 store에 위임하는가
