# 경사도 drawnPositions 통합

경로 목록 선택 시 경사도 버튼이 동작하지 않던 버그를 수정하고, 경로 그리기와 경로 목록의 좌표 공유 방식을 통일했다.

---

## 문제

- 경사도 sideeffect(`useGradientSideeffect`)는 `drawnPositions`를 watch하여 경사도 폴리라인을 렌더링한다.
- **경로 그리기**: draw 완료 시 `drawnPositions`에 WGS84 좌표를 설정 → 경사도 watch 트리거 가능
- **경로 목록**: `useRouteListSideeffect.selectRoute()`가 자체적으로 폴리라인을 그리지만 `drawnPositions`를 설정하지 않음 → 경사도 watch가 트리거되지 않음

두 경로 모두 내부적으로 WGS84(`GeoJsonPosition[]`)를 사용하고 있었으나, 경로 목록 쪽에서 `drawnPositions`에 좌표를 반영하지 않아 경사도가 동작하지 않았다.

---

## 수정 내용

### 1. `useRouteListSideeffect` options에 `drawnPositions` 추가

**파일**: `app/composables/sideeffect/useRouteListSideeffect.ts`

- `UseRouteListSideeffectOptions`에 `drawnPositions: Ref<GeoJsonPosition[] | null>` 필드 추가
- `selectRoute()`: 서버에서 가져온 section 좌표를 `flat()`으로 합쳐 `drawnPositions`에 반영
- `clearSelection()`: `drawnPositions = null`로 초기화하여 경사도 폴리라인도 함께 제거

### 2. `useRouteMapFacade`에서 `drawnPositions` 전달

**파일**: `app/composables/useRouteMapFacade.ts`

- `useRouteListSideeffect` 호출 시 `drawnPositions: store.drawnPositions` 전달

---

## 통일된 동작 흐름

```
[경로 그리기]
draw 완료 → normalizeDrawPositions() → drawnPositions 설정
                                            ↓
[경로 목록]                          useGradientSideeffect
selectRoute() → sections fetch          watch 트리거
  → flat() → drawnPositions 설정            ↓
                                     경사도 폴리라인 렌더링
```

두 경로 모두 `drawnPositions`(WGS84) 기반으로 경사도 sideeffect가 동작한다.

---

## 설계 판단

- 좌표 체계는 WGS84(`[longitude, latitude, elevation]`)로 통일. 경로 그리기의 `normalizeDrawPositions()`와 경로 목록의 `geomToRouteDrawPositions()` 모두 동일한 `GeoJsonPosition[]`을 출력한다.
- `drawnPositions`를 단일 진실 소스(single source of truth)로 유지하여, 경사도뿐 아니라 향후 추가되는 공통 sideeffect도 동일한 데이터를 참조할 수 있도록 했다.
