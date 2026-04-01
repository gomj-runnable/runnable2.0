# Runnable

러닝 경로 제작 서비스를 위한 풀스택 프로젝트다.
프론트엔드는 Vue 기반 Nuxt 앱으로 구성되고, 백엔드는 같은 저장소의 Nuxt server 레이어에서 동작한다.

## 목적

이 프로젝트는 지도 기반으로 러닝 경로를 설계하고, 경로 제작에 필요한 데이터와 UI를 함께 제공하는 것을 목표로 한다.
프론트엔드와 백엔드가 같은 저장소에서 협업하며, 공통 도메인 정의는 `shared/`에 모은다.

## 디렉터리 구조

### Front-end

- `app/` : 프론트엔드 루트
- `app/assets/css/` : 전역 CSS와 UI 스타일
- `app/assets/images/` : 이미지 자산
- `app/assets/icons/` : 아이콘 자산
- `app/components/` : 컴포넌트 단위 UI 구현
- `app/components/<page>/` : 페이지별 하위 패키지
- `app/components/<page>/molecules/` : atomic design 기준의 조합형 컴포넌트
- `app/components/<page>/templates/` : 페이지 템플릿 단위 컴포넌트
- `app/composables/` : 상태 관리, 자료 구성, 사이드 이펙트 처리
- `app/layouts/` : 공통 레이아웃
- `app/pages/` : 실제 웹 페이지

### Back-end

- `server/` : 백엔드 루트
- `server/api/` : API 엔드포인트
- `server/routes/` : Nitro route 핸들러
- `server/database/` : DB 스키마와 시드
- `server/utils/` : 인증, DB, 에러 유틸리티

### Shared

- `shared/` : 프론트엔드와 백엔드 공용 코드
- `shared/constants/` : 상수 정의
- `shared/data/` : sample-data 함수
- `shared/schemas/` : 데이터베이스 스키마 정의 (여기서 정의된 값은 type, class로써도 적용된다)
- `shared/types/` : 도메인 타입 정의

### 기타

- `lib/` : 외부 라이브러리 보관 패키지
- `public/` : 요구사항 정의서, 참고 이미지 등 정적 자료

## 기술 스택

- Nuxt 4
- Vue 3
- TypeScript
- Tailwind CSS v4
- Nuxt UI v4
- Drizzle ORM
- PostgreSQL
- better-auth

## 개발 환경

- Node.js 24.x 이상
- pnpm 10.28.2
- Docker

## 시작 방법

```bash
corepack enable
corepack prepare pnpm@10.28.2 --activate
cp .env.example .env
pnpm install
docker-compose up -d db
pnpm dev
```

필요 시 데이터베이스 스키마를 반영한다.

```bash
pnpm drizzle-kit push
```

시드 데이터가 필요하면 아래 명령을 사용한다.

```bash
pnpm seed
```

## 주요 스크립트

- `pnpm dev` : 개발 서버 실행
- `pnpm build` : 프로덕션 빌드
- `pnpm preview` : 빌드 결과 미리보기
- `pnpm lint` : ESLint 실행
- `pnpm lint:fix` : ESLint 자동 수정
- `pnpm typecheck` : Nuxt 타입 검사
- `pnpm seed` : 시드 데이터 입력
