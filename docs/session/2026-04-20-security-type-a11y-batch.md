# 2026-04-20 보안·타입 안전성·접근성 일괄 수정

## 개요

수정 파일이 겹치지 않는 이슈 5건(#45, #54, #57, #34, #65)을 2회 배치로 병렬 처리했다.

## 1. 보안 강화

| Issue | 파일 | 수정 내용 |
|-------|------|-----------|
| #45 보안 헤더 부재 | `nuxt.config.ts` | nitro routeRules에 X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy 헤더 추가 |
| #54 Rate Limiting 전무 | `server/middleware/rate-limit.ts` (신규) | IP 기반 인메모리 sliding window rate limiter — auth 10/min, weather 30/min, 기타 API 60/min |

## 2. 코드 품질 개선

| Issue | 파일 | 수정 내용 |
|-------|------|-----------|
| #57 proxyRefs deprecated | `app/composables/useRouteMapFacade.ts` | `proxyRefs` 5곳을 `reactive()`로 교체 |
| #34 타입 안전성 | `shared/types/cesium.ts` | CesiumRuntime 생성자 12곳의 `any[]`를 구체 타입으로 교체 |
| #34 타입 안전성 | `shared/types/enum-base.ts` | `enumClass: object`를 `Record<string, unknown>`으로 강화 |
| #34 타입 안전성 | `useCameraViewSideeffect.ts` | `(v as any).screenSpaceCameraController` → 인터페이스 확장 후 직접 접근 |
| #34 타입 안전성 | `useFacilitySideeffect.ts` | `createClampedPoint/Label` 반환값의 `as any` 캐스트 제거 |
| #34 타입 안전성 | `useRouteDrawUtils.ts` | `addRoutePointEntity` 반환 타입을 `CesiumEntity`로 좁힘 |
| #34 타입 안전성 | `useRouteDrawSideeffect.ts`, `useRouteListSideeffect.ts` | `as CesiumEntity` 캐스트 제거 |

## 3. 키보드 접근성

| Issue | 파일 | 수정 내용 |
|-------|------|-----------|
| #65 접근성 부재 | `DrawRoutePanel.vue` | 섹션 카드에 `tabindex="0"`, `role="button"`, `@keydown.enter` 추가 |
| #65 접근성 부재 | `MapSidebar.vue` | `<div>` → `<nav role="navigation">`, footer에 `role="toolbar"` 추가 |
| #65 접근성 부재 | `app/assets/css/base/main.css` | `:focus-visible` 포커스 스타일 추가 |

ExplorePanel, FacilityOverlay는 이미 `<button>` 기반 컴포넌트 사용 중이라 변경 불필요.

## 변경 요약

- **닫은 이슈:** 5건 (#45, #54, #57, #34, #65)
- **수정 파일:** 13파일 (신규 1)
- **변경량:** +140 -31 lines
- **커밋:** `0e5fedd`, `3624faf`
