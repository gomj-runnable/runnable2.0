# 경로 피드백

경로에 위치 기반 피드백을 남기고 공유하는 기능이다. 지도 위의 특정 지점을 클릭해 의견을 등록하면, Cesium 3D 지도에 핀 마커와 텍스트 라벨로 표시된다.

---

## 사용 방법 (고객 관점)

### 피드백 목록 보기

피드백 패널을 열면 현재 경로에 등록된 피드백 목록이 표시된다.

- 각 항목에는 작성자 닉네임(없으면 "익명"), 작성 상대 시각, 내용이 표시된다.
- 항목을 클릭하면 해당 피드백이 선택 상태가 되며 지도 마커와 연동된다.
- 패널 상단에는 전체 피드백 개수가 표시된다.

### 공유 링크 복사

패널 상단의 공유 링크 입력창에는 현재 경로의 공유 URL(`/share/{routeId}`)이 자동으로 채워진다. 옆의 **복사** 버튼을 누르면 클립보드에 복사되고, 버튼 텍스트가 일시적으로 "복사됨"으로 바뀐다.

### 피드백 추가

1. **피드백 추가** 버튼을 클릭한다. 버튼이 활성 상태로 바뀌고 "지도에서 피드백을 남길 위치를 클릭하세요" 안내 문구가 나타난다.
2. 3D 지도에서 피드백을 남기고 싶은 지점을 클릭한다.
3. 클릭한 위치의 경위도 좌표가 표시된 입력 폼이 나타난다.
4. 내용을 입력한다 (최대 500자).
5. 닉네임을 입력한다 (선택 사항, 최대 100자). 입력하지 않으면 "익명"으로 표시된다.
6. **등록** 버튼을 클릭해 제출한다. 내용이 비어 있으면 등록 버튼이 비활성화된다.
7. 등록이 완료되면 추가 모드가 해제되고 새 피드백이 목록과 지도에 즉시 반영된다.
8. 취소하려면 **취소** 버튼을 클릭하거나 폼의 X 버튼을 누른다.

---

## 기술 구현 (개발 관점)

### 아키텍처

```
useFeedbackStore (store)
    ↑ 상태 반영 / 구독
useFeedbackSideeffect (sideeffect)
    ↑ API 호출 + Cesium 마커 렌더링
FeedbackPanel.vue (template)
    ↑ 패널 UI, 목록, 공유 링크, 추가 버튼
FeedbackInputForm.vue (molecule)
    ↑ 위치 지정 후 내용 입력 폼
```

상태는 `useFeedbackStore`가 단독으로 소유한다. `useFeedbackSideeffect`는 서버 통신과 Cesium 마커 렌더링을 담당하며, 마커 상태는 store의 `feedbacks`를 `watch`해 자동으로 동기화된다. UI 컴포넌트는 store와 sideeffect만 참조하고 외부 API나 지도 엔진에 직접 의존하지 않는다.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `app/composables/store/useFeedbackStore.ts` | 피드백 목록, 추가 모드, 선택 피드백, 로딩 상태, 패널 표시 여부 관리 |
| `app/composables/sideeffect/useFeedbackSideeffect.ts` | 피드백 조회·등록 API 호출, Cesium 마커 렌더링 및 정리 |
| `app/composables/action/useFeedbackAction.ts` | 공유 링크 생성(`generateShareLink`), 상대 시각 포맷(`formatRelativeTime`) 순수 계산 |
| `app/components/map/templates/FeedbackPanel.vue` | 피드백 패널 전체 레이아웃 (목록, 공유 링크, 추가 버튼) |
| `app/components/map/molecules/FeedbackInputForm.vue` | 위치 지정 후 피드백 입력 폼 |
| `shared/types/feedback.ts` | `FeedbackBase`, `SavedFeedback`, `FeedbackDraftInput` 타입 정의 |

### 데이터 흐름

**피드백 조회**

```
페이지 마운트
  → useFeedbackSideeffect.fetchFeedbacks(routeId)
  → GET /api/routes/{routeId}/feedbacks
  → store.feedbacks 갱신
  → watch 트리거 → renderFeedbackMarkers() 실행
```

**피드백 등록**

```
사용자: 추가 버튼 클릭 → store.isAddingFeedback = true
사용자: 지도 클릭 → 좌표(longitude, latitude, elevation) 획득
사용자: FeedbackInputForm 작성 후 등록
  → useFeedbackSideeffect.submitFeedback(routeId, FeedbackDraftInput)
  → POST /api/routes/{routeId}/feedbacks
  → store.feedbacks에 새 항목 append
  → store.isAddingFeedback = false
  → watch 트리거 → renderFeedbackMarkers() 재실행
```

**Cesium 마커 렌더링**

각 피드백은 두 개의 Cesium entity로 표현된다.

- **Billboard**: `/images/feedback-pin.png` 이미지 핀, 크기 24×32px, 수직 기준점 BOTTOM, `CLAMP_TO_GROUND`
- **Label**: 내용 앞 20자 (초과 시 `...` 말줄임), 12px sans-serif, 흰 글자 + 검정 외곽선, 핀 위 36px 오프셋, `CLAMP_TO_GROUND`

마커 그룹은 `createEntityGroup` 내부 함수로 일괄 관리되며, 피드백 목록이 갱신될 때마다 기존 마커를 전부 제거하고 재생성한다.

### API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/routes/{routeId}/feedbacks` | 경로의 피드백 목록 반환. 응답: `SavedFeedback[]` |
| `POST` | `/api/routes/{routeId}/feedbacks` | 새 피드백 등록. 요청 본문: `FeedbackDraftInput`, 응답: `SavedFeedback` |

**`FeedbackDraftInput` (요청 본문)**

```ts
{
  content: string       // 피드백 내용 (최대 500자)
  longitude: number     // 클릭 지점 경도
  latitude: number      // 클릭 지점 위도
  elevation?: number    // 클릭 지점 고도 (선택)
  authorName?: string   // 작성자 닉네임 (선택, 최대 100자)
}
```

**`SavedFeedback` (응답)**

```ts
{
  feedbackId: string    // 피드백 고유 ID
  routeId: string       // 경로 ID
  content: string
  longitude: number
  latitude: number
  elevation?: number
  authorName?: string
  userId?: string       // 로그인 사용자인 경우 연결
  createdAt?: string    // ISO 8601 타임스탬프
}
```
