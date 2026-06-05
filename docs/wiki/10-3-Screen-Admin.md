# 10-3. 관리자 대시보드 (`/admin`)

## 1. 개요

| 항목      | 값                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| 페이지 ID | `screen-admin`                                                                                              |
| 라우트    | `/admin`                                                                                                    |
| 파일      | `app/pages/admin/index.vue`                                                                                 |
| SSR       | `false`                                                                                                     |
| 목적      | 관리자/개발자용 카드 분기점 스켈레톤. 현재 `featureCards` 는 비어있고, 항목 추가 시 그리드 카드로 노출된다. |

## 2. 진입 경로

- 직접 URL 입력 (`/admin`)
- (의도된 구조) `featureCards` 의 `to` 라우트가 하위 도구로 이동
- 현재 별도 nav 엔트리 없음 — 관리자가 URL 로 진입

## 3. 화면 레이아웃

<!-- TODO(image): docs/wiki/images/screen-admin-empty.png — 빈 상태 안내 -->
<!-- TODO(image): docs/wiki/images/screen-admin-cards.png — featureCards 채워졌을 때 카드 그리드 -->

```
┌────────────────────────────────────────────────────────┐
│  관리자 대시보드                            [🌓 mode]  │
│  관리자/개발자용 운영 도구입니다.                       │
│                                                         │
│  (현재 — visibleCards.length === 0)                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │     추후 관리자 기능이 여기에 표시됩니다.         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  (항목 추가 시 — grid: 1 / sm:2 / lg:3)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ [icon]   │ │ [icon]   │ │ [icon]   │                │
│  │ Title    │ │ Title    │ │ Title    │  (hover:ring) │
│  │ desc...  │ │ desc...  │ │ desc...  │                │
│  └──────────┘ └──────────┘ └──────────┘                │
└────────────────────────────────────────────────────────┘
```

## 4. 컴포넌트 구성

| 영역             | 컴포넌트 / 코드                                                    | 책임                                |
| ---------------- | ------------------------------------------------------------------ | ----------------------------------- |
| 헤더             | `<h1>` + `UColorModeButton`                                        | 페이지 타이틀 / 테마 토글           |
| 빈 상태          | dashed border 안내                                                 | `visibleCards.length === 0` 시 안내 |
| 카드 그리드      | `v-for in visibleCards` × `UCard`                                  | 각 도구 카드                        |
| 카드 (링크 있음) | `NuxtLink` 로 감싼 `UCard` + `hover:ring-2 hover:ring-primary-500` | 클릭 시 `card.to` 로 이동           |
| 카드 (링크 없음) | 그냥 `UCard`                                                       | 표시만                              |
| 뱃지             | `UBadge` (옵션)                                                    | `card.badge()`, `card.badgeColor`   |

### 카드 인터페이스

```ts
interface AdminFeatureCard {
    key: string
    icon: string // i-lucide-* 등 UIcon name
    title: string
    description: string
    to?: string // 라우트 (없으면 표시만)
    badge?: () => string // 동적 뱃지 텍스트
    badgeColor?: string // UBadge color
    permission?: Permission // 미설정 시 모두 보임
}
```

## 5. 인터랙션

### 5-1. 권한 필터링

1. `useAuthStore.user` 에서 현재 사용자 role 조회
2. `visibleCards = featureCards.filter(c => !c.permission || hasPermission(user.value?.role, c.permission))`
3. 권한 미충족 카드는 렌더에서 제외

### 5-2. 카드 클릭

- `to` 가 있는 카드: `NuxtLink` 로 라우팅
- `to` 없는 카드: 정보 표시만 (hover ring 없음)

## 6. 데이터 / API

- 현재 페이지 자체는 API 호출 없음 (스켈레톤)
- 추후 추가될 카드들이 각자 자기 API 를 가짐
- 의존:
    - `useAuthStore.user` — 권한 분기
    - `shared/constants/permissions` — `Permission` 타입 + `hasPermission()`

## 7. 권한 / 비로그인 동작

| 상태               | 동작                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| 비로그인           | `user.value` 는 null. `card.permission` 이 있는 모든 카드 숨김. permission 없는 카드만 표시 |
| 일반 로그인        | role 기준 필터 — 일치하는 카드만 표시                                                       |
| 관리자 / developer | 권한 일치 카드 전부 표시                                                                    |

> 페이지 자체 접근은 막지 않음. 보호는 카드 단위(`permission`)로 처리. 보호 강화가 필요하면 `definePageMeta` 에 middleware 추가.

## 8. 관련 코드

- 페이지: `app/pages/admin/index.vue`
- 권한 유틸: `shared/constants/permissions.ts`
- 인증 store: `app/entities/user/model/useAuthStore.ts`

## 9. 관련 PR / 이슈

- 이 스켈레톤은 **epic #330 PR-H (#346)** 에서 `admin/seed` 제거 후 "추후 관리자 카드 분기점" 으로 재구성된 결과
- 과거 카드 (제거됨, `v2.0.0` 태그에서 조회 가능):
    - `admin/seed` — DB 시드 — PR #346
    - `admin/uml` — UML 다이어그램 페이지 — PR #339
    - `admin/curation` — 큐레이션 운영 — PR #344
