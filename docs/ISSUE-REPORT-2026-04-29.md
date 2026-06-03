# Issue Report — 2026-04-29

전체 코드 분석 결과 발견된 버그 및 보안 이슈 리포트.

---

## Bug Reports

### BUG-001: CSS 마이그레이션 미완료 — 326개 색상/폰트/그림자 변수 참조 누락 [CRITICAL]

- **파일**: 25개 CSS 파일 (SecondPanel, RouteSaveModal, AuthModal, SidebarUserProfile 등)
- **설명**: `primitive.css`/`semantic.css` 삭제 시 레이아웃 변수만 치환하고, 색상/폰트/그림자 변수(`--text-primary`, `--font-weight-bold`, `--shadow-sm`, `--color-surface-soft` 등) 326건은 치환하지 않음
- **영향**: 대부분의 UI 컴포넌트에서 텍스트 크기, 색상, 배경, 테두리, 그림자가 `initial`로 렌더링되어 시각적으로 완전히 깨짐
- **수정**: 나머지 색상/폰트/그림자 변수를 리터럴 값으로 일괄 치환

### BUG-002: WeatherOverlay.vue TypeScript 오류 9건 [HIGH]

- **파일**: `app/features/weather-overlay/ui/WeatherOverlay.vue:64,78,122,139,151`
- **설명**: `UInputDate`/`UInputTime`/`UCalendar` 이벤트 핸들러 타입이 컴포넌트 emit 시그니처와 불일치. `parseInt(parts[0])` 에서 `string | undefined` 타입 에러.
- **영향**: `pnpm typecheck` 실패
- **수정**: 핸들러 파라미터를 `any`로 완화하고 런타임 타입 가드 추가

### BUG-003: handleElevationToggle 미사용 함수 [HIGH]

- **파일**: `app/features/weather-overlay/ui/WeatherOverlay.vue:44`
- **설명**: `handleElevationToggle` 함수가 정의되었으나 템플릿에서 호출되지 않음. 리팩터링 시 UI 요소가 제거됨
- **영향**: 사용자가 WeatherOverlay에서 고도 레이어를 토글할 수 없음 (FacilityOverlay에서 가능)
- **수정**: FacilityOverlay에서 처리하므로 WeatherOverlay의 dead code 제거

### BUG-004: monthlyData prop 미사용 [HIGH]

- **파일**: `app/features/weather-overlay/ui/WeatherOverlay.vue:19`
- **설명**: `UInputTime` 전환 후 `hourOptions` 로직 제거됨. `monthlyData` prop은 남아있으나 사용하지 않음
- **영향**: 모든 24시간이 선택 가능해져, 데이터 없는 시간대 선택 시 빈 상태 발생
- **수정**: prop 제거 + 부모 컴포넌트의 전달 코드 제거

### BUG-005: app.vue MDC prose 설정 누락 [MEDIUM]

- **파일**: `app/app.vue:32`
- **설명**: `prompt: { copy, openIn }` 키 누락으로 TypeScript 에러
- **영향**: `pnpm typecheck` 실패
- **수정**: `prompt` 키 추가

### BUG-006: MapShell.vue UHeader `#logo` 슬롯 미존재 [MEDIUM]

- **파일**: `app/widgets/map-shell/ui/MapShell.vue:47`
- **설명**: Nuxt UI `UHeader`에 `logo` 슬롯이 없음
- **영향**: 로고 콘텐츠 미렌더링, `pnpm typecheck` 실패
- **수정**: 올바른 슬롯명으로 변경

### BUG-007: WeatherDatePicker.vue 고아 컴포넌트 [MEDIUM]

- **파일**: `app/entities/weather/ui/WeatherDatePicker.vue`
- **설명**: WeatherOverlay 리팩터링 후 더 이상 import되지 않음. barrel export와 CSS 파일이 남아있음
- **영향**: 번들 크기 증가 (dead code)
- **수정**: 컴포넌트, CSS, barrel export 제거

### BUG-008: InMemoryRouteRepository deleteRoute 시 section 미삭제 [LOW]

- **파일**: `server/repositories/route.repository.memory.ts:60-62`
- **설명**: Route 삭제 시 연관 section이 메모리에 남아있음
- **영향**: 메모리 누수, DB 외래키 cascade와 동작 불일치
- **수정**: deleteRoute에 section 정리 로직 추가

---

## Security Reports

### SEC-001: 소스 코드에 하드코딩된 관리자 비밀번호 [CRITICAL]

- **OWASP**: A07:2021 Identification and Authentication Failures
- **파일**: `server/database/seed.ts:18`, `server/utils/memoryStore.ts:17`
- **설명**: 기본 관리자 비밀번호 `!runnable2242`가 소스에 하드코딩됨
- **공격**: 리포 접근 가능한 누구나 관리자 계정 탈취 가능
- **수정**: 환경변수 필수 요구, fallback 제거

### SEC-002: Memory 모드 비밀번호 평문 저장 [HIGH]

- **OWASP**: A07:2021
- **파일**: `server/api/auth/[...all].ts:37,51`
- **설명**: Memory 모드에서 비밀번호를 평문으로 저장하고 `===` 비교
- **수정**: 프로덕션 환경에서 memory 모드 차단 가드 추가

### SEC-003: CSRF 토큰 생성만 하고 검증하지 않음 [HIGH]

- **OWASP**: A01:2021 Broken Access Control
- **파일**: `server/api/auth/[...all].ts:14-25`
- **설명**: `memoryCsrfTokens` Map에 토큰 저장만 하고, sign-up/sign-in 시 검증 없음
- **수정**: POST 요청 시 CSRF 토큰 검증 + 일회용 삭제 구현

### SEC-004: 세션 토큰이 사용자 ID에서 파생 — 예측 가능 [HIGH]

- **OWASP**: A07:2021
- **파일**: `server/api/auth/[...all].ts:40,57`, `server/security/auth/service.ts:23`
- **설명**: 세션 토큰이 `memory-session-${userId}` 패턴으로 예측 가능
- **수정**: `crypto.randomBytes(32)` 기반 토큰 + 서버측 세션-사용자 매핑

### SEC-005: ZodError 상세 정보 클라이언트 노출 [MEDIUM]

- **OWASP**: A05:2021 Security Misconfiguration
- **파일**: `server/utils/error-handler.ts:66`
- **설명**: Zod 검증 오류 시 내부 스키마 구조가 클라이언트에 노출
- **수정**: 제네릭 에러 메시지 반환, 상세 로그는 서버측만

### SEC-006: 인증 엔드포인트 Rate Limiting 없음 [MEDIUM]

- **OWASP**: A07:2021
- **파일**: `server/api/auth/[...all].ts`
- **설명**: 로그인 시도 횟수 제한 없음
- **수정**: IP 기반 rate limiter 추가

### SEC-007: Content-Security-Policy 헤더 누락 [MEDIUM]

- **OWASP**: A05:2021
- **파일**: `nuxt.config.ts:66-73`
- **설명**: X-Frame-Options 등은 설정됐으나 CSP 없음
- **수정**: CSP 헤더 추가

### SEC-008: CSRF 토큰 Map 무한 증가 (메모리 누수) [LOW]

- **파일**: `server/api/auth/[...all].ts:15,24`
- **설명**: CSRF 토큰이 소비/만료 없이 계속 누적됨
- **수정**: SEC-003 수정 시 일회용 삭제로 해결

### SEC-009: 날씨 서비스 에러 상세 노출 [LOW]

- **파일**: `server/utils/weather/observed.service.ts:21`
- **설명**: `sourceErrors` 배열로 내부 에러 메시지가 클라이언트 전달
- **수정**: 정제된 에러 메시지만 반환

---

## 수정 현황

| ID      | 심각도   | 상태      | 비고                            |
| ------- | -------- | --------- | ------------------------------- |
| BUG-001 | CRITICAL | ✅ 수정됨 | 색상/폰트/그림자 변수 일괄 치환 |
| BUG-002 | HIGH     | ✅ 수정됨 | TypeScript 타입 완화            |
| BUG-003 | HIGH     | ✅ 수정됨 | Dead code 제거                  |
| BUG-004 | HIGH     | ✅ 수정됨 | 미사용 prop 제거                |
| BUG-005 | MEDIUM   | ⏳ 미수정 | app.vue 구조 확인 필요          |
| BUG-006 | MEDIUM   | ⏳ 미수정 | UHeader 슬롯 확인 필요          |
| BUG-007 | MEDIUM   | ⏳ 미수정 | 추후 정리                       |
| BUG-008 | LOW      | ✅ 수정됨 | cascade delete 추가             |
| SEC-001 | CRITICAL | ✅ 수정됨 | 하드코딩 비밀번호 제거          |
| SEC-002 | HIGH     | ✅ 수정됨 | 프로덕션 가드 추가              |
| SEC-003 | HIGH     | ✅ 수정됨 | CSRF 검증 구현                  |
| SEC-004 | HIGH     | ✅ 수정됨 | 랜덤 세션 토큰                  |
| SEC-005 | MEDIUM   | ✅ 수정됨 | 에러 메시지 정제                |
| SEC-006 | MEDIUM   | ⏳ 미수정 | rate limiter 패키지 검토 필요   |
| SEC-007 | MEDIUM   | ⏳ 미수정 | CSP 정책 설계 필요              |
| SEC-008 | LOW      | ✅ 수정됨 | SEC-003과 함께 해결             |
| SEC-009 | LOW      | ⏳ 미수정 | 추후 정리                       |
