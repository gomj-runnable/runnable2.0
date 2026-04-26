# 2026-04-20 쉬운 이슈 일괄 수정 (2차)

## 개요

GitHub Issue 중 완료됨/stale 이슈 닫기 + 쉬운 이슈 코드 수정을 5-worker 팀으로 일괄 처리했다.

## 1. 이미 완료된 이슈 닫기 (4건)

| Issue | 사유 | 관련 커밋 |
|-------|------|-----------|
| #41 | `50e5423`에서 share 엔드포인트 `isPublic` 검증 추가 완료 | `50e5423` |
| #42 | `50e5423`에서 CSRF 동적 토큰 + 세션 폴백 제거 완료 | `50e5423` |
| #64 | WeatherOverlay.css, WeatherRecommendPanel.css에 spin 애니메이션 이미 존재 | 이전 세션 |
| #60 | `shared/types/sample-facilities.ts` → `shared/data/` 이미 이동 완료 | 이전 세션 |

## 2. Stale 이슈 닫기 (1건)

| Issue | 사유 |
|-------|------|
| #62 | FeedbackPanel.vue 삭제됨 (feedback→routeInfo 리네임 + dead code 삭제). clipboard 코드 없음 |

## 3. 코드 수정 — #63 sideeffect 생명주기 정리

| 파일 | 수정 내용 |
|------|-----------|
| `useRouteDrawSideeffect.ts` | `onBeforeUnmount`에서 `sectionPolylines.clear()` + `sectionPoints.clear()` |
| `useGradientSideeffect.ts` | watch stop handle 보관 + `onBeforeUnmount`에서 `stopWatch()` + `gradientPolylines.clear()` |
| `useElevationLayerSideeffect.ts` | watch stop handle 보관 + `onBeforeUnmount`에서 `stopWatch()` |
| `useBoundarySideeffect.ts` | watch stop handle 2개 보관 + `onBeforeUnmount`에서 `stopGuWatch()` + `stopDongWatch()` |

참고 패턴: `useFacilitySideeffect.ts:294-298`

## 4. 코드 수정 — #50 CSS 토큰 시스템 적용

FeedbackPanel → RouteInfo 리네임 반영.

| 파일 | 수정 내용 |
|------|-----------|
| `RouteInfoInputForm.vue` | CSS 클래스 `feedback-input-form` → `route-info-input-form` 리네임, `<style scoped>` → 외부 CSS |
| `RouteInfoMarkerPopup.vue` | CSS 클래스 `feedback-marker-popup` → `route-info-marker-popup` 리네임, `<style scoped>` → 외부 CSS |
| `RouteInfoInputForm.css` (신규) | 하드코딩 px/색상 → semantic 토큰 (`--gap-section-*`, `--text-body-*`, `--color-surface-*` 등) |
| `RouteInfoMarkerPopup.css` (신규) | 동일 토큰 적용 |

## 변경 요약

- **닫은 이슈:** 7건 (#41, #42, #64, #60, #62, #63, #50)
- **수정 파일:** 7파일 변경 + 2파일 신규 = 9파일
- **변경량:** +48 -167 lines
