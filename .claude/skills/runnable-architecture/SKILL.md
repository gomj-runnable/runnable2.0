---
name: runnable-architecture
description: This skill should be used when the user asks to "러닝 경로 서비스 구조를 정리", "Runnable 아키텍처에 맞게 수정", "front-end와 back-end 패키지 규칙에 맞춰 작업", "README나 CLAUDE 문서를 프로젝트 구조에 맞게 갱신"해야 할 때. 구조 경계와 디렉터리 책임을 빠르게 판별하는 기준으로 쓴다.
---

# Runnable Architecture Skill

러닝 경로 제작 서비스를 기준으로 저장소 구조와 수정 원칙을 적용한다.

## 목적

- 프론트엔드와 백엔드가 함께 있는 Nuxt 기반 프로젝트에서 일관된 디렉터리 규칙을 유지한다.
- 지도 화면 중심 UI, 서버 기능, 공통 도메인 코드를 서로 다른 경계로 유지한다.
- 브라우저 전용 지도 엔진과 서버 경유 외부 연동 경계를 명확히 유지한다.

## 언제 이 스킬을 우선 쓰는가

- 파일을 어디에 둬야 할지 판단해야 할 때
- `app/`, `server/`, `shared/` 중 어느 경계에서 수정해야 할지 모호할 때
- 문서, 디렉터리 구조, 아키텍처 규칙을 현재 코드 기준으로 정리할 때
- UI 작업이지만 단순 스타일링보다 구조 재배치가 핵심일 때

## 디렉터리 원칙

### Front-end (`app/`)

- `app/`은 프론트엔드를 담당한다.
- `app/assets/`는 CSS, 이미지, 아이콘 등 정적 UI 자산을 저장한다.
- `app/assets/css/` : 전역 CSS와 지도 UI 스타일
- `app/assets/images/` : 이미지 자산
- `app/assets/icons/` : 아이콘 자산

스타일 자산은 다음 구조를 기본으로 본다.
- `app/assets/css/base/primitive.css` : raw token
- `app/assets/css/base/semantic.css` : semantic token
- `app/assets/css/base/main.css` : 전역 엔트리 CSS와 지도 전역 스타일
- `app/assets/css/components/**` : 컴포넌트와 template 외부 CSS
- `app/assets/css/pages/**` : 페이지 조합 전용 CSS

`app/components/`는 컴포넌트 단위 UI 구현에 사용한다.
- 하위에 각 페이지별 독립 패키지를 둔다 (`app/components/<page>/`)
- 해당 독립 패키지 내부에서 `molecules/`, `templates/` 계층을 기본으로 두고, 필요한 경우에만 `atoms/`를 제한적으로 둔다

`app/composables/`는 상태 관리, 독립 유틸, 사이드 이펙트를 담당한다.

- `app/composables/action/` : 독립적인 유틸리티 기능 패키지
- `app/composables/sideeffect/` : 외부 API 통신 등 부수 효과를 이해하기 쉽고 테스트 가능하게 관리하는 패키지
- `app/composables/store/` : 데이터 상태를 관리하는 패키지

`app/pages/`는 실제 라우트 페이지를 구성한다. 화면 조합 역할만 수행하고 최소화를 유지한다.
- 브라우저 전용 지도 페이지는 `ssr: false`를 사용하고, 별도 layout이 꼭 필요하지 않다면 page/template 경계에서 해결한다.

### Back-end (`server/`)

- `server/`는 백엔드를 담당한다.
- `server/api/` : API 엔드포인트
- `server/routes/` : Nitro route 핸들러, 프록시, 외부 서비스 중계
- `server/database/` : DB 스키마 및 시드 코드
- `server/utils/` : 인증, DB 연결, 에러 처리 등 서버 유틸리티

- better-auth 설정은 `server/utils/auth.ts`에 두고 `server/api/auth/[...all].ts`에서 개방한다
- DB 연결과 Drizzle 초기화는 `server/utils/db.ts`에서 관리한다
- Drizzle 스키마 진입점은 `server/database/schema.ts`로 통합한다

### Shared (`shared/`)

- `shared/`는 프론트엔드와 백엔드가 함께 쓰는 코드를 둔다.
- `shared/constants/` : 상수값 정의
- `shared/data/` : 샘플 데이터, 목업, fixture
- `shared/schemas/` : Zod 등 런타임 검증 스키마 정의
- `shared/types/` : 도메인 타입 정의

### 기타

`lib/`는 외부 라이브러리 보관 영역이다. 일반 작업에서는 직접 수정하지 않고 래핑과 조합으로 대응한다.
- Cesium, MapPrime 같은 브라우저 전용 라이브러리는 `/lib` 정적 자산과 런타임 로딩 방식으로 연결한다.

`public/`은 정적인 참고 자료와 요구사항 정의서, 이미지 등 서빙 가능한 파일을 둔다.

## 작업 원칙

- UI를 수정할 때는 먼저 `app/pages/`에서 렌더링 진입점을 확인한다.
- 재사용 가능한 UI는 `app/components/`에 둔다.
- 공통 디자인 규격은 `app/assets/css/base/primitive.css`, `app/assets/css/base/semantic.css`에 우선 정의한다.
- Vue 파일 안에 스타일 정의를 직접 쓰지 말고 외부 CSS 파일로 분리한다.
- 상태나 부수효과 변경은 `app/composables/`에 우선 배치한다.
- `app/composables/` 내부에서는 `action`, `sideeffect`, `store` 책임을 분리한다.
- 페이지에서 브라우저 전역 객체를 직접 다루기보다 composable 경계로 감싼다.
- 외부 서비스 호출은 프론트엔드 직결보다 `server/routes/` 또는 `server/api/` 경유를 우선한다.
- 프론트엔드와 백엔드가 함께 쓰는 타입 또는 스키마는 `shared/`로 올린다.
- 문서를 갱신할 때는 러닝 경로 제작 서비스라는 목적과 실제 디렉터리 구조를 함께 반영한다.
- 외부 라이브러리 파일(`lib/`)은 직접 수정하지 않고 가능한 한 래핑해서 사용한다.
- `TODO:` 또는 `TODO 0.` 은 구현 대상으로 취급하고, `TODO`, `TODO-` 등 다른 표기는 자동 구현 대상으로 취급하지 않는다.
- 사용자가 `@`로 첨부하지 않은 파일을 읽어야 하면 먼저 권한을 요청한다.
- 토큰 사용량을 줄이기 위해 필요한 파일만 읽고 긴 출력은 피한다.

## 데이터 경계 원칙

- 공통 도메인 타입은 `shared/types/`를 기준으로 사용한다.
- 입력 검증은 `shared/schemas/`를 기준으로 맞춘다.
- draw 응답처럼 프론트와 백엔드가 함께 해석해야 하는 변환 규칙은 `shared/schemas/` 안의 class로 올려 schema와 같은 경계에서 관리한다.
- 샘플 데이터와 fixture는 `shared/data/`에 둔다.
- 프론트엔드와 백엔드가 같은 도메인 구조를 반복 정의하지 않는다.

## 빠른 판단표

- 화면 조합 변경: `app/pages/` 또는 `app/components/<page>/templates/`
- 재사용 UI 추가: `app/components/<page>/molecules/` 또는 `app/components/<page>/templates/`
- CSS 토큰/공통 스타일: `app/assets/css/base/**`, `app/assets/css/components/**`
- 순수 계산 로직: `app/composables/action/`
- 외부 통신, 브라우저 API, 지도 초기화: `app/composables/sideeffect/`
- 공유 상태: `app/composables/store/`
- 프론트/백 공통 타입, 스키마, fixture: `shared/**`
- API, 프록시, 인증, DB: `server/**`

## 점검 항목

- `app/pages/`가 화면 조합 역할만 수행하는지 확인한다.
- 공통 상태가 `app/composables/` 또는 `shared/`에 모여 있는지 확인한다.
- 외부 지도 서버 접근이 서버 프록시 경계로 수렴되는지 확인한다.
- 브라우저 전역 객체 접근이 페이지가 아니라 composable 또는 래퍼에 모여 있는지 확인한다.
- 공통 타입과 검증 스키마가 `shared/` 기준으로 유지되는지 확인한다.
- 서버 전용 코드가 `app/`에 섞이지 않았는지 확인한다.
- 문서가 현재 프로젝트 목적과 패키지 구조를 정확히 설명하는지 확인한다.
- 읽지 않은 파일을 추측으로 인용하지 않았는지 확인한다.
