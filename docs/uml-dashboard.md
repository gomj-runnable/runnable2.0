# UML Dashboard (`/dev/uml`)

Nuxt 3 + Nitro 단일 코드베이스에서, **에이전트가 채워 넣은 코드를 직접 읽지 않고도 구조를 시각적으로 파악**하기 위한 내부 개발 대시보드입니다.

## 1. 접근

- 라우트: `/dev/uml`
- 게이트: **개발 환경(`import.meta.dev`)** + **DEVELOPER(99) 권한**을 동시에 만족해야 진입할 수 있습니다.
    - production 빌드에서는 404
    - 권한 없는 사용자는 `/` 로 리다이렉트
- 서버 API(`/api/uml/*`)도 동일하게 production 에서는 404

## 2. 화면 구성

```
UDashboardGroup
├── UDashboardSidebar  ← Feature 토글 사이드 패널
└── UDashboardPanel
    ├── UDashboardNavbar
    ├── UTabs           ← Frontend / Backend / Architecture
    └── 본문
        ├── 분석 컨트롤 (다이어그램 종류 + 분석 실행 버튼)
        └── 활성 Feature 별 UCard + Mermaid 다이어그램
```

- 사이드 패널: 현재 활성 도메인 탭의 Feature 만 표시 (검색·전체 선택/해제·재스캔)
- 활성 상태는 도메인별로 분리되어 `localStorage.uml:active` 에 영속
- 다크모드는 `useColorMode()` 와 연동, Mermaid theme 이 `default` ↔ `dark` 로 동적 전환
- Mermaid 렌더링은 SSR 회피를 위해 `<ClientOnly>` 래핑, fallback 은 `USkeleton`

## 3. Feature 탐지 휴리스틱

탐지 결과는 `.omc/uml-cache/features.json` 에 캐시되며, "재스캔" 버튼으로 갱신할 수 있습니다.

### Frontend

- `app/pages/<dir>` 각 하위 디렉터리 — 라우트 그룹 단위 Feature
- `app/widgets/<dir>` — FSD widget 단위
- `app/features/<dir>` — FSD feature 단위
- `app/entities/<dir>` — FSD entity 단위
- `app/pages/index.vue` 등 최상위 라우트는 별도 가상 Feature `frontend:pages:_root` 로 노출

### Backend

- `server/api/<dir>` — 리소스 그룹별 라우트
- `server/services/<dir>`, `server/repositories/<dir>`, `server/database/<dir>`, `server/utils/<dir>` — 도메인별 모듈 그룹

### Architecture (고정 카테고리)

- `runtime` — `nuxt.config.ts`, `app/plugins`, `app/middleware`, `server/plugins`, `server/middleware`
- `dependencies` — `package.json` 프로덕션 의존성
- `dev-tools` — `package.json` devDependencies, eslint/vitest/tsconfig 설정
- `data-layer` — `server/database`, `server/repositories`
- `external-services` — `server/services`

> 자동 탐지가 부정확할 수 있으므로, 사용자가 수동으로 Feature 를 추가/편집/병합하는 기능은 후속 작업에서 다룹니다.

## 4. 다이어그램 종류

| 도메인       | 지원 종류    | 설명                                                   |
| ------------ | ------------ | ------------------------------------------------------ |
| frontend     | `flowchart`  | Feature 내부 파일 간 import 그래프                     |
| frontend     | `class`      | 컴포넌트/모듈의 export·props·emits 시그니처 요약       |
| backend      | `class`      | 라우트 핸들러/서비스/모델의 export 시그니처            |
| backend      | `sequence`   | API 핸들러 → service/repository/utils 호출 흐름        |
| architecture | `flowchart`  | Feature 경로 하위 파일을 디렉터리 단위로 그룹화한 트리 |
| architecture | `dependency` | `package.json` 의존성 트리 (deps / devDeps)            |

- 변환은 `ts-morph` 기반 AST + 휴리스틱
- `p-limit` 으로 동시 분석 4개 제한
- 결과는 `.omc/uml-cache/<domain>/<featureId>.mmd` 에 캐시 (디버깅용; 갱신은 API 호출마다 덮어씀)

## 5. 캐시 위치

| 종류                | 경로                                      |
| ------------------- | ----------------------------------------- |
| Feature 메타데이터  | `.omc/uml-cache/features.json`            |
| 도메인별 다이어그램 | `.omc/uml-cache/<domain>/<featureId>.mmd` |

`/api/uml/features/rescan` 또는 사이드 패널 "재스캔" 버튼으로 features 캐시를 갱신할 수 있습니다.

## 6. API

| Method | Path                       | 설명                             |
| ------ | -------------------------- | -------------------------------- |
| GET    | `/api/uml/features`        | Feature 목록 (없으면 자동 탐지)  |
| POST   | `/api/uml/features/rescan` | Feature 강제 재탐지              |
| POST   | `/api/uml/analyze`         | 선택된 Feature 들의 Mermaid 생성 |

`/api/uml/analyze` 요청 body (Zod 검증):

```ts
{
  domain: 'frontend' | 'backend' | 'architecture'
  featureIds: string[]                                     // 1..50
  diagramType: 'class' | 'flowchart' | 'sequence' | 'dependency'
}
```

응답:

```ts
Array<{
    featureId: string
    mermaid: string
    error?: string
}>
```

## 7. 사용 흐름

1. `pnpm dev` 후 `http://localhost:3000/dev/uml`
2. DEVELOPER 계정으로 로그인 (`developer@runnable.com` / `developer1234`)
3. 도메인 탭 선택 → 사이드 패널에서 Feature 토글 → 다이어그램 종류 선택 → "분석 실행"
4. 결과가 Feature 별 카드로 렌더링됨

## 8. 제한·후속 작업

- 노드 클릭 → 소스 보기 UModal: 본 작업 범위에서는 보류 (Mermaid SVG 클릭 핸들러 등록 + Shiki 코드 하이라이팅 필요)
- 수동 Feature 편집/병합 UI: 본 작업 범위에서 미포함
- LLM 보강 변환: AST 1차 결과를 우선하며, optional 단계
