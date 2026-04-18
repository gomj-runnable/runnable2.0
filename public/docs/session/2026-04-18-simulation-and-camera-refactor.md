# 2026-04-18 시뮬레이션 기능 강화 및 카메라 뷰 모듈화

## 변경 요약

### 1. FacilityOverlay에 기능 칩 통합
- 기존 `RightPanelToggleGroup` (우측 세로 IconButton)을 제거
- FacilityOverlay 하단 행에 탐색/피드백/시뮬레이션/추천 ChipButton 추가
- `useRightPanelStore.open()` 연결로 기존 패널 토글 동작 유지

**변경 파일:**
- `app/components/map/templates/FacilityOverlay.vue`
- `app/pages/index.vue` (RightPanelToggleGroup import/사용 제거)

---

### 2. 시뮬레이션 컨트롤러 상시 표시
- `SimulationController.vue`의 `v-if="store.isActive.value"` 제거
- 시뮬레이션 패널 진입 시 컨트롤러 UI(재생/정지 버튼)가 바로 표시

**변경 파일:**
- `app/components/map/molecules/SimulationController.vue`

---

### 3. 1인칭 카메라 + 마우스 회전
- 시뮬레이션 시작 시 1인칭 카메라 모드 전환 (enableLook만 활성화)
- 마우스 좌우 회전 → 경로 heading에 상대 오프셋으로 누적
- 마우스 상하 회전 → pitch를 사용자 직접 제어 (경로 pitch 미합산)
- 시뮬레이션 정지/탭 전환 시 3인칭 카메라 자동 복구
- 초기 카메라를 경로 시작 방향으로 설정

**변경 파일:**
- `app/composables/sideeffect/useSimulationSideeffect.ts`

---

### 4. 구간별 페이스 기반 시뮬레이션 속도
- 기본 속도를 6:00/km 페이스(360초/km)로 변경
- `useSectionInfoStore`에서 구간별 페이스를 읽어 속도 프로필 구축
- 시간-거리 매핑으로 구간별 다른 속도 반영
- 경과 시간 표시 추가 (MM:SS / 총 시간)

**변경 파일:**
- `app/composables/sideeffect/useSimulationSideeffect.ts`
- `app/composables/store/useSimulationStore.ts` (totalDurationMs, elapsedSeconds, remainingSeconds 추가)
- `app/components/map/molecules/SimulationController.vue` (시간 표시 + 레이아웃 세로 배치)

---

### 5. 카메라 뷰 모듈화 (리팩토링)
- 1인칭/3인칭 카메라 전환 로직을 독립 모듈로 분리
- `useSimulationSideeffect.ts`에서 인라인 카메라 코드 36줄 제거

**신규 파일:**
- `app/composables/store/useCameraViewStore.ts` — 뷰 모드 상태 (first-person / third-person)
- `app/composables/sideeffect/useCameraViewSideeffect.ts` — 카메라 컨트롤러 전환 (enableFirstPerson / restoreThirdPerson)

**수정 파일:**
- `app/composables/sideeffect/useSimulationSideeffect.ts` — `cameraView.enableFirstPerson()` / `cameraView.restoreThirdPerson()` 호출로 교체
