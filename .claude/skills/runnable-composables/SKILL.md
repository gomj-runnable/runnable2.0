---
name: runnable-composables
description: This skill should be used when the user asks to "composable 구조를 정리", "action/sideeffect/store 규칙에 맞게 분리", "상태와 부수 효과를 분리", "app/composables 설계를 문서화 또는 리팩터링"해야 할 때. 로직의 책임 분리와 구현 위임 기준을 명확히 한다.
---

# Runnable Composables

> 패키지 역할·분리 원칙은 `CLAUDE.md`를 기준으로 한다. 이 스킬은 **판단이 모호할 때의 추가 기준**만 둔다.

## 빠른 판단표

| 코드 성격 | 위치 | 예시 | 세부 패턴 |
|-----------|------|------|-----------|
| 순수 계산·변환·평탄화 | `action/` | 트리 탐색, 좌표 변환, GPX 생성 | — |
| 고차 함수로 기능 래핑 | `action/` | retry, fallback, 에러 격리 | Decorator |
| 상태 전이 규칙 관리 | `action/` | 재생/일시정지/정지 전이 | StateMachine |
| fetch·SDK 로드·DOM·timer | `sideeffect/` | Cesium 초기화, API 호출, 파일 다운로드 | — |
| 외부 의존성 단일 접근점 | `sideeffect/` | `getCesiumRuntime()` | Provider |
| 선택/로딩/derived state | `store/` | `useState` 기반 공유 상태 | — |
| 다수 sideeffect/store 조합 | 루트 (`composables/`) | `useRouteMapFacade` | Facade |

## 경계 규칙

- `action`은 외부 환경(API·DOM·전역 상태)에 직접 의존하지 않는다
- `sideeffect`는 상태의 최종 소유자가 되지 않는다 — `store`에 위임하거나 결과를 반환
- `store`는 네트워크 세부 구현을 품지 않는다
- 하나의 composable이 세 역할을 동시에 수행하면 먼저 분리를 검토한다
- 페이지·컴포넌트는 composable 조합만 수행, `window`·외부 API 세부 구현을 직접 품지 않는다
- **Facade 예외**: 루트 직속 composable은 여러 sideeffect/store를 조합하는 오케스트레이터 역할을 허용한다

## 세부 패턴

### Decorator (`action/`)

기존 함수를 래핑하여 retry, fallback, 에러 격리 기능을 추가한다. 원본 함수를 변경하지 않는다.

```typescript
// app/composables/action/useAsyncDecorator.ts
export const withErrorBoundary = <T>(
    fn: () => Promise<T>,
    options?: { retry?: number; fallback?: T }
): () => Promise<T> => {
    return async () => {
        for (let attempt = 0; attempt <= (options?.retry ?? 0); attempt++) {
            try { return await fn() }
            catch (e) {
                if (attempt === (options?.retry ?? 0)) {
                    if (options?.fallback !== undefined) return options.fallback
                    throw e
                }
            }
        }
        throw new Error('unreachable')
    }
}
```

### StateMachine (`action/`)

상태 전이 규칙을 명시적 Map으로 관리한다. 허용되지 않은 전이를 방지한다.

```typescript
// app/composables/action/usePlaybackStateMachine.ts
const transitions = new Map<PlaybackStateEnum, PlaybackStateEnum[]>([
    [PlaybackStateEnum.STOPPED, [PlaybackStateEnum.PLAYING]],
    [PlaybackStateEnum.PLAYING, [PlaybackStateEnum.PAUSED, PlaybackStateEnum.STOPPED]],
    [PlaybackStateEnum.PAUSED, [PlaybackStateEnum.PLAYING, PlaybackStateEnum.STOPPED]],
])

export const canTransition = (from: PlaybackStateEnum, to: PlaybackStateEnum): boolean =>
    transitions.get(from)?.includes(to) ?? false
```

### Provider (`sideeffect/`)

외부 의존성에 대한 단일 접근점. 미로드 시 throw하여 호출부에서 try/catch로 처리하도록 강제한다.

```typescript
// app/composables/sideeffect/useCesiumRuntime.ts
export const getCesiumRuntime = (): CesiumRuntime => {
    const cesium = (window as unknown as { Cesium?: CesiumRuntime }).Cesium
    if (!cesium) {
        throw new Error('[useCesiumRuntime] Cesium is not loaded yet.')
    }
    return cesium
}
```

### Facade (루트)

여러 sideeffect와 store를 하나의 인터페이스로 조합하는 오케스트레이터. 페이지에서의 복잡도를 줄인다.

```typescript
// app/composables/useRouteMapFacade.ts
export const useRouteMapFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    const drawStore = useRouteDrawStore()
    const drawSideeffect = useRouteDrawSideeffect({ viewer, ... })
    const listSideeffect = useRouteListSideeffect({ viewer, ... })
    // ... 여러 sideeffect/store 조합

    return {
        // 페이지에 필요한 통합 인터페이스만 노출
        startDraw, stopDraw, selectRoute, ...
    }
}
```

### 레퍼런스
- `app/composables/action/useAsyncDecorator.ts:16-49` — Decorator
- `app/composables/action/usePlaybackStateMachine.ts:6-26` — StateMachine
- `app/composables/sideeffect/useCesiumRuntime.ts:9-15` — Provider
- `app/composables/useRouteMapFacade.ts:42-488` — Facade

## 적용 순서

1. 유틸 / 부수 효과 / 상태 중 무엇인지 판별
2. 외부 통신 + 상태 변경이 섞여 있으면 `sideeffect` + `store`로 분리
3. 중복 계산은 `action`으로 추출
4. 고차 함수로 래핑 가능하면 Decorator 패턴 검토
5. 상태 전이 규칙이 복잡하면 StateMachine 패턴 검토
6. 외부 의존성 접근이 분산되면 Provider로 단일화
7. 페이지에서 조합이 5개 이상이면 Facade 검토

## 점검 항목

- 외부 API 호출이 `action`이나 페이지에 남아 있지 않은가
- 상태 초기화·갱신이 `store`에서 한눈에 보이는가
- 계산 로직이 `sideeffect`·`store`에 불필요하게 섞여 있지 않은가
- 지도 엔진·DOM 접근이 페이지에 직접 남아 있지 않은가
- `window.Cesium` 직접 참조 없이 `getCesiumRuntime()` Provider를 사용하는가
- StateMachine 패턴에서 허용되지 않은 전이가 방지되는가
- Facade가 내부 구현을 노출하지 않고 통합 인터페이스만 반환하는가
