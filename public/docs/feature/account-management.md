# 계정 관리

## 사용 방법 (고객 관점)

### 1. 회원가입

1. 화면 좌측 사이드바 하단의 사용자 프로필 영역(기본 상태: "로그인" 표시)을 클릭한다.
2. 인증 모달이 열리면 하단의 "계정이 없으신가요? 회원가입" 링크를 클릭해 회원가입 모드로 전환한다.
3. 이름, 이메일, 비밀번호를 입력한 뒤 "가입" 버튼을 클릭한다.
4. 가입이 완료되면 모달이 자동으로 닫히고 사이드바에 사용자 이름이 표시된다.

### 2. 로그인

1. 사이드바 하단의 "로그인" 버튼을 클릭한다.
2. 인증 모달에서 이메일과 비밀번호를 입력한 뒤 "로그인" 버튼을 클릭한다.
3. 로그인에 성공하면 모달이 닫히고 사이드바에 사용자 이름과 프로필 아이콘이 표시된다.
4. 이메일 또는 비밀번호가 올바르지 않으면 모달 내에 오류 메시지가 표시된다.

### 3. 세션 유지

- 로그인 상태는 쿠키 기반 세션으로 유지되며, 세션 유효 기간은 **30일**이다.
- 브라우저를 닫고 다시 열어도 세션이 만료되지 않은 경우 로그인 상태가 자동으로 복원된다.
- 페이지 최초 진입 시 서버에서 현재 세션을 조회해 로그인 여부를 판별한다.

### 4. 프로필 표시

- 로그인된 상태에서는 사이드바 하단에 사용자 이름과 프로필 이미지(없을 경우 기본 아이콘)가 표시된다.
- 프로필 영역을 클릭하면 드롭다운 메뉴가 열리며, "프로필 편집", "설정", "로그아웃" 항목을 제공한다.

### 5. 로그인 유도 (경로 저장 시)

- 비로그인 상태에서 경로 저장 등 인증이 필요한 기능을 사용하려 하면 로그인 모달이 자동으로 표시된다.
- 로그인 또는 회원가입 완료 후 해당 작업이 이어진다.

### 6. 로그아웃

- 사이드바 프로필 드롭다운에서 "로그아웃"을 선택하면 세션이 종료되고 사이드바가 초기(비로그인) 상태로 돌아간다.

---

## 기술 구현 (개발 관점)

### 아키텍처

인증 기능은 [better-auth](https://better-auth.com/) 라이브러리를 중심으로 구성된다. 프론트엔드는 `better-auth/vue` 클라이언트를 통해 서버 인증 엔드포인트와 통신하고, 서버는 Drizzle ORM + PostgreSQL 어댑터를 통해 세션·사용자 데이터를 영속한다.

상태는 `useAuthStore`(Nuxt `useState` 기반)가 소유하고, 외부 API 통신은 `useAuthSideeffect`가 담당한다. 컴포넌트는 store와 sideeffect만 구독하며 직접 API를 호출하지 않는다.

개발 환경 또는 DB 미연결 상태에서는 인메모리 모드(`isMemoryMode`)로 동작한다. 이 경우 `handleMemoryAuth`가 better-auth 핸들러를 대체해 Map 기반의 임시 사용자 저장소를 사용한다.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `app/composables/store/useAuthStore.ts` | 인증 상태(사용자 정보·모달 개폐) 관리 |
| `app/composables/sideeffect/useAuthSideeffect.ts` | better-auth 클라이언트 호출, 세션 조회·로그인·회원가입·로그아웃 |
| `app/components/map/templates/AuthModal.vue` | 로그인/회원가입 모달 UI, 폼 상태 및 오류 표시 |
| `app/components/map/molecules/profiles/SidebarUserProfile.vue` | 사이드바 사용자 프로필 버튼 및 드롭다운 메뉴 |
| `server/utils/auth.ts` | better-auth 인스턴스 설정 (DB 어댑터, 세션 만료, 사용자 추가 필드) |
| `server/api/auth/[...all].ts` | 모든 `/api/auth/**` 요청을 better-auth 핸들러 또는 인메모리 핸들러로 라우팅 |
| `server/database/schema/users.ts` | `users`, `user_sessions`, `user_accounts`, `user_verifications` 테이블 정의 |

### 인증 흐름

#### 로그인 / 회원가입

```
[사용자]
  │  프로필 버튼 클릭
  ▼
[SidebarUserProfile]
  │  openLoginModal() / openSignupModal()
  ▼
[useAuthStore]  →  isAuthModalOpen = true
  │
  ▼
[AuthModal]
  │  이메일·비밀번호 입력 후 제출
  ▼
[useAuthSideeffect.login() / .signup()]
  │  better-auth 클라이언트 → POST /api/auth/sign-in/email
  │                         → POST /api/auth/sign-up/email
  ▼
[서버: server/api/auth/[...all].ts]
  │  better-auth 핸들러 (또는 인메모리 핸들러)
  │  성공 시 세션 쿠키(better-auth.session_token) 발급
  ▼
[useAuthSideeffect]
  │  store.user.value 갱신
  │  store.closeAuthModal()
  ▼
[SidebarUserProfile]  →  사용자 이름·아이콘 표시
```

#### 세션 복원 (페이지 진입)

```
[앱 초기화 / 페이지 마운트]
  │
  ▼
[useAuthSideeffect.fetchSession()]
  │  GET /api/auth/get-session (쿠키 자동 첨부)
  ▼
[서버]  세션 쿠키 검증
  │  유효한 세션 → 사용자 정보 반환
  │  세션 없음 / 만료 → null 반환
  ▼
[useAuthStore]  user.value 갱신 또는 null 유지
```

#### 로그아웃

```
[사용자]  드롭다운 → "로그아웃" 선택
  ▼
[useAuthSideeffect.logout()]
  │  POST /api/auth/sign-out
  ▼
[서버]  세션 쿠키 삭제
  ▼
[useAuthStore]  user.value = null
  ▼
[SidebarUserProfile]  "로그인" 초기 상태로 복귀
```

### API

모든 인증 엔드포인트는 `/api/auth/**` 경로로 통합된다. better-auth가 내부 라우팅을 처리하며, 프론트엔드는 클라이언트 SDK를 통해 간접 호출한다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/auth/get-session` | 현재 세션 조회. 유효한 세션 쿠키가 있으면 사용자 정보 반환 |
| `POST` | `/api/auth/sign-in/email` | 이메일·비밀번호 로그인. 성공 시 세션 쿠키 발급 |
| `POST` | `/api/auth/sign-up/email` | 이름·이메일·비밀번호 회원가입. 성공 시 세션 쿠키 발급 |
| `POST` | `/api/auth/sign-out` | 세션 종료. 세션 쿠키 삭제 |
| `GET` | `/api/auth/csrf` | CSRF 토큰 발급 (better-auth 클라이언트가 자동 호출) |
| `GET` | `/api/auth/ok` | 서버 헬스체크 |

#### 사용자 스키마 주요 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `text` | better-auth가 부여한 고유 ID |
| `name` | `varchar(255)` | 표시 이름 |
| `email` | `varchar(255)` | 고유 이메일 주소 |
| `emailVerified` | `boolean` | 이메일 인증 여부 (기본 `false`) |
| `image` | `text` | 프로필 이미지 URL (선택) |
| `role` | `integer` | 사용자 역할 (기본 `1`) |
| `banned` | `boolean` | 계정 차단 여부 |
| `banReason` | `text` | 차단 사유 |
| `banExpires` | `timestamp` | 차단 만료 일시 |

세션(`user_sessions`)은 `token` 컬럼으로 쿠키와 연결되며, `expiresAt`이 30일로 설정된다. 사용자 삭제 시 세션·계정·인증 레코드가 cascade 삭제된다.
