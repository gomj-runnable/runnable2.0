# 인천 영복교회 웹사이트 리뉴얼

인천 영복교회 리뉴얼 프로젝트를 위한 풀스택 개발 환경이다. Nuxt 4와 Drizzle ORM을 기반으로 구축한다.

## 📋 사전 요구 사항

프로젝트 실행을 위해 아래 도구가 반드시 설치되어 있어야 한다.

* **Node.js**: 24.x 이상 버전
* **Package Manager**: pnpm 10.28.2 (`packageManager` 필드에 고정, **npm/yarn 사용 금지**)
* **Docker**: 로컬 PostgreSQL 데이터베이스 실행용

## 🛠️ 설치 및 시작 방법

### 0. pnpm 활성화 (pnpm 없는 경우 최초 1회 실행)

Node.js에 내장된 `corepack`을 사용하여 별도의 설치 과정 없이 `pnpm`을 활성화한다.

```bash
corepack enable
corepack prepare pnpm@10.28.2 --activate
```

### 1. 환경 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고, 필요한 값을 입력한다.

```bash
cp .env.example .env
```

`.env`에서 설정해야 할 주요 환경 변수:

| 변수명                | 설명                                   | 예시                                                           |
|-----------------------|----------------------------------------|----------------------------------------------------------------|
| `POSTGRES_USER`       | DB 사용자 이름                         | `admin`                                                        |
| `POSTGRES_PASSWORD`   | DB 비밀번호                            | `church_pass_1234`                                             |
| `POSTGRES_DB`         | DB 이름                                | `yb_church_db`                                                 |
| `DATABASE_URL`        | DB 연결 문자열 (로컬: `localhost:6432`) | `postgres://admin:church_pass_1234@localhost:6432/yb_church_db` |
| `BETTER_AUTH_SECRET`  | 인증 서명용 비밀 키 (32자 이상 권장)   | `ztPmfsX7cVBvWp4afs9Q...`                                      |
| `BETTER_AUTH_URL`     | 앱의 Base URL                          | `http://localhost:3000`                                        |

### 2. 패키지 설치

```bash
pnpm install
```

### 3. 데이터베이스 실행

Docker를 사용하여 PostgreSQL 컨테이너를 백그라운드에서 실행한다.

> 로컬 개발 시에는 `db` 서비스만 실행한다. 포트는 `6432`(호스트) → `5432`(컨테이너)로 매핑된다.

```bash
docker-compose up -d db
```

### 4. DB 스키마 동기화

Drizzle 스키마 정의를 실제 데이터베이스 테이블에 즉시 반영한다.

```bash
pnpm drizzle-kit push
```

### 5. (선택) 시드 데이터 삽입

초기 데이터가 필요한 경우 시드 스크립트를 실행한다.

```bash
pnpm seed
```

### 6. 개발 서버 실행

```bash
pnpm dev
```

서버 실행 후 **[http://localhost:3000](http://localhost:3000)**에 접속하여 화면을 확인한다.

## 🐳 프로덕션 배포 (Docker)

프로덕션 환경은 Nuxt 빌드 결과물(`.output`)을 담은 Docker 이미지를 사전에 빌드해야 한다.

### 1. Nuxt 빌드

```bash
pnpm build
```

### 2. Docker 이미지 빌드

`Dockerfile`은 `.output` 디렉터리만 복사하여 `node:20-slim` 기반 이미지를 생성한다.

```bash
docker build -t runnable-app:latest .
```

### 3. 전체 스택 실행

`app` + `db` 서비스를 함께 구동한다.

```bash
docker-compose up -d
```

* DB: `yb_church_db` 컨테이너 (PostgreSQL 17 Alpine, `Asia/Seoul` 타임존)
* App: `runnable_app` 컨테이너 (포트 `3000` 노출)
* 업로드 파일: `./uploads` 볼륨으로 호스트에 마운트

## 🔍 데이터 확인

### Drizzle Studio (GUI)

데이터베이스 내부 데이터를 브라우저에서 시각적으로 관리하려면 아래 명령어를 사용한다.

```bash
pnpm drizzle-kit studio
```

## 🛠 주요 기술 스택

* **Framework**: Nuxt 4
* **Build Tool**: Vite
* **Styling**: Tailwind CSS v4
* **UI Library**: Nuxt UI v4
* **Language**: TypeScript
* **ORM**: Drizzle ORM
* **Database**: PostgreSQL 17 (Docker)
* **Auth**: better-auth v1
* **Editor**: Tiptap v3