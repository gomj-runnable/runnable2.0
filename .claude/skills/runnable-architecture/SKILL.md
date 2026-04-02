---
name: runnable-architecture
description: This skill should be used when the user asks to "러닝 경로 서비스 구조를 정리", "Runnable 아키텍처에 맞게 수정", "front-end와 back-end 패키지 규칙에 맞춰 작업", "README나 CLAUDE 문서를 프로젝트 구조에 맞게 갱신"해야 할 때.
---

# Runnable Architecture Skill

러닝 경로 제작 서비스를 기준으로 저장소 구조와 수정 원칙을 적용한다.

## 목적

프론트엔드와 백엔드가 함께 있는 Nuxt 기반 프로젝트에서 일관된 디렉터리 규칙을 유지한다.
지도 화면 중심의 UI와 공통 도메인 코드를 분리해 다룬다.
브라우저 전용 지도 엔진과 서버 경유 외부 연동 경계를 명확히 유지한다.

## 디렉터리 원칙

### Front-end (`app/`)

`app/`은 프론트엔드를 담당한다.

`app/assets/`는 CSS, 이미지, 아이콘 등 정적 UI 자산을 저장한다.
- `app/assets/css/` : 전역 CSS와 지도 UI 스타일
- `app/assets/images/` : 이미지 자산
- `app/assets/icons/` : 아이콘 자산

`app/components/`는 컴포넌트 단위 UI 구현에 사용한다.
- 하위에 각 페이지별 독립 패키지를 둔다 (`app/components/<page>/`)
- 해당 독립 패키지 내부에서 atomic design을 참고해 `molecules/`, `templates/` 계층을 둘 수 있다

`app/composables/`는 상태 관리, 독립 유틸, 사이드 이펙트를 담당한다.

- `app/composables/action/` : 독립적인 유틸리티 기능 패키지
- `app/composables/sideeffect/` : 외부 API 통신 등 부수 효과를 이해하기 쉽고 테스트 가능하게 관리하는 패키지
- `app/composables/store/` : 데이터 상태를 관리하는 패키지

`app/layouts/`는 페이지 간 공통 레이아웃을 둔다.

`app/pages/`는 실제 라우트 페이지를 구성한다. 화면 조합 역할만 수행하고 최소화를 유지한다.
- 브라우저 전용 지도 페이지는 `ssr: false`와 전용 layout을 사용하는 구조를 기본으로 본다.

### Back-end (`server/`)

`server/`는 백엔드를 담당한다.
- `server/api/` : API 엔드포인트
- `server/routes/` : Nitro route 핸들러, 프록시, 외부 서비스 중계
- `server/database/` : DB 스키마 및 시드 코드
- `server/utils/` : 인증, DB 연결, 에러 처리 등 서버 유틸리티

- better-auth 설정은 `server/utils/auth.ts`에 두고 `server/api/auth/[...all].ts`에서 개방한다
- DB 연결과 Drizzle 초기화는 `server/utils/db.ts`에서 관리한다
- Drizzle 스키마 진입점은 `server/database/schema.ts`로 통합한다

### Shared (`shared/`)

`shared/`는 프론트엔드와 백엔드가 함께 쓰는 코드를 둔다.
- `shared/constants/` : 상수값 정의
- `shared/data/` : 샘플 데이터, 목업, fixture
- `shared/schemas/` : Zod 등 런타임 검증 스키마 정의
- `shared/types/` : 도메인 타입 정의

### 기타

`lib/`는 외부 라이브러리 보관 영역이다. LLM 수준의 일반 작업에서는 직접 수정하지 않고 래핑과 조합으로 대응한다.
- Cesium, MapPrime 같은 브라우저 전용 라이브러리는 `/lib` 정적 자산과 런타임 로딩 방식으로 연결한다.

`public/`은 정적인 참고 자료와 요구사항 정의서, 이미지 등 서빙 가능한 파일을 둔다.

## 작업 원칙

- UI를 수정할 때는 먼저 `app/pages/`에서 렌더링 진입점을 확인한다.
- 재사용 가능한 UI는 `app/components/`에 둔다.
- 상태나 부수효과 변경은 `app/composables/`에 우선 배치한다.
- `app/composables/` 내부에서는 `action`, `sideeffect`, `store` 책임을 분리한다.
- 페이지에서 브라우저 전역 객체를 직접 다루기보다 composable 경계로 감싼다.
- 외부 서비스 호출은 프론트엔드 직결보다 `server/routes/` 또는 `server/api/` 경유를 우선한다.
- 프론트엔드와 백엔드가 함께 쓰는 타입 또는 스키마는 `shared/`로 올린다.
- 문서를 갱신할 때는 러닝 경로 제작 서비스라는 목적과 실제 디렉터리 구조를 함께 반영한다.
- 외부 라이브러리 파일(`lib/`)은 직접 수정하지 않고 가능한 한 래핑해서 사용한다.

## Composables 세부 원칙

- `action`은 외부 환경에 직접 접근하지 않는 독립 유틸리티 기능을 둔다.
- `sideeffect`는 외부 API, 브라우저 기능, 타이머 등 부수 효과를 테스트 가능한 형태로 관리한다.
- `store`는 공유 데이터 상태와 상태 전이를 관리한다.
- 외부 통신 로직을 `store`에 직접 섞지 않고, `sideeffect`를 통해 연결한다.
- 지도 엔진 초기화, 스크립트 로딩, DOM 접근은 `sideeffect`로 본다.
- `useState` 기반 공유 상태는 `store`로 본다.
- 트리 탐색, 평탄화, 변환 로직은 `action`으로 본다.

## 데이터 경계 원칙

- 공통 도메인 타입은 `shared/types/`를 기준으로 사용한다.
- 입력 검증은 `shared/schemas/`를 기준으로 맞춘다.
- 샘플 데이터와 fixture는 `shared/data/`에 둔다.
- 프론트엔드와 백엔드가 같은 도메인 구조를 반복 정의하지 않는다.

## 점검 항목

- `app/pages/`가 화면 조합 역할만 수행하는지 확인한다.
- 공통 상태가 `app/composables/` 또는 `shared/`에 모여 있는지 확인한다.
- `app/composables/`의 각 파일이 `action`, `sideeffect`, `store` 중 어느 책임인지 설명 가능한지 확인한다.
- 외부 지도 서버 접근이 서버 프록시 경계로 수렴되는지 확인한다.
- 브라우저 전역 객체 접근이 페이지가 아니라 composable 또는 래퍼에 모여 있는지 확인한다.
- 공통 타입과 검증 스키마가 `shared/` 기준으로 유지되는지 확인한다.
- 서버 전용 코드가 `app/`에 섞이지 않았는지 확인한다.
- 문서가 현재 프로젝트 목적과 패키지 구조를 정확히 설명하는지 확인한다.
