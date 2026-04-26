# Frontend Architecture (FSD)

프론트엔드는 [Feature-Sliced Design](https://feature-sliced.design/) 아키텍처를 따른다.

---

## FSD 레이어 구조

```
app/
├── shared/            # 공용 — 다른 모든 레이어에서 import 가능
│   ├── lib/           # 유틸 (map/, useFormatUtils, useAsyncDecorator, useExceptionHandler 등)
│   ├── model/         # 공용 상태 (useCameraStore)
│   └── ui/            # 공용 UI (BottomDrawer, Card, TextfieldCard)
│
├── entities/          # 도메인 엔티티 — shared만 import 가능
│   ├── boundary/      # 행정경계 (api, model, ui)
│   ├── facility/      # 편의시설 (api, model)
│   ├── gradient/      # 경사도 (api, lib, model, ui)
│   ├── notification/  # 알림 (model)
│   ├── route/         # 경로 (lib, model, ui)
│   ├── user/          # 사용자 (api, model, ui)
│   └── weather/       # 날씨 (lib, model, ui)
│
├── features/          # 사용자 기능 — shared + entities import 가능
│   ├── camera/        # 카메라 제어 (api, lib, model)
│   ├── discover/      # 지역 탐색 (model, ui)
│   ├── draw-route/    # 경로 그리기 (api, ui)
│   ├── elevation-layer/ # 고도 레이어 (api, lib, model)
│   ├── explore/       # 경로 검색 (api, model, ui)
│   ├── route-info/    # 경로 정보 (api)
│   ├── simulation/    # 3D 시뮬레이션 (api, model, ui)
│   └── weather-overlay/ # 날씨 오버레이 (api, ui)
│
├── widgets/           # 복합 위젯 — shared + entities + features import 가능
│   ├── facility-overlay/ # 시설물 오버레이
│   ├── map-shell/     # 지도 Shell (MapShell, MapSidebar, useRouteMapFacade)
│   └── right-panel/   # 우측 2차 패널
│
├── pages/             # 라우트 — 조합만 담당 (SSR: false)
└── assets/css/        # 디자인 토큰 + 외부 CSS
```

---

## 슬라이스 내부 세그먼트

| 세그먼트 | 역할 | 규칙 |
|---------|------|------|
| `api/` | 부수 효과 (외부 API, 브라우저, 지도 엔진) | 상태를 직접 소유하지 않음. model과 연결하거나 결과 반환 |
| `lib/` | 순수 계산 (변환, 포맷, 트리 탐색) | 외부 API·전역 상태·브라우저 IO 의존 금지 |
| `model/` | 공유 상태 (useState 기반) | 외부 통신 직접 수행 금지 |
| `ui/` | Vue 컴포넌트 | slot 우선, 외부 CSS 분리, semantic token 참조 |
| `index.ts` | Public API | 슬라이스 외부에서는 index.ts를 통해서만 접근 |

---

## Import 규칙 (레이어 의존성)

```
pages → widgets → features → entities → shared
         (상위)                        (하위)
```

- 같은 레이어 내 cross-import 최소화
- 하위 레이어는 상위 레이어를 **절대** import하지 않음
- 같은 슬라이스 내부 세그먼트 간 import는 자유

---

## CSS 토큰 계층

```
primitive.css  →  semantic.css  →  컴포넌트 CSS
(값 자체)        (역할 이름)       (실제 UI 규칙)
```

| 역할 | 위치 |
|------|------|
| raw token | `app/assets/css/base/primitive.css` |
| semantic token | `app/assets/css/base/semantic.css` |
| 전역 엔트리 | `app/assets/css/base/main.css` |
| 컴포넌트 CSS | `app/assets/css/components/**` |
| 페이지 CSS | `app/assets/css/pages/**` |

---

## 에러 처리

| 유틸 | 역할 |
|------|------|
| `useAsyncDecorator` (`shared/lib/`) | 네트워크 레벨 — 재시도 + 폴백 |
| `useExceptionHandler` (`shared/lib/`) | UX 레벨 — 사용자 알림 + 에러 분류 |

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `app/shared/lib/map/useMapInit.ts` | Cesium 초기화 |
| `app/shared/lib/map/useCesiumRuntime.ts` | Cesium 런타임 싱글턴 |
| `app/shared/model/useCameraStore.ts` | 카메라 상태 (위치, 고도, 방위각) |
| `app/widgets/map-shell/model/useRouteMapFacade.ts` | 지도 기능 통합 Facade |
| `app/entities/route/lib/useRouteDrawDraft.ts` | 경로 드로잉 초안 관리 |
