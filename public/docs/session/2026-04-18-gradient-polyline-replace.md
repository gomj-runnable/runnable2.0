# 경사도 폴리라인 교체 방식 변경

경사도 활성화 시 기존 경로 폴리라인을 숨기고 경사도 색상 폴리라인으로 대체하도록 변경했다.

---

## 이전 방식 (문제)

- 경사도 폴리라인을 기존 경로 폴리라인 위에 별도 엔티티로 추가
- `clampToGround: true` 폴리라인끼리 z-order가 보장되지 않아 경사도 색상이 기존 폴리라인에 가려짐
- `zIndex: 10`으로 우회했으나, Cesium 렌더링 환경에 따라 불안정

## 변경 후 방식

- 경사도 ON: 기존 경로 폴리라인을 `entity.show = false`로 숨기고, 경사도 색상 폴리라인을 그림
- 경사도 OFF: 경사도 폴리라인을 제거하고, 기존 경로 폴리라인을 `entity.show = true`로 복원

---

## 수정 내용

### 1. `createEntityGroup`에 `hide()/show()` 추가

**파일**: `app/composables/action/useEntityCleanup.ts`

- `hide()`: 모든 엔티티의 `show` 속성을 `false`로 설정
- `show()`: 모든 엔티티의 `show` 속성을 `true`로 복원
- 엔티티 자체는 제거하지 않으므로 복원이 가능

### 2. draw/list sideeffect에서 hide/show 노출

**파일**: `app/composables/sideeffect/useRouteDrawSideeffect.ts`
- `hideSectionPolylines()`, `showSectionPolylines()` 반환

**파일**: `app/composables/sideeffect/useRouteListSideeffect.ts`
- `hidePreviewPolylines()`, `showPreviewPolylines()` 반환

### 3. facade에서 통합 hide/show 제공

**파일**: `app/composables/useRouteMapFacade.ts`
- `hideRoutePolylines()`: draw + list 폴리라인 모두 숨김
- `showRoutePolylines()`: draw + list 폴리라인 모두 복원
- 두 함수를 facade return에 추가

### 4. gradient sideeffect에서 콜백 사용

**파일**: `app/composables/sideeffect/useGradientSideeffect.ts`
- options에 `hideRoutePolylines`, `showRoutePolylines` 콜백 추가
- `drawGradientPolylines()`: 먼저 `hideRoutePolylines()` 호출 후 경사도 폴리라인 추가
- `clearGradientPolylines()`: 경사도 폴리라인 제거 후 `showRoutePolylines()` 호출
- 기존 `zIndex: 10` 제거 (더 이상 불필요)

### 5. index.vue에서 콜백 연결

**파일**: `app/pages/index.vue`
- facade에서 `hideRoutePolylines`, `showRoutePolylines` 디스트럭처링
- `useGradientSideeffect` 초기화 시 콜백 전달

---

## 콜백 흐름

```
경사도 ON:
  useGradientSideeffect.drawGradientPolylines()
    → hideRoutePolylines()
        → drawEffect.hideSectionPolylines()   [entity.show = false]
        → listEffect.hidePreviewPolylines()   [entity.show = false]
    → 경사도 색상 폴리라인 추가

경사도 OFF:
  useGradientSideeffect.clearGradientPolylines()
    → gradientPolylines.clear()               [경사도 엔티티 제거]
    → showRoutePolylines()
        → drawEffect.showSectionPolylines()   [entity.show = true]
        → listEffect.showPreviewPolylines()   [entity.show = true]
```

---

## 설계 판단

- `entity.show` 토글 방식을 사용하여 엔티티를 제거/재생성하지 않고 숨김/복원만 수행한다. 재생성 비용 없이 즉시 전환된다.
- `createEntityGroup`에 범용 `hide()/show()`를 추가하여, 경사도 외 다른 오버레이 레이어에서도 동일 패턴을 재사용할 수 있다.
- facade가 draw/list 양쪽의 hide/show를 통합하므로, gradient sideeffect는 경로가 어떤 모드(그리기/목록)로 표시되었는지 알 필요 없다.
