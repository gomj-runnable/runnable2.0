# 경사도 시각화

경로 위에 구간별 경사도를 색상 폴리라인으로 표시하고, 전체 경로의 난이도를 자동으로 분류하는 기능이다.

---

## 사용 방법 (고객 관점)

1. 지도에서 러닝 경로를 그린다.
2. 하단 오버레이 바에서 **경사도** 칩 버튼을 클릭한다.
3. 경로가 구간별 색상 폴리라인으로 바뀌며, 경사가 완만한 구간은 초록, 가파른 구간은 빨강으로 표시된다.
4. 칩 버튼 옆에 **난이도 뱃지**(초급 / 중급 / 고급 / 전문가)가 나타난다.
5. 같은 버튼을 다시 클릭하면 경사도 레이어가 사라지고 원래 경로 색상으로 돌아온다.

### 색상 범례

| 색상 | 경사도 범위 | 의미 |
|------|-------------|------|
| 초록 `#4CAF50` | 0 ~ 3% 미만 | 완만 |
| 노랑 `#FFC107` | 3 ~ 7% 미만 | 약간 가파름 |
| 주황 `#FF9800` | 7 ~ 12% 미만 | 가파름 |
| 빨강 `#F44336` | 12% 이상 | 매우 가파름 |

### 난이도 뱃지

| 뱃지 | 색상 | 의미 |
|------|------|------|
| 초급 | 초록 `#4CAF50` | 비교적 쉬운 경로 |
| 중급 | 노랑 `#FFC107` | 보통 난이도 |
| 고급 | 주황 `#FF9800` | 도전적인 경로 |
| 전문가 | 빨강 `#F44336` | 매우 어려운 경로 |

---

## 기술 구현 (개발 관점)

### 아키텍처

경사도 시각화는 `action → sideeffect → store → UI` 단방향 흐름으로 구성된다.

```
GradientToggle (UI)
    ↓ @toggle emit
RouteOverlayBottomBar
    ↓ toggleGradient()
useGradientStore          ← isGradientVisible 상태 소유
    ↓ watch(isGradientVisible, drawnPositions)
useGradientSideeffect     ← Cesium 레이어 렌더링 조율
    ↓ calculateSegmentGradients / classifyDifficulty
useGradientAction         ← 순수 계산 (외부 의존 없음)
    ↓ setSegments / setDifficulty
useGradientStore          ← gradientSegments / currentDifficulty 갱신
    ↓
GradientToggle            ← difficulty prop으로 뱃지 표시
```

- **`useGradientAction`**: 외부 의존이 없는 순수 계산 함수 모음. 경사도 계산과 난이도 분류를 담당한다.
- **`useGradientSideeffect`**: Cesium 뷰어에 폴리라인 엔티티를 추가·제거하는 부수 효과를 관리한다. `isGradientVisible`과 `drawnPositions`를 watch해 레이어를 갱신한다.
- **`useGradientStore`**: `useState` 기반으로 `isGradientVisible`, `currentDifficulty`, `gradientSegments` 세 상태를 관리한다.
- **`GradientToggle`**: 토글 칩 버튼과 난이도 뱃지를 표시하는 UI 컴포넌트. 상태를 직접 소유하지 않고 props와 emit으로만 동작한다.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `shared/types/gradient.ts` | `DifficultyLevel`, `GradientSegment` 공유 타입 |
| `app/composables/action/useGradientAction.ts` | 경사도 계산 및 난이도 분류 순수 함수 |
| `app/composables/store/useGradientStore.ts` | 경사도 레이어 표시 여부·난이도·세그먼트 상태 관리 |
| `app/composables/sideeffect/useGradientSideeffect.ts` | Cesium 폴리라인 엔티티 생명주기 관리 |
| `app/components/map/molecules/GradientToggle.vue` | 경사도 토글 칩 + 난이도 뱃지 UI |

### 경사도 계산 로직

`useGradientAction.calculateSegmentGradients(coordinates)`가 담당한다.

**입력**: `[longitude, latitude, elevation]` 형태의 GeoJSON Position 배열

**각 구간 계산 순서**:
1. 인접한 두 포인트 사이의 수평 거리를 `@turf/turf`의 `distance()`로 구한다 (단위: 미터).
2. 두 포인트의 고도(elevation, 인덱스 2) 차이를 구한다.
3. 경사도(%) = `(고도 차이 / 수평 거리) × 100`. 수평 거리가 0이면 경사도를 0으로 처리한다.
4. 경사도 절댓값으로 색상을 결정해 `GradientSegment` 객체를 반환한다.

```
경사도(%) = (elevationDiff / horizontalDistanceM) × 100
```

**출력**: `GradientSegment[]` — 각 구간의 `startIndex`, `endIndex`, `gradient`, `color`를 포함한다.

### 난이도 분류 기준

`useGradientAction.classifyDifficulty(distanceKm, elevGain, maxGrad)`가 담당한다.

세 가지 독립 기준으로 각각 등급을 산출하고, **가장 높은 등급을 최종 난이도**로 채택한다.

| 기준 | 초급 | 중급 | 고급 | 전문가 |
|------|------|------|------|--------|
| 총 거리 | 5km 이하 | 5 ~ 10km | 10 ~ 20km | 20km 초과 |
| 누적 상승고도 | 100m 이하 | 100 ~ 300m | 300 ~ 600m | 600m 초과 |
| 최대 경사도 | 3% 이하 | 3 ~ 7% | 7 ~ 12% | 12% 초과 |

난이도 우선순위: `beginner < intermediate < advanced < expert`

난이도 계산에 사용되는 지표는 `useGradientSideeffect`에서 `GradientSegment[]`를 순회하며 집계한다.
- **총 거리(km)**: 모든 구간의 turf 수평 거리 합산
- **누적 상승고도(m)**: 고도가 증가한 구간의 차이만 합산 (하강은 제외)
- **최대 경사도(%)**: 모든 구간 중 경사도 절댓값의 최댓값
