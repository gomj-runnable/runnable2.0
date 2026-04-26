---
name: runnable-components
description: This skill should be used when the user asks to "컴포넌트 구조를 정리", "UI 컴포넌트를 추가", "FSD 레이어에 맞게 구현", "widgets/features/entities UI를 설계", "사이드바/지도 shell 컴포넌트를 수정"해야 할 때. FSD 구조에서 컴포넌트 배치와 CSS 자산 경계를 함께 정리한다.
---

# Runnable Components (FSD)

> CSS 토큰 계층·FSD 레이어 분리·패키지 구조는 `CLAUDE.md`를 기준으로 한다. 이 스킬은 **컴포넌트 설계와 CSS 경계 규칙**만 둔다.

## Toss Flat + Compound 원칙

| 방식 | 사용 시점 | 패턴 |
|------|-----------|------|
| **Flat** | 단순 사용 | props만으로 기본 동작 |
| **Compound** | 커스텀 필요 | slot + sub-component 조합 |

Flat API 내부에서 Compound를 렌더한다. 확장 지점(slot)은 설계 시 미리 명시한다.

## FSD 컴포넌트 배치

| FSD 레이어 | 위치 | UI 역할 |
|-----------|------|---------|
| shared | `app/shared/ui/` | 전역 공용 UI (BottomDrawer, Card, TextfieldCard) |
| entities | `app/entities/{entity}/ui/` | 도메인별 독립 UI (GradientToggle, AuthModal, WeatherDatePicker) |
| features | `app/features/{feature}/ui/` | 기능별 패널·모달 (DrawRoutePanel, ExplorePanel, SimulationDrawer) |
| widgets | `app/widgets/{widget}/ui/` | 복합 레이아웃 (MapShell, MapSidebar, FacilityOverlay) |

### 레퍼런스
- `app/shared/ui/` — BottomDrawer, Card, TextfieldCard
- `app/entities/route/ui/` — RouteClosingChipBar, RouteInfoInputForm
- `app/entities/user/ui/` — AuthModal, SidebarUserProfile
- `app/entities/gradient/ui/` — GradientToggle, GradientLegend
- `app/features/draw-route/ui/` — DrawRoutePanel, RouteListPanel, RouteSaveModal
- `app/features/simulation/ui/` — SimulationDrawer
- `app/widgets/map-shell/ui/` — MapShell, MapSidebar, MapFooter, MapSidebarTabs

## Shell 슬롯 구조

```
MapShell: #sidebar · #default(Viewer) · #overlay(부유 UI)
MapSidebar: #header(로고+제어) · #subheader(탭) · #default(스크롤 영역) · #footer(프로필)
```

## 사이드바 검색 패널 규칙

- 검색창은 `#default` 영역 상단에 배치 (헤더는 브랜드+전역 제어만)
- 액션 항목은 배열 데이터 + `v-for`로 선언적 렌더링
- 축소 상태에서도 액션 유지 — 슬롯 자체를 숨기지 말고 하위 UI가 `collapsed`에 반응

## CSS 자산 경계

| 역할 | 위치 |
|------|------|
| raw token | `primitive.css` |
| semantic token | `semantic.css` |
| 전역 엔트리 + 지도 DOM | `base/main.css` |
| 공용 골격 (버튼·카드·입력) | `components/common.css` |
| 컴포넌트 CSS — templates | `components/templates/**` |
| 컴포넌트 CSS — molecules | `components/molecules/**` |
| 컴포넌트 CSS — organizations | `components/organizations/**` |
| 페이지 CSS | `pages/*.css` |

## 컴포넌트 설계 원칙

- **slot 우선** — 내용은 slot, 데이터는 props, 인터랙션은 emit
- **semantic token 우선** — 색상·글꼴·크기 하드코딩 금지, semantic 없으면 추가 먼저 검토
- **외부 CSS 분리** — `.vue` 안에 style 정의 금지, `<style scoped src="...">`만 사용
- **상태 클래스** — `.is-active`, `.is-collapsed` 등 의미 중심 이름 사용
- **공용 골격 통합** — 반복 UI는 `common.css` 블록으로, 개별 CSS는 modifier/변수 override만

## 새 컴포넌트 추가 절차

1. FSD 레이어 결정 (shared/entity/feature/widget) → 2. Flat/Compound 결정 → 3. props→slot→emit 설계 → 4. 외부 CSS 작성 + `style src` 연결 → 5. semantic token 참조 → 6. index.ts에 export 추가

## 점검 항목

- entity/shared UI가 외부 상태·다른 슬라이스에 의존하지 않는가
- feature UI가 같은 feature 내부의 api/model만 사용하는가
- widget이 하위 레이어(entity/feature)를 조합하는가
- CSS가 semantic token을 우선 참조하는가
- 중복 UI 골격이 `common.css`로 통합 가능한가
- `.vue` 안에 style 정의가 남아 있지 않은가
