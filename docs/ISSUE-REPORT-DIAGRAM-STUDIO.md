# Diagram Studio — 추가 개선 이슈 (날짜: 2026-05-07)

> 직전 세션에서 적용된 동적 라우트(`/admin/diagrams/[kind]`) / 모바일 반응형 / Layers 필터 / `/admin` 권한 확장 이후 남은 개선 항목.
> 본 세션에서 처리된 항목은 본 문서에 포함하지 않는다 (NuxtUI Alert 전환·`developer-gate` rename·키보드 가드·TODO A-3 resolved 표기 등).

## 우선순위: 높음

- [x] **#1 `/admin` 게이트 책임 분리 (역할 매트릭스 설계) ✅ resolved (2026-05-07)**
  - 배경: 현재 `layers/diagram-studio/app/middleware/developer-only.global.ts` 가 `/admin/**` 전체에 대해 `DEVELOPER(99)` 만 통과시킨다. 비-developer admin 페이지(예: 운영자 대시보드)가 추가되면 통째로 막혀버린다.
  - 제안: `ROLES`에 `ADMIN` 등 정수 값을 추가하고, `app/middleware/admin-only.global.ts` (root) 와 `layers/diagram-studio/app/middleware/developer-only.ts` (path-scoped, `/admin/diagrams/**` 만) 로 분리. layer는 layer 자신의 경로만 책임지도록 한다.
  - 영향 파일: `shared/constants/roles.ts`, `layers/diagram-studio/app/middleware/developer-only.global.ts`, `app/middleware/*` (신규), `app/plugins/developer-gate.client.ts`
  - 난이도: M
  - 처리 (#7과 동시 처리): `ROLES` 에 `ADMIN=50` 추가 + 위계 비교 헬퍼(`hasAdminAccess`/`hasDeveloperAccess`) export. `auth-gate.ts` 에 `defineAdminGate`/`isAdmin` 추가(기존 developer 시그니처 유지). root `app/middleware/admin-only.global.ts` 신규(`/admin/**` ≥50 게이트, DEVELOPER 자동 통과). layer 미들웨어는 `/admin/diagrams/**` 로 path 좁힘 → layer 자립. plugin 은 두 게이트를 모두 등록하며 in-flight 세션 fetch 캐싱으로 중복 호출 방지. seed/memoryStore 에 `admin@runnable.com` (role=50) 시드 추가.

- [x] **#2 prebuild 실패 시 fallback 부재 ✅ resolved (2026-05-07)**
  - 배경: `pnpm gen:diagrams` 가 깨지면 빌드 전체가 실패. CI/배포 차단 위험.
  - 제안: codegen 실패 시 빈 스켈레톤 JSON(`nodes: [], edges: []`) 을 emit + `meta.error` 필드 추가. 캔버스에서 NuxtUI `UAlert` 로 사용자 친화적 에러 표시.
  - 영향 파일: `layers/diagram-studio/scripts/gen-diagrams.ts` (또는 동등), `layers/diagram-studio/app/components/DiagramCanvas.vue`
  - 난이도: M
  - 처리: `gen-diagrams.ts` 의 `Promise.all` 을 분석기별 `safeRun()` 시퀀셜 실행으로 전환. 실패 시 `emptySkeleton(kind, error)` 로 빈 JSON 작성, stderr 에 `[diagram-studio] kind=<kind> generation failed: <msg>` 출력. `runtime/types.ts` 의 `DiagramJSON.meta` 에 `error?: string` 옵션 필드 추가. `DiagramCanvas.vue` 의 빈 상태 UAlert 에 `codegenError` 분기(warning 컬러 + 에러 코드 블록) 추가. 환경변수 `DIAGRAM_STUDIO_STRICT=1` 시 강제 throw. `pnpm gen:diagrams` 정상 케이스 회귀 0.

- [x] **#3 codegen analyzer 단위 테스트 부재 ✅ resolved (2026-05-07)**
  - 배경: 정규식 기반 분석기에 회귀가 발생해도 잡히지 않음. 동적 import / 재export / alias 호출 누락이 잠재 위험.
  - 제안: `layers/diagram-studio/scripts/__tests__/` 에 fixture 기반 vitest. 최소 5케이스(기본 import, 재export, 동적 import, alias, 빈 파일).
  - 영향 파일: `layers/diagram-studio/scripts/**`
  - 난이도: M
  - 처리: `__fixtures__/analyzers/app/composables/` 에 5케이스 fixture(`basic-import.ts`/`re-export.ts`/`dynamic-import.ts`/`alias-call.ts`/`empty.ts`) 추가. `__tests__/analyzers.test.ts` 12개 케이스로 `analyzeComposables` 회귀 검증. 동적 import 의 `mod.useFoo()` 는 calls 엣지로 잡히고, alias/재export 는 정규식 분석기의 알려진 한계(노드 누락)로 명시 검증.

## 우선순위: 중간

- [ ] **#4 NuxtUI 전환 보류 — `NodeDetailPanel` 메타 리스트**
  - 배경: NuxtUI 4 에는 `UDescriptionList` 가 존재하지 않는다(`search-components` 검색에서 미발견). 현재 `<dl>` 기반 구현은 ds-* 토큰과 결합돼 있어 `UCard`로 감싸도 디자인 변경 없음.
  - 제안: 그대로 유지. NuxtUI 가 description list 컴포넌트를 추가하면 재검토.
  - 영향 파일: `layers/diagram-studio/app/components/NodeDetailPanel.vue`
  - 난이도: S

- [ ] **#5 NuxtUI 전환 보류 — `DiagramLegend` UCheckboxGroup 의미적 전환**
  - 배경: 다중 선택 토글이라 `UCheckboxGroup` 가 의미적으로 더 정확하지만, 현 구현(둥근 pill + dot leading)은 Nuxt UI 체크박스 기본 디자인과 충돌. 토큰 재정의 부담 큼.
  - 제안: 디자인 회귀 위험으로 보류. `UButton + aria-pressed` 패턴 유지.
  - 영향 파일: `layers/diagram-studio/app/components/DiagramLegend.vue`
  - 난이도: M

- [ ] **#6 NuxtUI 전환 보류 — 사이드바 Shortcuts UTooltip 보강**
  - 배경: `UKbd` 옆 라벨이 이미 명시돼 있어 `UTooltip` 으로 감쌀 의미적 가치가 적음. 추가 시 hover 시 텍스트가 중복 노출됨.
  - 제안: 보류. 향후 단축키 도움말 모달(아래 #11)로 통합.
  - 영향 파일: `layers/diagram-studio/app/pages/admin/diagrams/[kind].vue`
  - 난이도: S

- [x] **#7 미들웨어 위치 — layer 내부 vs root ✅ resolved (2026-05-07)**
  - 배경: `developer-only.global.ts` 가 layer 내부에 있는데 효력은 root admin 전체. 책임 경계 혼선. root 로 옮기면 layer 만 떼어 쓸 때 가드가 사라지는 문제.
  - 제안: #1 (역할 매트릭스) 작업과 함께 root `app/middleware/admin-only.global.ts` 신설 + layer 측은 path-scoped 미들웨어로 변환.
  - 영향 파일: `layers/diagram-studio/app/middleware/developer-only.global.ts`, `app/middleware/*` (신규)
  - 난이도: M
  - 처리 (#1과 동시 처리): host 측 `app/middleware/admin-only.global.ts` 신규. layer 측 `developer-only.global.ts` 의 path 검사를 `/admin/diagrams` 로 좁혀 layer 자립 회복(다른 Nuxt 프로젝트에 extends 해도 자기 경로만 게이트). 두 미들웨어가 동시 적용되며 위계 포함 정책으로 DEVELOPER 는 양쪽 자동 통과.

- [x] **#8 manifest YAML zod 스키마 부재 ✅ resolved (2026-05-07)**
  - 배경: 현재 manifest 형식 오류는 codegen 런타임 stack trace 로만 표면화.
  - 제안: `layers/diagram-studio/manifests/__schemas/manifest.ts` 에 zod 스키마 정의 + `safeParse` 후 친절한 에러 메시지. 조기 실패 + 위치 표시.
  - 영향 파일: `layers/diagram-studio/manifests/**`, `layers/diagram-studio/scripts/**`
  - 난이도: S~M
  - 처리: `manifests/__schemas/manifest.ts` 에 zod 스키마 + `formatZodError` 추가. `scripts/lib/manifest.ts` 가 `safeParse` 후 한글 메시지로 throw.

- [ ] **#9 layer sandbox 재사용 검증 미실행**
  - 배경: layer 를 다른 Nuxt 프로젝트에 떼어 붙여 동작하는지 확인 안 됨. 호스트의 `developer-gate.client.ts` 의존이 강함.
  - 제안: 빈 Nuxt 프로젝트에 `extends: ['../diagram-studio']` 한 sandbox repo 또는 e2e 스크립트로 1회 검증.
  - 영향 파일: layer 전체 + 신규 sandbox
  - 난이도: M

- [x] **#10 노드 검색 highlight + zoom-to-fit 미구현 ✅ resolved (2026-05-07)**
  - 배경: `searchQuery` 가 `DiagramCanvas` 의 필터에만 사용됨. 일치 노드 강조(border/glow) + 자동 fitView 없음. TODO.md §B 체크리스트 항목과 직결.
  - 제안: 일치 노드에 `data.highlighted = true` 셋 후 ds-* 토큰 기반 outline 적용. fitView 시 일치 노드 bounding box 우선.
  - 영향 파일: `layers/diagram-studio/app/components/DiagramCanvas.vue`, `nodes/*Node.vue`
  - 난이도: M
  - 처리: 검색어 입력 시 일치 노드에 `ds-node-highlight` 클래스(VueFlow node wrapper) + `data.highlighted` 부여. 매칭 노드만 `fitView({ nodes, padding: 0.2 })` 호출. ds-accent 토큰 outline + glow 적용. 노드별 컴포넌트는 미수정(글로벌 스타일로 일괄 적용).

- [x] **#11 키보드 단축키 도움말 모달 (`?` 키) ✅ resolved (2026-05-07)**
  - 배경: 현재 사이드바 하단의 hint list 만 존재. 모바일에선 스크롤해야 보이고 hint 영역이 좁다.
  - 제안: `?` 키 또는 navbar 의 도움말 아이콘으로 `UModal` 열기. 단축키 / 그룹 색상 / 마우스 조작 한 번에 안내.
  - 영향 파일: `layers/diagram-studio/app/components/DashboardShell.vue` (트리거), 신규 `ShortcutsHelpModal.vue`, `useKeyboardShortcuts.ts` (`?` 핸들러)
  - 난이도: S
  - 처리: `ShortcutsHelpModal.vue` 신규 (UModal + 단축키/마우스/그룹 색상 3섹션). DashboardShell 메타 끝에 헬프 아이콘 버튼(`open-help` emit). useKeyboardShortcuts 에 `?` → `onHelpToggle` 콜백 추가. 페이지에서 `helpOpen` ref 로 v-model 바인딩.

## 우선순위: 낮음 / 향후

- [ ] **#12 pre-existing typecheck 에러 (별도 이슈)**
  - 배경: `shared/types/__tests__/weather-layer.enum.test.ts:65` `pm25` 관련. master 누적 에러. **본 작업 범위 외**.
  - 제안: weather-layer enum 책임자에게 별도 이슈로 이관.
  - 영향 파일: `shared/types/__tests__/weather-layer.enum.test.ts`
  - 난이도: S

- [x] **#13 dev 모드 watch 미지원 ✅ resolved (2026-05-07)**
  - 배경: 코드 변경 시 다이어그램이 즉시 반영되지 않고 prebuild 시점에만 갱신.
  - 제안: `nuxi dev` 실행 시 `chokidar` 로 manifests/소스 변경 감지 → debounce 후 codegen 재실행. 또는 `nuxt module` 형태 hook.
  - 영향 파일: `layers/diagram-studio/scripts/**`, `layers/diagram-studio/nuxt.config.ts`
  - 난이도: M
  - 처리: `gen-diagrams.ts` 를 `export async function generate(manifestPath, options)` 형태로 리팩터(기존 CLI 동작 호환). `layers/diagram-studio/nuxt.config.ts` 에 `hooks: { 'builder:watch': ... }` 추가 — `NODE_ENV=development` + `.ts/.tsx/.vue/.yaml/.yml` 확장자만 처리, `public/diagrams/` 변경은 무시(재진입 루프 차단), 300ms debounce, 동시 실행 가드. `pnpm exec nuxt prepare` 회귀 0.

- [ ] **#14 diagram JSON 캐시/staleness 정책 부재**
  - 배경: `useFetch('/diagrams/*.json')` 로만 가져옴. 빌드 시점 파일이라 사실상 immutable 이지만 SWR / version key 부재.
  - 제안: `meta.sourceCommit` 을 query string 으로 부착 (`?v=...`) + `useFetch` 의 `key` 옵션 활용.
  - 영향 파일: `layers/diagram-studio/app/composables/useDiagramData.ts`
  - 난이도: S
  - 보류: 현 구현은 path 기반 key 변경 시 자동 refetch. `meta.sourceCommit` 은 fetch 후에야 알 수 있어 query 부착 시 무한 루프 위험. 빌드 자산 immutable 가정 하에 path-key 만으로 충분 — 향후 dev watch(#13) 도입 시 재검토.

- [ ] **#15 모바일 사이드바를 NuxtUI 자체 모바일 처리에 위임 검토**
  - 배경: 현재 `DashboardShell.vue` 가 `mobileSidebarOpen` 수동 ref + CSS transform 으로 처리. NuxtUI 의 `UDashboardSidebar` 가 자체 모바일 토글 props 를 제공한다면 단순화 가능.
  - 제안: `mcp__nuxt-ui-remote__get-component` 로 `UDashboardSidebar` 의 `collapsible` / `mobileBreakpoint` 등 옵션 확인 후 마이그레이션.
  - 영향 파일: `layers/diagram-studio/app/components/DashboardShell.vue`
  - 난이도: S
  - 보류: props 매트릭스 조사 결과 `mode="slideover"` + `open` v-model + `autoClose` 로 위임 가능하나, 현 구조(280px 고정 + ds-* 토큰 강결합 + 햄버거 토글 + backdrop CSS)와 데스크탑/모바일 분기 회귀 위험. 별도 세션에서 mode 분기 테스트 후 진행 권장.

- [x] **#16 VueFlow MiniMap 색상 토큰 일치 ✅ resolved (2026-05-07)**
  - 배경: `<MiniMap />` 이 기본 색상으로 표시되어 ds-* 톤과 어긋남.
  - 제안: `node-color` / `mask-color` 슬롯 또는 prop 으로 ds-primary / ds-bg-elevated 매핑.
  - 영향 파일: `layers/diagram-studio/app/components/DiagramCanvas.vue`
  - 난이도: S
  - 처리: `<MiniMap node-color="#7c6af7" mask-color="rgba(8, 11, 15, 0.85)" pannable zoomable />` 적용. ds-bg 톤 일치 + entities 그룹 단색.

- [x] **#17 빈 그래프(0 노드)에 대한 친절한 안내 보강 ✅ resolved (2026-05-07)**
  - 배경: 본 세션에서 `UAlert + UKbd` 로 1차 개선됨. 다음 단계로 "어떤 manifest 가 비어 있는지" 진단 정보 추가 가능.
  - 제안: `meta.kind` 별 manifest 경로 안내 + 마지막 빌드 시간 표시.
  - 영향 파일: `layers/diagram-studio/app/components/DiagramCanvas.vue`
  - 난이도: S
  - 처리: `kind` prop 추가 + `manifestHint` / `lastBuildAt` computed. UAlert description 에 manifest 경로 코드 + 마지막 빌드 시간 표시.

- [x] **#18 다이어그램 메타(`generatedAt`) 시간대 표기 일관성 ✅ resolved (2026-05-07)**
  - 배경: `DashboardShell.vue` 가 `toLocaleString('ko-KR')` 로만 표시. 사용자 timezone 가정.
  - 제안: ISO 8601 `+09:00` 명시 또는 상대시간(`5분 전`). `UTooltip` 으로 절대시각 hover.
  - 영향 파일: `layers/diagram-studio/app/components/DashboardShell.vue`
  - 난이도: S
  - 처리: gen 메타 항목을 `<UTooltip :text="ISOString">` 으로 감싸 hover 시 절대시각(UTC ISO) 노출. 모바일은 NuxtUI 가 자동 비활성.

- [x] **#19 TODO.md A-1 (로그인 ID 형식) ✅ resolved (2026-05-07)**
  - 배경: 현재 `developer@runnable.com` 으로 저장. better-auth username 플러그인 도입 여부 미결정.
  - 결정: **A안 — 그대로 유지**. better-auth email-only 인증을 따른다. 추가 의존성/마이그레이션 없음.
  - 처리: 코드 변경 없음. 로그인 시 풀 email(`developer@runnable.com` / `admin@runnable.com`) 입력.
  - 영향 파일: 없음

- [x] **#20 TODO.md A-2 (시드 패스워드 평문) ✅ resolved (2026-05-07)**
  - 배경: dev 한정 평문 `developer1234`. 환경변수(`DEVELOPER_SEED_PASSWORD`) 분리 여부 미결정.
  - 처리: **이미 처리된 상태였음** — `.env.example` 에 `ADMIN_SEED_PASSWORD` + `DEVELOPER_SEED_PASSWORD` 정의, `seed.ts` / `memoryStore.ts` 모두 `process.env.*_SEED_PASSWORD` 로 읽음(평문 하드코딩 0). 본 세션에서 사실관계 확인 후 resolved 처리.
  - 영향 파일: 없음 (이미 적용됨)

- [ ] **#21 master admin(role=10) email 도메인 정책**
  - 배경: 기존 master admin 계정만 `admin@runnable.local` 도메인 사용. ADMIN(50)/DEVELOPER(99) 신규 계정은 모두 `@runnable.com`. 도메인 일관성 결여.
  - 제약: master admin email을 `admin@runnable.com` 으로 바꾸면 신규 ADMIN(role=50)과 email 충돌. 통일 시 `master@runnable.com` 같은 다른 prefix 필요. 단, 이미 운영 환경에 등록된 계정이라 변경 시 사용자 영향 발생.
  - 제안: dev 환경 한정으로만 통일하거나 그대로 유지. 사용자 결정 대기.
  - 영향 파일: `server/database/seed.ts`, `server/utils/memoryStore.ts` (있다면)
  - 난이도: S
