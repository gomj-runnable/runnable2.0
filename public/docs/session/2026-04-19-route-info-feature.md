# 2026-04-19 경로정보(RouteInfo) 기능 구현 및 리팩토링

## 변경 요약

### 1. 경로정보 기능 구현 (구 피드백)
- 지도 클릭 → 좌표 획득 → 입력 폼 모달 표시 → 장소명/설명 입력 흐름 구현
- 로그인 필수(`requireSession`) + 작성자 자동 설정
- 노란색 포인트 마커(검정 아웃라인) + 장소명 라벨 렌더링
- Memory 모드 인메모리 폴백 추가

### 2. 경로정보 흐름 재설계
- 그리기 완료 후 안내 모달: "화면을 클릭해 해당 위치에 장소 설명을 추가할 수 있습니다."
- 그리기 중 경로정보는 로컬 저장(`localRouteInfos`), 경로 저장 시 서버에 일괄 전송
- ChipButton: RightPanel 대신 `isAddingRouteInfo` 직접 토글
- RightPanel에서 피드백 패널 제거
- 마커 클릭 시 `RouteInfoMarkerPopup` 오버레이 (제목/작성자/설명) 표시

### 3. 칩 표시 조건 + 경로 생명주기 동기화
- 경로정보/시뮬레이션 칩: draw 완료 후 / 목록·탐색에서 경로 선택 시에만 표시
- `drawnPositions` null 시 로컬 경로정보 + 마커 자동 정리
- `selectedRouteId` watch로 경로 진입 시 경로정보 로드, 이탈 시 정리

### 4. 피드백 → 경로정보 전체 리네임
- 모든 Feedback/피드백 → RouteInfo/경로정보 (타입, 스키마, 스토어, 사이드이펙트, 컴포넌트)
- `Facility` 타입에 `description`, `userId` 필드 추가
- DB 테이블 `route_feedbacks` → `route_infos`, PK `feedbackId` → `routeInfoId`

### 5. Dead code 정리
- 미사용 파일 삭제: RouteInfoPanel, RouteInfoModal, useRouteInfoAction
- prop/주석/응답 키의 feedback 잔재 정리

## 변경 파일

**Shared**
- `shared/types/routeInfo.ts` — RouteInfoBase, SavedRouteInfo, RouteInfoDraftInput
- `shared/types/facility.ts` — description, userId 추가
- `shared/schemas/routeInfo.schema.ts` — createRouteInfoSchema

**Server**
- `server/database/schema/routeInfos.ts` — route_infos 테이블
- `server/api/routes/[routeId]/feedbacks/index.get.ts` — 경로정보 조회
- `server/api/routes/[routeId]/feedbacks/index.post.ts` — 경로정보 등록 (로그인 필수)
- `server/api/routes/share/[routeId].get.ts` — 공유 경로 + 경로정보
- `server/utils/memoryStore.ts` — memoryRouteInfos

**Frontend**
- `app/composables/store/useRouteInfoStore.ts` — 경로정보 상태 관리
- `app/composables/sideeffect/useRouteInfoSideeffect.ts` — 마커 렌더링, 클릭 핸들링, API
- `app/composables/useRouteMapFacade.ts` — showRouteInfoGuide, onAfterSave 콜백
- `app/components/map/molecules/RouteInfoInputForm.vue` — 장소명/설명 입력 폼
- `app/components/map/molecules/RouteInfoMarkerPopup.vue` — 마커 클릭 팝업
- `app/components/map/templates/FacilityOverlay.vue` — 경로정보 칩 (showRouteInfo)
- `app/pages/index.vue` — 전체 흐름 연결

## 데이터 흐름

**그리기 중 경로정보 추가**
```
경로정보 칩 클릭 → isAddingRouteInfo = true
→ 지도 클릭 → 좌표 획득 → RouteInfoInputForm 표시
→ 장소명/설명 입력 후 등록 → localRouteInfos에 저장 + 마커 렌더링
→ 경로 저장 → onAfterSave(routeId) → saveLocalRouteInfos() 일괄 POST
```

**저장된 경로 경로정보 추가**
```
경로 선택 → fetchRouteInfos(routeId) → 마커 렌더링
→ 경로정보 칩 클릭 → 지도 클릭 → 즉시 서버 POST
```

**마커 클릭**
```
마커 클릭 → scene.pick → entityToRouteInfoMap 조회
→ selectedMarkerRouteInfo 설정 → RouteInfoMarkerPopup 표시
```
