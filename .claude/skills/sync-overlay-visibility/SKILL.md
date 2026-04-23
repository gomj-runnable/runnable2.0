---
name: sync-overlay-visibility
description: This skill should be used when the user asks to "오버레이 UI 가시성을 동기화", "카드가 사라지면 연관 버튼도 숨겨", "경로 컨텍스트에 따라 오버레이 UI를 제어", "시뮬레이션/경로정보 칩이 카드와 연동되도록"해야 할 때. MapOverlayContextEnum 기반으로 경로 의존 오버레이 UI 그룹의 표출·정리를 일괄 동기화하는 패턴을 정의한다.
---

# Sync Overlay Visibility

경로 카드(route card)가 화면에 표시되는 동안에만 연관 오버레이 UI를 함께 표시하고,
카드가 사라지면(탭 전환·추천 모드·선택 해제 등) 연관 UI를 일괄 정리하는 패턴.

## 핵심 개념

### 문제

사이드바의 경로 카드와 지도 위 오버레이 UI(시뮬레이션·경로정보·고도·경사도 등)는
**같은 경로 컨텍스트**에 의존하지만, 각각 독립된 `v-if` / `computed`로 가시성을 관리하면
카드가 숨겨져도 오버레이가 남아 있는 **불일치**가 발생한다.

### 해결

`MapOverlayContextEnum` — 현재 탭·선택·모드 상태를 하나의 enum 값으로 수렴시키고,
모든 오버레이 UI가 이 enum의 플래그(`hasActiveRoute`, `showDrawingTools`)를 기준으로 가시성을 결정한다.

## MapOverlayContextEnum

| 인스턴스 | key | hasActiveRoute | showDrawingTools | 설명 |
|----------|-----|:-:|:-:|------|
| `NONE` | `none` | false | false | 활성 경로 없음 |
| `DRAWING` | `drawing` | true | true | 그리기 탭에서 경로 작성 중 |
| `LIST_SELECTED` | `list_selected` | true | false | 목록 탭에서 경로 선택 |
| `EXPLORE_SELECTED` | `explore_selected` | true | false | 탐색 탭에서 경로 선택 |
| `RECOMMEND` | `recommend` | false | false | 탐색 탭의 추천 모드 (카드 가려짐) |

파일: `shared/types/map-overlay-context.enum.ts`

## 패턴 구조

### 1단계: overlayContext computed 정의

페이지(`index.vue`)에서 단일 computed를 선언한다.

```ts
import { MapOverlayContextEnum } from '#shared/types/map-overlay-context.enum'

const overlayContext = computed<MapOverlayContextEnum>(() => {
    if (activeNav.value === '그리기' && drawing.sectionDraft) {
        return MapOverlayContextEnum.DRAWING
    }
    if (activeNav.value === '목록' && routeList.selectedRouteId) {
        return MapOverlayContextEnum.LIST_SELECTED
    }
    if (activeNav.value === '탐색') {
        if (showRecommend.value) return MapOverlayContextEnum.RECOMMEND
        if (explore.selectedRouteId.value) return MapOverlayContextEnum.EXPLORE_SELECTED
    }
    return MapOverlayContextEnum.NONE
})
```

### 2단계: 가시성 computed를 overlayContext 기반으로 전환

```ts
// 경로정보 칩
const showRouteInfoChip = computed(() => overlayContext.value.hasActiveRoute)

// 시뮬레이션 칩 (목록 탭은 구간정보 열림 추가 조건)
const showSimulationChip = computed(() => {
    if (!overlayContext.value.hasActiveRoute) return false
    if (overlayContext.value.isListSelected) return sectionInfo.isOpen.value
    return true
})

// 하단 바 (그리기 도구 또는 활성 경로의 고도 프로필)
// v-if="overlayContext.showDrawingTools || (overlayContext.hasActiveRoute && elevationChart.profile)"
```

### 3단계: 컨텍스트 전환 시 정리 watcher

```ts
watch(overlayContext, (next, prev) => {
    if (next.key === prev.key) return

    if (!next.hasActiveRoute) {
        // 경로정보 추가 모드 해제
        if (routeInfoStore.isAddingRouteInfo.value) {
            routeInfoEffect.cancelAdding()
        }
        // 시뮬레이션 Drawer 닫기 + 재생 정지
        isSimDrawerOpen.value = false
        if (!simulation.playbackState.value.isStopped) {
            simulationEffect.stopPlayback()
        }
        // 경로정보 마커 팝업 닫기
        routeInfoStore.selectedMarkerRouteInfo.value = null
    }
})
```

## 동기화 대상 UI 그룹

| UI 요소 | 가시성 기준 | 정리 동작 |
|---------|------------|----------|
| 시뮬레이션 칩 (FacilityOverlay) | `showSimulationChip` | — |
| 시뮬레이션 Drawer | `isSimDrawerOpen` | Drawer 닫기 + 재생 정지 |
| 경로정보 칩 (FacilityOverlay) | `showRouteInfoChip` | — |
| 경로정보 InputForm | `routeInfoEffect.clickedPosition` | 추가 모드 해제 |
| 경로정보 MarkerPopup | `routeInfoStore.selectedMarkerRouteInfo` | null로 초기화 |
| RouteOverlayBottomBar | `overlayContext` 플래그 조합 | — |
| GradientLegend | `gradient.isGradientVisible` | — |

## 새 오버레이 추가 시 체크리스트

1. 해당 UI가 **경로 컨텍스트에 의존**하는지 확인한다.
2. 의존한다면 가시성 조건에 `overlayContext.hasActiveRoute`를 포함한다.
3. 컨텍스트 전환 시 정리가 필요한 상태가 있다면 watcher의 `!next.hasActiveRoute` 블록에 추가한다.
4. 그리기 전용이라면 `overlayContext.showDrawingTools`를 사용한다.

## 새 컨텍스트 추가 시 체크리스트

1. `MapOverlayContextEnum`에 새 인스턴스를 추가한다 (`hasActiveRoute`, `showDrawingTools` 플래그 설정).
2. `overlayContext` computed의 분기에 새 조건을 추가한다.
3. 기존 가시성 computed와 watcher가 새 컨텍스트에서 올바르게 동작하는지 확인한다.

## 원칙

| 항목 | 규칙 |
|------|------|
| 단일 진실 소스 | 오버레이 가시성의 기준은 `overlayContext` 하나 |
| enum 플래그 | 개별 computed에서 탭·선택·모드를 직접 조합하지 않고, enum의 boolean 플래그를 사용 |
| 정리 책임 | 가시성 변경과 상태 정리를 하나의 watcher에서 일괄 처리 |
| 확장성 | 새 오버레이 추가 시 enum 수정 없이 플래그만 참조. 새 컨텍스트 추가 시 enum + computed 분기만 확장 |