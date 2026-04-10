# Runnable

Cesium 3D 지도 기반 러닝 경로 제작 서비스. 경로를 그리고, 저장하고, 다른 사용자의 경로를 탐색할 수 있다.

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

### 경로 탐색
- 다른 사용자가 공개한 경로를 검색
- 제목/설명 기반 검색
- 작성자명 표시

### 날씨 정보
- 서울 25개 구별 시간대별 날씨 오버레이
- 기상청 관측 데이터 + 동네예보 병합
- 에어코리아 실시간 미세먼지(PM10) 연동
- 날씨/기온/미세먼지 레이어 전환

### 편의시설
- 지도 위 주변 편의시설 표시
- 시설 유형별 필터링

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
| 패키지 관리 | pnpm |
| 컨테이너 | Docker |

## 디렉터리 구조

```
app/                    # 프론트엔드
├── pages/              # 라우트 페이지
├── components/map/     # 지도 UI 컴포넌트
│   ├── atoms/          # 최소 단위 (Textfield 등)
│   ├── molecules/      # 중간 단위 (Button, IconButton 등)
│   ├── organizations/  # 조직 단위 (Card 등)
│   └── templates/      # 페이지 조합 (MapShell, AuthModal 등)
├── composables/
│   ├── action/         # 순수 계산 (변환, 포맷)
│   ├── sideeffect/     # 외부 연동 (API, 지도 엔진)
│   └── store/          # 공유 상태 관리
└── assets/css/         # 디자인 토큰, 컴포넌트 CSS

server/                 # 백엔드
├── api/
│   ├── auth/           # 인증 엔드포인트
│   ├── routes/         # 경로 CRUD + 검색 API
│   ├── weather/        # 날씨 API
│   └── boundary/       # 행정경계 GeoJSON
├── database/
│   ├── schema/         # Drizzle 테이블 정의
│   └── migrations/     # DB 마이그레이션
├── repositories/       # 데이터 접근 계층
└── utils/
    └── weather/        # 날씨 데이터 파이프라인

shared/                 # 프론트/백 공용
├── types/              # 도메인 타입
├── schemas/            # Zod 검증 스키마
├── constants/          # 상수
└── data/               # 샘플 데이터

lib/                    # 외부 라이브러리 (Cesium 등)
```

## API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/routes` | 필수 | 경로 저장 (구간 포함) |
| GET | `/api/routes` | 선택 | 인증 시 내 경로, 미인증 시 공개 경로 |
| GET | `/api/routes/search?q=` | 불필요 | 공개 경로 검색 |
| GET | `/api/routes/:routeId/sections` | 불필요 | 경로 구간 조회 |
| GET | `/api/weather/:date` | 불필요 | 날짜별 서울 날씨 |
| ALL | `/api/auth/**` | - | better-auth 핸들러 |

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
# .env 파일에서 API 키 설정:
#   WEATHER_KOR  - 기상청 API 허브 인증키
#   OPEN_DATA    - 공공데이터포털 인증키 (동네예보 + 에어코리아)

# 의존성 설치
pnpm install

# PostgreSQL 실행
docker-compose up -d db

# DB 스키마 반영
npx drizzle-kit push

# 개발 서버 실행
pnpm dev
```

### 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 (http://localhost:3000) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과 미리보기 |
| `pnpm lint` | ESLint 실행 |
| `pnpm lint:fix` | ESLint 자동 수정 |
| `pnpm typecheck` | Nuxt 타입 검사 |
| `pnpm seed` | 시드 데이터 입력 |
| `npx drizzle-kit push` | DB 스키마 동기화 |
| `npx drizzle-kit generate` | 마이그레이션 파일 생성 |

## 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 URL | O |
| `BETTER_AUTH_SECRET` | 인증 시크릿 키 | O |
| `BETTER_AUTH_URL` | 앱 기본 URL | O |
| `MAPPRIME_BASE_URL` | MapPrime 지도 서버 주소 | O |
| `WEATHER_KOR` | 기상청 API Hub 인증키 | - |
| `OPEN_DATA` | 공공데이터포털 인증키 (동네예보 + 에어코리아) | - |

## 알려진 이슈 및 로드맵

### Bug

| # | 제목 | 상태 | 설명 |
|---|------|------|------|
| [#1](https://github.com/all4land-runnable/runnable2.0/issues/1) | AuthModal 에러 메시지 미표시 | Closed | AuthModal 내부에서 직접 auth 호출 + 에러 catch/표시 |

### Enhancement

| # | 제목 | 상태 | 설명 |
|---|------|------|------|
| [#2](https://github.com/all4land-runnable/runnable2.0/issues/2) | 에어코리아 API 호출 최적화 | Closed | 1시간 캐싱 + 동시 5개 요청 제한 적용 |
| [#3](https://github.com/all4land-runnable/runnable2.0/issues/3) | 탐색 탭 경로 지도 미리보기 | Closed | 공개 경로 선택 시 지도 라인 + 고도 그래프 표시 |
| [#5](https://github.com/all4land-runnable/runnable2.0/issues/5) | 경로 저장 시 로그인 유도 UX | Closed | 미로그인 시 저장 클릭 → 로그인 모달 자동 표시 |
| [#6](https://github.com/all4land-runnable/runnable2.0/issues/6) | 경로 삭제/수정 API 권한 검증 | Closed | PUT/DELETE 엔드포인트 + 소유자 userId 검증 |

### Infra

| # | 제목 | 상태 | 설명 |
|---|------|------|------|
| [#4](https://github.com/all4land-runnable/runnable2.0/issues/4) | CI/CD 배포 시크릿 설정 | Open | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY` 설정 필요 |

## 라이선스

[LICENSE](./LICENSE) 파일 참조
