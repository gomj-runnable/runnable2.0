---
name: create-store-composable
description: This skill should be used when the user asks to "상태 관리 composable을 추가", "store를 만들어", "useState 기반 공유 상태를 구현", "토글/데이터 store를 생성"해야 할 때. useState + computed + mutation 함수의 3단 구조와 2가지 store 유형(토글/데이터)의 스켈레톤을 정의한다.
---

# Create Store Composable

`app/composables/store/` 하위의 공유 상태 관리 composable 구현 규칙.

## 반복 패턴 근거

9개 store가 동일한 3단 구조를 따른다:

| Store | useState | computed | mutation | 유형 |
|-------|----------|----------|----------|------|
| `useBoundaryStore` | 2 | 0 | 2 | 토글 |
| `useRouteClosingStore` | 1 | 2 | 2 | 토글 |
| `useNotificationStore` | 4 | 0 | 2 | 토글 |
| `useAuthStore` | 4 | 1 | 3 | 토글 |
| `useCameraStore` | 6 | 2 | 0 | 데이터 |
| `useFacilityStore` | 4 | 0 | 3 | 데이터 |
| `useSidewalkStore` | 5 | 0 | 3 | 데이터 |
| `useWeatherStore` | 8 | 1 | 0 | 데이터 |
| `useRouteDrawStore` | 14 (ref) | 2 | 1 | 복합 |

## 핵심 원칙

| 항목 | 규칙 |
|------|------|
| 상태 선언 | `useState<T>('{feature}.{field}', () => 초기값)` |
| 키 네이밍 | `'{feature}.{field}'` 형식 (점 구분자) |
| 파생 상태 | `computed`로 선언, 로직 최소화 |
| 변경 함수 | 명시적 mutation 함수로 노출, 외부에서 `.value` 직접 변경 지양 |
| 외부 통신 금지 | fetch, API 호출은 sideeffect에 위임 |
| SSR 호환 | 기본적으로 `useState` 사용. SSR 불필요 시 `ref` 가능 (명시적 주석 필요) |

## 구조

```
app/composables/store/use{Feature}Store.ts
```

## 유형 A: 토글 Store

2~4개의 boolean/enum 상태 + toggle/reset 함수. 레이어 on/off, 모달 열림/닫힘 등에 사용.

```typescript
export const use{Feature}Store = () => {
    // 1. 상태 선언
    const isActive = useState('{feature}.active', () => false)
    const mode = useState<'{Mode}' | null>('{feature}.mode', () => null)

    // 2. 파생 상태
    const isSpecificMode = computed(() => mode.value === 'specific')

    // 3. 변경 함수
    const toggle = () => {
        isActive.value = !isActive.value
    }

    const setMode = (next: '{Mode}' | null) => {
        mode.value = next
    }

    const reset = () => {
        isActive.value = false
        mode.value = null
    }

    return {
        // 상태 (읽기)
        isActive,
        mode,
        // 파생
        isSpecificMode,
        // 변경
        toggle,
        setMode,
        reset,
    }
}
```

### 레퍼런스
- `useBoundaryStore.ts` — `isGuVisible`, `isDongVisible` + `toggleGu()`, `toggleDong()`
- `useRouteClosingStore.ts` — `closingMode` + `setClosingMode()`, `reset()`

## 유형 B: 데이터 Store

도메인 데이터 배열 + 활성 타입 Set + 로딩 플래그. 시설물, 날씨, 인도 레이어 등에 사용.

```typescript
import type { {Item}, {Type} } from '#shared/types/{domain}'

export const use{Feature}Store = () => {
    // 1. 데이터 상태
    const items = useState<{Item}[]>('{feature}.data', () => [])
    const activeTypes = useState<Set<{Type}>>('{feature}.activeTypes', () => new Set())
    const isLoading = useState('{feature}.isLoading', () => false)
    const selectedId = useState<string | null>('{feature}.selectedId', () => null)

    // 2. 조회 함수
    const isTypeActive = (type: {Type}) => activeTypes.value.has(type)

    const getItemsByType = (type: {Type}) =>
        items.value.filter(item => item.type === type)

    // 3. 변경 함수
    const setItems = (data: {Item}[]) => {
        items.value = data
    }

    const toggleType = (type: {Type}) => {
        const next = new Set(activeTypes.value)
        next.has(type) ? next.delete(type) : next.add(type)
        activeTypes.value = next
    }

    const reset = () => {
        items.value = []
        activeTypes.value = new Set()
        isLoading.value = false
        selectedId.value = null
    }

    return {
        // 상태
        items,
        activeTypes,
        isLoading,
        selectedId,
        // 조회
        isTypeActive,
        getItemsByType,
        // 변경
        setItems,
        toggleType,
        reset,
    }
}
```

### 레퍼런스
- `useFacilityStore.ts` — `facilities`, `activeFacilityTypes` + `toggleFacilityType()`
- `useSidewalkStore.ts` — `sidewalkData`, `isSidewalkActive` + `toggleSidewalk()`
- `useWeatherStore.ts` — `weatherData`, `selectedDate`, `isWeatherActive`

## useState 키 네이밍 규칙

```
{feature}.{field}
```

| 예시 | 설명 |
|------|------|
| `'facility.data'` | 시설물 데이터 배열 |
| `'facility.activeTypes'` | 활성 시설물 타입 Set |
| `'facility.isLoading'` | 시설물 로딩 상태 |
| `'boundary.guVisible'` | 행정경계 구 레이어 표시 여부 |
| `'weather.selectedDate'` | 날씨 선택 날짜 |

## ref 사용이 허용되는 경우

`useRouteDrawStore`처럼 **SSR이 불필요한 브라우저 전용 상태**에서만 `ref` 사용을 허용한다. 이 경우 파일 상단에 주석으로 이유를 명시한다:

```typescript
// SSR 불필요: 지도 드로잉은 브라우저 전용 기능
const drawnPositions = ref<GeoJsonPosition[]>([])
```

## 새 Store 추가 절차

1. **유형 결정** — 토글(boolean/enum 중심) vs 데이터(배열 + 타입 필터)
2. **파일 생성** — `app/composables/store/use{Feature}Store.ts`
3. **useState 키 등록** — `'{feature}.{field}'` 형식
4. **변경 함수 정의** — toggle, set, reset 등
5. **sideeffect 연결** — 필요 시 Options 인터페이스에 store refs 전달

## 점검 항목

- `useState` 키가 `'{feature}.{field}'` 형식을 따르는가
- store가 외부 API를 직접 호출하지 않는가
- 변경 함수가 명시적으로 노출되었는가 (`.value` 직접 변경 아닌)
- `computed`가 순수 파생 로직만 포함하는가
- `ref` 사용 시 SSR 불필요 사유가 주석으로 명시되었는가
- `Set` 상태 변경 시 새 Set 인스턴스를 생성하여 반응성을 보장하는가
- 하나의 store가 다른 store를 과도하게 합성하지 않는가
