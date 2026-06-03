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

### 경사도 시각화

- 경로 구간별 경사도 색상 폴리라인 오버레이 (급경사일수록 빨간색)
- 전체 경로 난이도 자동 분류 (초급/중급/고급/전문가)
- 경로 그래프 하단 바에서 경사도 토글

> **Flow**: 하단 오버레이 바에서 "경사도" 칩 토글 클릭 → 경로 위에 구간별 색상 폴리라인 오버레이 (초록=완만, 빨강=급경사) → 토글 옆에 난이도 뱃지 표시 (초급/중급/고급/전문가) → 다시 클릭하면 오버레이 제거

### 지역 기반 경로 탐색 (Discover)

- 서울 25개 구 선택 시 해당 지역 공개 경로 목록 조회
- 구역 선택 시 카메라 자동 이동
- 거리/고도/최신/인기순 정렬

> **Flow**: 우측 패널에서 탐색 탭 열기 → 서울 25개 구 칩 중 하나 클릭 → 카메라가 해당 구 중심으로 이동 (고도 8000m, 1.5초) + 동시에 공개 경로 목록 조회 → 경로 카드 목록 표시 (정렬: 거리/고도/최신/인기) → 카드 클릭 시 지도에 경로 미리보기 → 같은 구 다시 클릭하면 선택 해제

### 경로 정보 (지도 마커 메모)

- 경로별 위치 메모(이름·설명) 등록 및 조회
- 지도 위 메모 마커 표시
- 경로 공유 링크 생성 및 복사

> **Flow**: 경로 선택 후 FAB의 "경로정보" 칩 → 지도에서 위치 클릭 → 이름·설명 입력 (최대 500자) → "등록" → 지도에 핀 마커 표시 → 마커 클릭 시 내용 팝업

### 3D 경로 시뮬레이션

- 경로를 따라 카메라가 이동하는 플라이스루 재생
- 재생/일시정지/정지/탐색 컨트롤
- 1x/2x/5x 속도 조절
- 실시간 거리·고도·경사도 정보 표시

> **Flow**: 경로 선택 후 FAB의 "시뮬레이션" 칩 → SimulationDrawer 열림 → ▶ 재생 클릭 → 카메라가 경로를 따라 이동 (기본 3m/s 러너 속도) → 진행 바 + 실시간 정보 표시 (현재 거리/전체, 고도, 경사도%) → 1x/2x/5x 속도 버튼으로 배속 변경 → ⏸ 일시정지 / ■ 정지로 제어 → 진행 바 클릭으로 원하는 지점으로 탐색

### 날씨 기반 경로 추천

- 현재 날씨에 적합한 공개 경로를 AI 기반으로 추천
- 추천 경로 카드 목록 표시

> **Flow**: 페이지 로드 시 자동으로 추천 경로 조회 (최대 5개) → 우측 SlideOver의 "탐색" 탭에서 "추천 보기" 토글 → 날씨 적합도 점수(0-100)순 경로 카드 목록 표시 (거리, 고도, 자동 생성 태그: #달리기좋은날 등) → 카드 클릭 시 지도에 경로 표시 + 구간 상세 패널 열기 → 추천 없으면 "현재 날씨에 맞는 공개 경로가 없습니다" 표시

---

## 기술 스택

| 분류         | 기술                         |
| ------------ | ---------------------------- |
| 프레임워크   | Nuxt 4 / Vue 3               |
| 언어         | TypeScript                   |
| 스타일       | Tailwind CSS v4 / Nuxt UI v3 |
| 지도         | Cesium / MapPrime            |
| ORM          | Drizzle ORM                  |
| 데이터베이스 | PostgreSQL                   |
| 인증         | better-auth                  |
| CI/CD        | GitHub Actions               |
| 패키지 관리  | pnpm                         |
| 컨테이너     | Docker                       |

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

| 명령어                     | 설명                   |
| -------------------------- | ---------------------- |
| `pnpm dev`                 | 개발 서버 실행         |
| `pnpm build`               | 프로덕션 빌드          |
| `pnpm preview`             | 빌드 결과 미리보기     |
| `pnpm lint`                | ESLint 검사            |
| `pnpm lint:fix`            | ESLint 자동 수정       |
| `pnpm typecheck`           | Nuxt 타입 검사         |
| `pnpm seed`                | 시드 데이터 입력       |
| `npx drizzle-kit push`     | DB 스키마 동기화       |
| `npx drizzle-kit generate` | 마이그레이션 파일 생성 |

### 환경변수

| 변수                 | 설명                                          | 필수 |
| -------------------- | --------------------------------------------- | ---- |
| `DATABASE_URL`       | PostgreSQL 연결 URL                           | O    |
| `BETTER_AUTH_SECRET` | 인증 시크릿 키                                | O    |
| `BETTER_AUTH_URL`    | 앱 기본 URL                                   | O    |
| `MAPPRIME_BASE_URL`  | MapPrime 지도 서버 주소                       | O    |
| `WEATHER_KOR`        | 기상청 API Hub 인증키                         | -    |
| `OPEN_DATA`          | 공공데이터포털 인증키 (동네예보 + 에어코리아) | -    |

---

## 디렉터리 구조

프론트엔드는 [Feature-Sliced Design (FSD)](https://feature-sliced.design/) 아키텍처를 따른다. 각 슬라이스는 `api/` (부수효과), `lib/` (순수 계산), `model/` (상태), `ui/` (컴포넌트) 세그먼트로 구성한다.

```
Runnable/
├── app/                                    # 프론트엔드 (FSD)
│   ├── pages/
│   │   └── index.vue                       # 메인 지도 페이지 (SSR: false)
│   │
│   ├── entities/                           # 도메인 엔티티
│   │   ├── boundary/                       #   행정경계
│   │   ├── facility/                       #   편의시설
│   │   ├── gradient/                       #   경사도
│   │   ├── notification/                   #   알림
│   │   ├── route/                          #   러닝 경로
│   │   ├── user/                           #   사용자
│   │   └── weather/                        #   날씨
│   │       ├── api/                        #     부수효과 (API 호출, 지도 렌더링)
│   │       ├── lib/                        #     순수 계산 (데이터 변환)
│   │       ├── model/                      #     상태 관리 (useState 기반)
│   │       └── ui/                         #     UI 컴포넌트
│   │
│   ├── features/                           # 사용자 기능
│   │   ├── camera/                         #   카메라 제어
│   │   ├── discover/                       #   지역 기반 탐색
│   │   ├── draw-route/                     #   경로 그리기
│   │   ├── elevation-layer/                #   고도 레이어
│   │   ├── explore/                        #   경로 탐색
│   │   ├── route-info/                     #   경로 정보
│   │   ├── simulation/                     #   3D 시뮬레이션
│   │   └── weather-overlay/                #   날씨 오버레이
│   │
│   ├── widgets/                            # 복합 위젯
│   │   ├── facility-overlay/               #   시설물 오버레이
│   │   ├── map-shell/                      #   지도 + 오버레이 컨테이너
│   │   └── right-panel/                    #   우측 패널
│   │
│   ├── shared/                             # 앱 내 공용
│   │   ├── lib/                            #   공용 유틸, map/ 헬퍼
│   │   └── ui/                             #   공용 UI 컴포넌트
│   │
│   ├── layouts/                            # Nuxt 레이아웃
│   └── assets/css/
│       ├── base/                           # 디자인 토큰
│       │   ├── primitive.css               #   원시값 토큰
│       │   ├── semantic.css                #   의미 토큰
│       │   └── main.css                    #   엔트리 (import 순서 관리)
│       ├── components/                     # 컴포넌트별 CSS
│       └── pages/                          # 페이지별 CSS
│
├── server/                                 # 백엔드
│   ├── api/
│   │   ├── routes/                         # 경로 CRUD + 최적화
│   │   │   ├── index.get.ts               #   목록 조회
│   │   │   ├── index.post.ts              #   경로 저장
│   │   │   ├── optimize.post.ts           #   경로 보정 (TMAP/OSRM)
│   │   │   ├── search.get.ts              #   공개 경로 검색
│   │   │   └── [routeId]/                 #   경로별 수정/삭제/구간
│   │   ├── facilities/                     # 시설물 조회 + 주변 검색
│   │   ├── weather/                        # 날씨 API
│   │   ├── boundary/                       # 서울 행정경계 GeoJSON
│   │   ├── district/                       # 서울 구별 데이터
│   │   └── auth/                           # better-auth 핸들러
│   │
│   ├── database/
│   │   ├── schema/                         # Drizzle 테이블 정의
│   │   ├── migrations/                     # DB 마이그레이션
│   │   ├── schema.ts                       # 스키마 진입점
│   │   └── seed.ts                         # 시드 데이터
│   │
│   ├── middleware/                          # Nitro 미들웨어
│   │
│   ├── repositories/                       # 데이터 접근 계층
│   │   ├── route.repository.ts             #   인터페이스
│   │   ├── route.repository.drizzle.ts     #   Drizzle 구현체
│   │   └── route.repository.memory.ts      #   인메모리 구현체
│   │
│   ├── errors/                              # 에러 팩토리 + 예외 래퍼
│   │
│   └── utils/
│       ├── weather/                        # 날씨 파이프라인
│       │   ├── weather.service.ts          #   메인 서비스
│       │   ├── observed.adapter.ts         #   관측 데이터 정규화
│       │   ├── forecast.adapter.ts         #   예보 데이터 정규화
│       │   ├── airquality.adapter.ts       #   대기질 데이터
│       │   ├── merge.service.ts            #   관측+예보 병합
│       │   └── common.ts                   #   공통 유틸
│       ├── routing/                        # 경로 최적화
│       │   ├── index.ts                    #   팩토리 (TMAP/OSRM 직접 생성)
│       │   ├── tmap.service.ts             #   TMap 보행자 라우팅
│       │   ├── osrm.service.ts             #   OSRM 보행자 라우팅
│       │   └── common.ts                   #   공통 인터페이스
│       ├── district/                       # 서울 구별 유틸
│       ├── auth.ts                         # 인증 설정
│       └── db.ts                           # DB 연결
│
├── shared/                                 # Frontend + Backend 공용
│   ├── types/                              # 도메인 타입 + enum
│   ├── schemas/                            # Zod 런타임 검증 스키마
│   ├── constants/                          # 상수 정의
│   └── data/                               # 샘플 데이터
│
├── lib/cesium/                             # Cesium 정적 자산 (수정 금지)
├── .github/workflows/                      # CI/CD 파이프라인
└── public/                                 # 정적 자료
```

---

## 코드 컨벤션

### FSD 레이어 계층

프론트엔드는 [Feature-Sliced Design](https://feature-sliced.design/)을 따르며, 4개 레이어로 구성한다.

| 레이어  | 디렉터리        | 역할                                 | 예시                                      |
| ------- | --------------- | ------------------------------------ | ----------------------------------------- |
| Shared  | `app/shared/`   | 앱 전역 공용 유틸·UI                 | `map/` 헬퍼, 공용 컴포넌트                |
| Entity  | `app/entities/` | 도메인 엔티티 (비즈니스 데이터 단위) | `route/`, `weather/`, `facility/`         |
| Feature | `app/features/` | 사용자 시나리오 단위 기능            | `draw-route/`, `simulation/`, `discover/` |
| Widget  | `app/widgets/`  | 여러 Entity·Feature를 조합한 복합 UI | `map-shell/`, `right-panel/`              |

각 슬라이스는 아래 세그먼트로 내부를 분리한다.

| 세그먼트 | 책임                                    | 금지 사항                                         |
| -------- | --------------------------------------- | ------------------------------------------------- |
| `api/`   | 부수 효과 (API 호출, 지도 엔진, 타이머) | 상태를 직접 소유 (model과 연결하거나 결과를 반환) |
| `lib/`   | 순수 계산 (변환, 포맷, 트리 탐색)       | 외부 API 호출, 전역 상태 저장, 브라우저 IO        |
| `model/` | 공유 상태 관리 (useState 기반)          | 외부 통신 직접 수행                               |
| `ui/`    | Vue 컴포넌트                            | 비즈니스 로직 직접 포함                           |

- `pages/`는 화면 조합과 초기 진입만 담당한다. 로직은 각 슬라이스의 세그먼트에 위임한다.
- 브라우저 전용 지도 페이지는 `definePageMeta({ ssr: false })`를 설정한다.
- 하나의 파일이 여러 세그먼트의 책임을 동시에 가지지 않도록 한다.

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

| 영역        | 규칙                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Repository  | 인터페이스(`route.repository.ts`)와 구현체(`route.repository.drizzle.ts`)를 분리. 의존성 역전 원칙 |
| API 인증    | `server/utils/session.ts`의 `requireSession()` / `getSessionUser()` 사용                           |
| 소유자 검증 | 수정/삭제 API에서 `route.userId !== user.userId` 시 403 반환                                       |
| 외부 API    | `server/utils/weather/` 어댑터 패턴. 원본 Response 클래스 + Local Response 분리                    |
| 스키마      | Drizzle 테이블은 `server/database/schema/`. Zod 검증은 `shared/schemas/`                           |

### 네이밍 규칙

| 대상            | 규칙                                 | 예시                                           |
| --------------- | ------------------------------------ | ---------------------------------------------- |
| 컴포넌트        | PascalCase                           | `MapShell.vue`, `AuthModal.vue`                |
| Composable      | `use` + PascalCase                   | `useAuthStore`, `useRouteMapFacade`            |
| API 파일        | Nuxt 라우트 규칙                     | `index.get.ts`, `[routeId]/sections.get.ts`    |
| CSS 클래스      | BEM 스타일                           | `.auth-modal__header`, `.weather-legend__item` |
| 타입/인터페이스 | PascalCase, `I` prefix for interface | `SavedRoute`, `IRouteRepository`               |
| 상수            | SCREAMING_SNAKE_CASE                 | `SEOUL_GU_GRID`, `CACHE_TTL_MS`                |

### Git 컨벤션

- 커밋 메시지 형식: `<type>(<unit>): <설명>` — 상세 규칙은 [커밋 컨벤션 문서](.github/COMMIT_CONVENTION.md) 참조
- type: `feat`, `fix`, `bug`, `log`, `test`, `temp`
- 브랜치: `master` (프로덕션), `develop` (개발), `feature/*`, `fix/*`
- PR 템플릿: [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)
- Issue 템플릿: [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/)

---

## API 엔드포인트

| 메서드   | 경로                                     | 인증   | 설명                                 |
| -------- | ---------------------------------------- | ------ | ------------------------------------ |
| `POST`   | `/api/routes`                            | 필수   | 경로 저장 (구간 포함)                |
| `GET`    | `/api/routes`                            | 선택   | 인증 시 내 경로, 미인증 시 공개 경로 |
| `GET`    | `/api/routes/search?q=`                  | 불필요 | 공개 경로 검색                       |
| `GET`    | `/api/routes/:routeId/sections`          | 불필요 | 경로 구간 조회                       |
| `PUT`    | `/api/routes/:routeId`                   | 필수   | 경로 수정 (소유자만)                 |
| `DELETE` | `/api/routes/:routeId`                   | 필수   | 경로 삭제 (소유자만)                 |
| `GET`    | `/api/weather/:date`                     | 불필요 | 날짜별 서울 날씨 + 미세먼지          |
| `GET`    | `/api/routes/discover?district=&sortBy=` | 불필요 | 서울 구별 경로 탐색                  |
| `GET`    | `/api/routes/recommend?limit=`           | 불필요 | 날씨 기반 추천 경로                  |
| `GET`    | `/api/routes/:routeId/feedbacks`         | 불필요 | 경로 피드백 목록                     |
| `POST`   | `/api/routes/:routeId/feedbacks`         | 선택   | 피드백 등록                          |
| `GET`    | `/api/routes/share/:routeId`             | 불필요 | 공유 경로 조회                       |
| `ALL`    | `/api/auth/**`                           | -      | better-auth 핸들러                   |

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

| #                                                               | 제목                       | 유형        | 설명                                     |
| --------------------------------------------------------------- | -------------------------- | ----------- | ---------------------------------------- |
| [#1](https://github.com/all4land-runnable/runnable2.0/issues/1) | AuthModal 에러 메시지 표시 | Bug         | 로그인/회원가입 실패 시 에러 메시지 표시 |
| [#2](https://github.com/all4land-runnable/runnable2.0/issues/2) | 에어코리아 API 최적화      | Enhancement | 1시간 캐싱 + 동시 5개 요청 제한          |
| [#3](https://github.com/all4land-runnable/runnable2.0/issues/3) | 탐색 경로 미리보기         | Enhancement | 공개 경로 선택 시 지도 + 고도 그래프     |
| [#5](https://github.com/all4land-runnable/runnable2.0/issues/5) | 로그인 유도 UX             | Enhancement | 미로그인 저장 시 로그인 모달 자동 표시   |
| [#6](https://github.com/all4land-runnable/runnable2.0/issues/6) | 경로 수정/삭제 권한        | Enhancement | PUT/DELETE API + 소유자 검증             |

### 진행 중

| #                                                               | 제목              | 유형  | 설명                                                 |
| --------------------------------------------------------------- | ----------------- | ----- | ---------------------------------------------------- |
| [#4](https://github.com/all4land-runnable/runnable2.0/issues/4) | CI/CD 배포 시크릿 | Infra | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY` 설정 필요 |

---

## AI 에이전트 팀 운영

상세 가이드는 [로컬 개발 설정](docs/local-setup.md)과 [`CLAUDE.md`](CLAUDE.md)의 "3-에이전트 팀 워크플로우" 섹션을 참조한다.

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
