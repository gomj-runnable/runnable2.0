# 2026-04-19 쉬운 이슈 일괄 수정

## 개요

GitHub Issue 중 변경량이 적은 이슈 11건을 2개 커밋으로 일괄 수정했다.

## 커밋 1: `bb5b6e6`

| Issue | 내용 | 파일 |
|-------|------|------|
| #67 | MapShell `<aside>` 2곳에 `aria-label` 추가 | `MapShell.vue` |
| #46 | docker-compose app 서비스에 `env_file: .env` 추가 | `docker-compose.yml` |
| #44 | 메모리 모드 세션 쿠키에 `httpOnly`/`secure`/`sameSite`/`maxAge` 보안 속성 추가 | `server/api/auth/[...all].ts` |
| #49 | `useExploreSearchSideeffect` 빈 catch 블록에 `console.error` 에러 로깅 추가 | `useExploreSearchSideeffect.ts` |
| #61 | 미사용 `UserRunnerFields`, `ROLES`, `DEFAULT_ROUTE_OPTIMIZATION_MODE` 삭제 | `user.ts` 삭제, `roles.ts` 삭제, `route.ts` 부분 삭제 |

**변경량:** 7파일, +7/-25 lines

## 커밋 2: `810d688`

| Issue | 내용 | 파일 |
|-------|------|------|
| #66 | `useFacilitySideeffect` Set deep watch → computed key 리팩터 | `useFacilitySideeffect.ts` |
| #59 | `NodeAttribute`/`ThemeMapAttribute` 공통 필드를 `BaseAttribute`로 추출 | `theme-map.ts` |
| #56 | `share/[routeId].vue` `Record<string, unknown>` → `SavedRoute`/`SavedSection` 타입 적용 + 캐스팅 제거 | `share/[routeId].vue` |
| #53 | `optimize.post.ts`, `sections.get.ts`에 `requireSession` 인증 + 소유권 검증 추가 | `optimize.post.ts`, `sections.get.ts` |
| #51 | `geoJsonPointSchema` 3D 좌표 + `createRouteSchema`에 `isPublic` 통합 + 서버 `.extend()` 제거 | `route.schema.ts`, `index.post.ts` |
| #47 | 하드코딩 관리자 비밀번호를 `process.env.ADMIN_SEED_PASSWORD`로 교체 | `seed.ts`, `memoryStore.ts` |

**변경량:** 9파일, +32/-26 lines

## 카테고리별 분류

### 보안
- #44 쿠키 보안 속성
- #47 하드코딩 비밀번호 제거
- #53 API 인증 누락 수정

### 리팩터
- #59 중복 인터페이스 통합
- #61 dead code 삭제
- #66 deep watch → computed key

### 타입 안전성
- #51 스키마-타입 정합성
- #56 느슨한 타입 → 도메인 타입

### 접근성
- #67 aria-label 추가

### 인프라
- #46 docker-compose 환경변수

### 에러 처리
- #49 검색 에러 로깅
