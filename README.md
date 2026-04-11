# Runnable

Cesium 3D 지도 기반 러닝 경로 제작 서비스.
경로를 그리고, 저장하고, 다른 사용자의 경로를 탐색할 수 있다.

---

## 주요 기능

### 경로 제작
- Cesium 3D 지도 위에서 러닝 경로를 직접 그리기
- 구간별 속성 관리 (이름, 설명)
- 고도 프로파일 시각화 (최고/최저 고도, 누적 상승/하강)
- GPX 파일 다운로드

### 계정 관리
- 이메일/비밀번호 기반 회원가입 및 로그인 (better-auth)
- 세션 기반 인증 (30일 유지)
- 경로 저장 시 사용자 계정과 자동 매핑
- 미로그인 상태에서 저장 시 로그인 유도

### 경로 탐색
- 다른 사용자가 공개한 경로를 검색
- 제목/설명 기반 검색, 작성자명 표시
- 공개 경로 선택 시 지도에 미리보기 + 고도 그래프

### 날씨 정보
- 서울 25개 구별 시간대별 날씨 오버레이
- 기상청 관측 데이터 + 동네예보 병합
- 에어코리아 실시간 미세먼지(PM10) 연동 (1시간 캐싱)
- 날씨/기온/미세먼지 레이어 전환

### 편의시설
- 지도 위 주변 편의시설 표시
- 시설 유형별 필터링

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Nuxt 4 / Vue 3 |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 / Nuxt UI v3 |
| 지도 | Cesium / MapPrime |
| ORM | Drizzle ORM |
| 데이터베이스 | PostgreSQL |
| 인증 | better-auth |
| CI/CD | GitHub Actions |
| 패키지 관리 | pnpm |
| 컨테이너 | Docker |

---

## 시작 방법

### 사전 요구사항

- Node.js 20+
- pnpm 10.x
- Docker (PostgreSQL용)

### 설치 및 실행

```bash
# 패키지 매니저 활성화
corepack enable
corepack prepare pnpm@10.28.2 --activate

# 환경변수 설정
cp .env.example .env

# 의존성 설치
pnpm install

# PostgreSQL 실행
docker-compose up -d db

# DB 스키마 반영
npx drizzle-kit push

# 개발 서버 실행
pnpm dev
```

브라우저에서 http://localhost:3000 으로 접속한다.

### 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과 미리보기 |
| `pnpm lint` | ESLint 검사 |
| `pnpm lint:fix` | ESLint 자동 수정 |
| `pnpm typecheck` | Nuxt 타입 검사 |
| `pnpm seed` | 시드 데이터 입력 |
| `npx drizzle-kit push` | DB 스키마 동기화 |
| `npx drizzle-kit generate` | 마이그레이션 파일 생성 |

### 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 URL | O |
| `BETTER_AUTH_SECRET` | 인증 시크릿 키 | O |
| `BETTER_AUTH_URL` | 앱 기본 URL | O |
| `MAPPRIME_BASE_URL` | MapPrime 지도 서버 주소 | O |
| `WEATHER_KOR` | 기상청 API Hub 인증키 | - |
| `OPEN_DATA` | 공공데이터포털 인증키 (동네예보 + 에어코리아) | - |

---

## 디렉터리 구조

```
runnable/
├── app/                        # 프론트엔드
│   ├── pages/                  # 라우트 페이지 (화면 조합만 담당)
│   ├── components/map/         # 지도 UI 컴포넌트
│   │   ├── atoms/              #   최소 단위 입력 (Textfield)
│   │   ├── molecules/          #   조합형 컴포넌트 (Button, ChipButton, Profile)
│   │   ├── organizations/      #   조직 단위 (Card)
│   │   └── templates/          #   페이지 조합 (MapShell, AuthModal, ExplorePanel)
│   ├── composables/            # 상태·로직·부수효과 분리
│   │   ├── action/             #   순수 계산 (변환, 포맷, 트리 탐색)
│   │   ├── sideeffect/         #   외부 연동 (API, 지도 엔진, 브라우저)
│   │   └── store/              #   공유 상태 관리 (useState 기반)
│   └── assets/css/             # 디자인 토큰·컴포넌트 CSS
│       ├── base/               #   primitive.css → semantic.css → main.css
│       ├── components/         #   컴포넌트별 외부 CSS
│       └── pages/              #   페이지 조합 CSS
│
├── server/                     # 백엔드
│   ├── api/                    # API 엔드포인트
│   │   ├── auth/               #   better-auth 핸들러
│   │   ├── routes/             #   경로 CRUD + 검색
│   │   ├── weather/            #   날씨 API
│   │   └── boundary/           #   행정경계 GeoJSON
│   ├── database/
│   │   ├── schema/             #   Drizzle 테이블 정의 (users, routes, route_sections)
│   │   └── migrations/         #   DB 마이그레이션 파일
│   ├── repositories/           # 데이터 접근 계층 (인터페이스 + 구현체)
│   └── utils/                  # 공통 유틸리티
│       └── weather/            #   날씨 파이프라인 (observed, forecast, airquality, merge)
│
├── shared/                     # 프론트/백 공용 코드
│   ├── types/                  #   도메인 타입 (route, weather, geojson)
│   ├── schemas/                #   Zod 런타임 검증 스키마
│   ├── constants/              #   상수 정의
│   └── data/                   #   샘플·시드 데이터
│
├── lib/                        # 외부 라이브러리 (Cesium 정적 자산)
├── .github/workflows/          # CI/CD 파이프라인
└── public/                     # 정적 자료
```

---

## 코드 컨벤션

### 컴포넌트 설계 (Atomic Design)

컴포넌트는 `app/components/<page>/` 아래에 4단계 계층으로 분류한다.

| 계층 | 디렉터리 | 역할 | 예시 |
|------|----------|------|------|
| Atom | `atoms/` | 최소 단위 입력 요소 | `Textfield` |
| Molecule | `molecules/` | Atom을 조합한 독립 UI | `Button`, `IconButton`, `ChipButton` |
| Organization | `organizations/` | 도메인 의미가 있는 카드·리스트 | `Card` |
| Template | `templates/` | 페이지를 구성하는 Shell·Panel·Modal | `MapShell`, `AuthModal`, `ExplorePanel` |

- `pages/`는 화면 조합과 초기 진입만 담당한다. 로직은 composable에 위임한다.
- 브라우저 전용 지도 페이지는 `definePageMeta({ ssr: false })`를 설정한다.

### Composable 분리 원칙

`app/composables/`는 책임별로 세 디렉터리로 분리한다.

| 디렉터리 | 책임 | 금지 사항 |
|----------|------|-----------|
| `action/` | 순수 계산 (변환, 포맷, 트리 탐색) | 외부 API 호출, 전역 상태 저장, 브라우저 IO |
| `sideeffect/` | 외부 연동 (API, 지도 엔진, 타이머) | 상태를 직접 소유 (store와 연결하거나 결과를 반환) |
| `store/` | 공유 상태 관리 (useState 기반) | 외부 통신 직접 수행 |

하나의 composable이 여러 책임을 동시에 가지지 않도록 한다.

### CSS 토큰 계층

디자인 토큰은 3단계 계층을 유지한다.

```
primitive.css  →  semantic.css  →  컴포넌트 CSS
(값 자체)        (역할 이름)       (실제 UI 규칙)
```

- `primitive.css`: raw value 토큰 (`--color-blue-500`, `--gap-4`)
- `semantic.css`: primitive를 역할로 재매핑 (`--color-surface-canvas`, `--text-primary`)
- 컴포넌트 CSS: 토큰 정의보다 UI 규칙을 우선. 반복 값은 semantic 토큰 추가를 먼저 검토

### 백엔드 패턴

| 영역 | 규칙 |
|------|------|
| Repository | 인터페이스(`route.repository.ts`)와 구현체(`route.repository.drizzle.ts`)를 분리. 의존성 역전 원칙 |
| API 인증 | `server/utils/session.ts`의 `requireSession()` / `getSessionUser()` 사용 |
| 소유자 검증 | 수정/삭제 API에서 `route.userId !== user.userId` 시 403 반환 |
| 외부 API | `server/utils/weather/` 어댑터 패턴. 원본 Response 클래스 + Local Response 분리 |
| 스키마 | Drizzle 테이블은 `server/database/schema/`. Zod 검증은 `shared/schemas/` |

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `MapShell.vue`, `AuthModal.vue` |
| Composable | `use` + PascalCase | `useAuthStore`, `useRouteMapFacade` |
| API 파일 | Nuxt 라우트 규칙 | `index.get.ts`, `[routeId]/sections.get.ts` |
| CSS 클래스 | BEM 스타일 | `.auth-modal__header`, `.weather-legend__item` |
| 타입/인터페이스 | PascalCase, `I` prefix for interface | `SavedRoute`, `IRouteRepository` |
| 상수 | SCREAMING_SNAKE_CASE | `SEOUL_GU_GRID`, `CACHE_TTL_MS` |

### Git 컨벤션

- 커밋 메시지는 한글로 작성하며, 변경 사항의 **이유**를 간결하게 기술한다.
- 브랜치: `master` (프로덕션), `develop` (개발), `feature/*`, `fix/*`

---

## API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/api/routes` | 필수 | 경로 저장 (구간 포함) |
| `GET` | `/api/routes` | 선택 | 인증 시 내 경로, 미인증 시 공개 경로 |
| `GET` | `/api/routes/search?q=` | 불필요 | 공개 경로 검색 |
| `GET` | `/api/routes/:routeId/sections` | 불필요 | 경로 구간 조회 |
| `PUT` | `/api/routes/:routeId` | 필수 | 경로 수정 (소유자만) |
| `DELETE` | `/api/routes/:routeId` | 필수 | 경로 삭제 (소유자만) |
| `GET` | `/api/weather/:date` | 불필요 | 날짜별 서울 날씨 + 미세먼지 |
| `ALL` | `/api/auth/**` | - | better-auth 핸들러 |

---

## CI/CD

GitHub Actions로 자동화된 파이프라인이 구성되어 있다.

### CI (`ci.yml`)
- **트리거**: `master`, `develop` push 및 PR
- **단계**: Lint → TypeCheck → Build
- 빌드 결과는 아티팩트로 7일간 보관

### Deploy (`deploy.yml`)
- **트리거**: `master` push 또는 수동 실행
- **단계**: Build → Docker 이미지 빌드 → GHCR 푸시 → SSH 배포
- 필요 시크릿: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`

---

## 이슈 트래커

### 해결됨

| # | 제목 | 유형 | 설명 |
|---|------|------|------|
| [#1](https://github.com/all4land-runnable/runnable2.0/issues/1) | AuthModal 에러 메시지 표시 | Bug | 로그인/회원가입 실패 시 에러 메시지 표시 |
| [#2](https://github.com/all4land-runnable/runnable2.0/issues/2) | 에어코리아 API 최적화 | Enhancement | 1시간 캐싱 + 동시 5개 요청 제한 |
| [#3](https://github.com/all4land-runnable/runnable2.0/issues/3) | 탐색 경로 미리보기 | Enhancement | 공개 경로 선택 시 지도 + 고도 그래프 |
| [#5](https://github.com/all4land-runnable/runnable2.0/issues/5) | 로그인 유도 UX | Enhancement | 미로그인 저장 시 로그인 모달 자동 표시 |
| [#6](https://github.com/all4land-runnable/runnable2.0/issues/6) | 경로 수정/삭제 권한 | Enhancement | PUT/DELETE API + 소유자 검증 |

### 진행 중

| # | 제목 | 유형 | 설명 |
|---|------|------|------|
| [#4](https://github.com/all4land-runnable/runnable2.0/issues/4) | CI/CD 배포 시크릿 | Infra | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY` 설정 필요 |

---

## 기여 가이드

1. 이슈를 먼저 확인하거나 새 이슈를 등록한다.
2. `feature/*` 또는 `fix/*` 브랜치를 생성한다.
3. 코드 컨벤션을 준수하며, `pnpm lint`와 `pnpm typecheck`을 통과해야 한다.
4. PR을 생성하면 CI가 자동으로 실행된다.

---

## 라이선스

이 프로젝트는 [MIT License](./LICENSE)로 배포된다.

```
MIT License
Copyright (c) 2025 Nuxt UI Templates
```

자세한 내용은 [LICENSE](./LICENSE) 파일을 참조한다.
