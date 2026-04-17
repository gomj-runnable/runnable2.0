# 3D 경로 시뮬레이션

Cesium 3D 지도 위에서 러닝 경로를 러너 시점으로 플라이스루 재생하는 기능이다.
실제 경로 좌표를 따라 카메라가 이동하며, 현재 위치의 거리·고도·경사도를 실시간으로 표시한다.

---

## 사용 방법 (고객 관점)

### 시뮬레이션 시작

경로가 로드된 지도 화면에서 시뮬레이션 시작 버튼을 누르면 경로 시작점부터 플라이스루가 시작된다.
카메라는 러너 눈높이(지면 +2m)에서 경로 진행 방향을 바라보며 이동한다.

### 재생 컨트롤

컨트롤러 패널은 재생 상태(재생 또는 일시정지)일 때만 화면에 표시된다.

| 버튼 | 동작 |
|------|------|
| ▶ (재생) | 일시정지 상태에서 재생을 재개한다 |
| ⏸ (일시정지) | 재생 중 현재 위치에서 멈춘다 |
| ■ (정지) | 재생을 완전히 종료하고 초기 상태로 돌아간다 |

### 진행 바 (스크럽)

컨트롤러 중앙의 진행 바를 클릭하면 해당 위치로 즉시 이동한다.
재생 중 클릭하면 그 위치에서 계속 재생되고, 일시정지 중 클릭하면 위치만 이동한다.

### 재생 속도

1x / 2x / 5x 세 가지 배율을 선택할 수 있다.
기준 속도는 3m/s(약 5분 33초/km)이며, 배율에 따라 카메라 이동 속도가 비례해서 빨라진다.

### 실시간 진행 정보

컨트롤러 하단에 현재 위치 기준 정보가 표시된다.

| 항목 | 표시 형식 | 설명 |
|------|-----------|------|
| 거리 | `X.Xkm / Y.Ykm` | 현재 이동 거리 / 전체 경로 거리 |
| 고도 | `Xm` | 현재 위치의 고도 (미터) |
| 경사 | `+X.X%` / `-X.X%` | 현재 구간 경사도. 오르막은 노란색, 내리막은 파란색으로 강조된다 |

---

## 기술 구현 (개발 관점)

### 아키텍처

시뮬레이션 기능은 `store`, `sideeffect`, `action` 세 레이어로 분리된다.

```
useSimulationStore      — 재생 상태·진행률·진행 정보를 보유하는 공유 상태
useSimulationSideeffect — RAF 루프로 Cesium 카메라를 제어하는 부수 효과
useFlythroughAction     — 좌표 보간·거리·방위각 계산 순수 함수
SimulationController    — 컨트롤 UI (재생/정지/진행 바/속도/정보 표시)
```

상태 변경의 단방향 흐름:

```
사용자 입력
  → SimulationController emit
  → 상위 컴포넌트에서 useSimulationSideeffect 호출
  → RAF tick에서 useFlythroughAction으로 카메라 위치 계산
  → useSimulationStore에 진행률·정보 반영
  → SimulationController가 store를 구독해 UI 갱신
```

### 주요 파일

| 파일 | 역할 |
|------|------|
| `shared/types/simulation.ts` | `PlaybackState`, `PlaybackSpeed`, `ProgressInfo`, `CameraPosition` 타입 정의 |
| `app/composables/store/useSimulationStore.ts` | 재생 상태·속도·진행률·진행 정보 공유 상태 및 mutation |
| `app/composables/sideeffect/useSimulationSideeffect.ts` | RAF 기반 재생 루프, Cesium 카메라 제어, 스크럽 처리 |
| `app/composables/action/useFlythroughAction.ts` | 경로 보간(`interpolatePath`), 진행 정보 계산(`getProgressInfo`), 거리 계산 순수 함수 |
| `app/components/map/molecules/SimulationController.vue` | 재생 컨트롤 UI 컴포넌트 |

### 애니메이션 루프

`useSimulationSideeffect`는 `requestAnimationFrame` 기반 루프로 카메라를 제어한다.

**프레임 처리 흐름 (`tick` 함수):**

1. `playbackState`가 `playing`이 아니면 즉시 반환한다.
2. 직전 프레임과의 경과 시간(`elapsed`)을 측정한다.
3. 경로 전체 거리를 haversine 공식으로 계산해 기준 완주 시간을 산출한다.
   - 기준 속도: `RUNNER_SPEED_MPS = 3m/s`
   - 완주 시간(ms) = `(totalDist / 3) * 1000`
4. 진행률 증분을 계산한다.
   - `delta = (elapsed × speedMultiplier) / totalDurationMs`
5. 누적 진행률이 1 이상이면 재생을 완료 처리(`stopped`)하고 루프를 종료한다.
6. `interpolatePath`로 현재 진행률에 대응하는 카메라 위치·방향을 계산해 `Cesium.camera.setView`를 호출한다.
7. `getProgressInfo`로 거리·고도·경사도를 계산해 store에 반영한다.
8. 다음 프레임을 예약한다(`requestAnimationFrame(tick)`).

**카메라 파라미터:**

| 파라미터 | 값 | 설명 |
|----------|----|------|
| 눈높이 오프셋 | `+2m` | 경로 고도에 더하는 카메라 높이 |
| pitch | `-15°` | 러너 시점 기본 내려보기 각도 |
| heading | 계산값 | 현재 구간의 이동 방위각 (haversine 기반) |

### 속도/탐색 로직

**속도 배율:**

재생 속도는 진행률 증분에 배율을 곱하는 방식으로 구현된다. Cesium API나 타이머 간격을 변경하지 않으며, 동일한 RAF 루프에서 `delta × speedMultiplier`로 처리하므로 재생 품질이 유지된다.

```
지원 배율: 1x | 2x | 5x  (PlaybackSpeed 타입)
```

**스크럽(seekTo):**

진행 바 클릭 시 클릭 위치 비율을 0~1로 변환해 `seekTo(ratio)`를 호출한다.

```
seekTo 처리 순서:
1. store.setProgress(progress)로 진행률을 즉시 반영한다.
2. getProgressInfo로 거리·고도·경사도를 계산해 store에 반영한다.
3. _updateCamera로 카메라를 해당 위치로 즉시 이동한다.
4. 재생 중이면 RAF 루프가 이 진행률을 기점으로 계속 진행한다.
```

**상태 전이:**

```
stopped ──[startPlayback]──► playing
playing ──[pausePlayback]──► paused
paused  ──[resumePlayback]─► playing
playing ──[완주]───────────► stopped
playing / paused ──[stopPlayback]──► stopped
```

`stopPlayback` 호출 시 `store.reset()`으로 진행률·속도·진행 정보가 모두 초기값으로 복원된다.

**좌표 보간 (`interpolatePath`):**

1. `buildCumulativeDistances`로 각 포인트까지의 누적 거리 배열을 생성한다.
2. 목표 거리(`progress × totalDist`)가 포함되는 구간을 선형 탐색으로 찾는다.
3. 구간 내 비율 `t`를 계산해 경도·위도·고도를 선형 보간한다.
4. 해당 구간의 방위각(`calcHeading`)을 적용해 카메라가 진행 방향을 바라보게 한다.

**경사도 계산 (`getProgressInfo`):**

```
currentGradient (%) = (고도 차 / 수평 거리) × 100
```

수평 거리는 haversine 공식으로 계산하며, 수평 거리가 0인 경우(같은 좌표) 경사도는 0으로 처리한다.
