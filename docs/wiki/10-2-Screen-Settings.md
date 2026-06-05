# 10-2. 플러그인 설정 (`/settings`)

## 1. 개요

| 항목      | 값                                                                    |
| --------- | --------------------------------------------------------------------- |
| 페이지 ID | `screen-settings`                                                     |
| 라우트    | `/settings`                                                           |
| 파일      | `app/pages/settings.vue`                                              |
| SSR       | `false`                                                               |
| 목적      | 로그인 사용자가 자신의 플러그인 활성 상태를 켜고 끈다. epic #350 PR3. |

## 2. 진입 경로

- 직접 URL 입력 (`/settings`)
- (후속) 메인 페이지 sidebar 또는 PluginLauncher 에 nav 엔트리 추가 예정 — epic #350 후속 항목

## 3. 화면 레이아웃

<!-- TODO(image): docs/wiki/images/screen-settings-list.png — 플러그인 카드 리스트 + 토글 -->

```
┌────────────────────────────────────────────────────────┐
│  플러그인 설정                              [🌓 mode]  │
│  사용할 플러그인을 켜고 끌 수 있습니다.                 │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 인도 (sidewalk)                            [●OFF]│ │
│  │ 인도(보행로) GeoJSON 오버레이를 표시합니다.       │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 탐색 (explore)                              [ON●]│ │
│  │ 서울 25개 구별 공개 경로 목록을 봅니다.           │ │
│  └───────────────────────────────────────────────────┘ │
│  …                                                      │
└────────────────────────────────────────────────────────┘
```

- 컨테이너 폭: `max-w-2xl`, 중앙 정렬
- 헤더: 제목 + 부제 + 다크모드 토글 (`UColorModeButton`)
- 본문: `pluginRegistry` 순회 → 각 플러그인을 `UCard` + `USwitch` 로 렌더

## 4. 컴포넌트 구성

| 영역          | 컴포넌트 / 코드                       | 책임                          |
| ------------- | ------------------------------------- | ----------------------------- |
| 헤더          | `<h1>` + `UColorModeButton`           | 페이지 타이틀 / 테마 토글     |
| 로딩 상태     | `<div v-if="loading">불러오는 중…`    | 초기 fetch 대기               |
| 비로그인 상태 | dashed border 안내 + `UButton to="/"` | "지도로 이동" 유도            |
| 빈 레지스트리 | dashed border 안내                    | "등록된 플러그인이 없습니다." |
| 토글 카드     | `UCard` per `plugin` × `USwitch`      | 토글 인터랙션                 |

## 5. 인터랙션

### 5-1. 초기 로딩

1. `onMounted` → `fetchSession()` (better-auth 세션 확인)
2. 로그인 상태면 `loadPrefs()` 호출 → `GET /api/me/feature-prefs`
3. 응답을 `pluginRegistry` 순회로 머지 — 저장된 pref 가 있으면 그 값, 없으면 `defaultEnabled`
4. 로딩 종료

### 5-2. 토글

1. `USwitch @update:model-value` → `onToggle(pluginId, value)`
2. **낙관적 업데이트**: `enabledMap[pluginId] = value` 즉시 반영, `saving[pluginId] = true` 로 스위치 비활성
3. `PUT /api/me/feature-prefs` 호출
4. 실패 시 이전 값으로 롤백 + 에러 토스트 (`useToast`)
5. 성공/실패와 무관하게 `saving[pluginId] = false`

### 5-3. 실패 케이스

| 케이스             | 처리                                       |
| ------------------ | ------------------------------------------ |
| `loadPrefs()` 실패 | 토스트 "불러오기 실패" + 로딩 종료 (빈 맵) |
| `onToggle` 실패    | 이전 값 롤백 + 토스트 "저장 실패"          |

## 6. 데이터 / API

| 의존                        | 형태                                             |
| --------------------------- | ------------------------------------------------ |
| `GET /api/me/feature-prefs` | `FeaturePref[]` (`{ pluginId, enabled }`)        |
| `PUT /api/me/feature-prefs` | body `{ pluginId, enabled }`                     |
| `pluginRegistry`            | `app/plugins-ext/registry.ts` (정적 import 배열) |
| `useAuthStore`              | 로그인 여부                                      |
| `useAuthSideeffect`         | `fetchSession()`                                 |

서버 측 영속: `user_feature_prefs` 테이블 (epic #350 PR2).
권한: `requireSession` 미들웨어로 보호됨.

## 7. 권한 / 비로그인 동작

| 상태                     | 표시                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| 로딩 중                  | "불러오는 중…"                                                           |
| 비로그인                 | "로그인이 필요합니다." + "지도로 이동" 버튼 (홈에서 AuthModal 호출 유도) |
| 로그인 + 빈 레지스트리   | "등록된 플러그인이 없습니다."                                            |
| 로그인 + 레지스트리 있음 | 카드 리스트 + 토글                                                       |

## 8. 관련 코드

- 페이지: `app/pages/settings.vue`
- 레지스트리: `app/plugins-ext/registry.ts`, manifest 들 `app/plugins-ext/{name}/plugin.manifest.ts`
- 활성 판정: `app/plugins-ext/usePluginPrefs.ts` (홈에서 `PluginSlot` 이 사용)
- 서버:
    - `server/api/me/feature-prefs/index.get.ts`, `index.put.ts`
    - `server/database/schema/user-feature-prefs.ts`
    - Repository: `server/repositories/userFeaturePrefs/*`

## 9. 관련 PR / 이슈

- PR1 #352 — 토대 (manifest/registry/PluginSlot/데모 chip)
- PR2 #354 — `user_feature_prefs` + Repository + API
- **PR3 #356 — `/settings` 토글 페이지 (본 화면)**
- PR4 #358 — `PluginSlot` 이 `usePluginPrefs` 로 필터
- 후속(선택) — `/settings` 진입 nav 엔트리 추가
