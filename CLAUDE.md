# CLAUDE.md

## 프로젝트 개요

이 저장소는 러닝 경로 제작 서비스를 위한 풀스택 프로젝트다.
프론트엔드는 `app/` 아래의 Vue/Nuxt UI를 사용하고, 백엔드는 `server/` 아래의 Nuxt 서버 기능으로 구성한다.
공통 도메인 코드와 타입, 상수, 샘플 데이터는 `shared/`에 둔다.

## 패키지 구조

### Front-end

- `app/` : 프론트엔드 루트
- `app/assets/css/` : 전역 CSS와 지도 UI 스타일
- `app/assets/images/` : 이미지 자산
- `app/assets/icons/` : 아이콘 자산
- `app/components/` : 페이지 단위 UI 컴포넌트
- `app/components/<page>/` : 페이지별 독립 컴포넌트 패키지
- `app/components/<page>/molecules/` : atomic design 기준의 중간 단위 컴포넌트
- `app/components/<page>/templates/` : 페이지 조합 단위 컴포넌트
- `app/composables/` : 상태 관리, 데이터 조합, 부수효과 처리
- `app/layouts/` : 공통 레이아웃
- `app/pages/` : 실제 라우트 페이지

### Back-end

- `server/` : 백엔드 루트
- `server/api/` : API 엔드포인트
- `server/routes/` : Nitro route 핸들러
- `server/database/` : DB 연결, 스키마, 시드
- `server/utils/` : 인증, DB, 에러 공통 유틸

### Shared

- `shared/` : 프론트엔드와 백엔드 공용 코드
- `shared/constants/` : 상수 정의
- `shared/data/` : sample-data 함수
- `shared/schemas/` : 스키마 정의, 타입 및 클래스의 기준 (여기서 정의된 값은 type, class로써도 적용된다)
- `shared/types/` : 도메인 타입 정의
- `shared/types/` : 도메인 타입 정의

### 기타

- `lib/` : 외부 라이브러리 저장소, 일반적인 기능 수정 범위에서는 우선순위가 낮다
- `public/` : 요구사항 정의서, 참고 이미지, 기타 정적 자료

## 작업 원칙

- 화면 조합은 `app/pages/`에서 최소한으로 유지한다.
- 재사용 가능한 UI는 `app/components/`에 둔다.
- 상태와 사이드 이펙트는 `app/composables/`로 이동한다.
- 프론트엔드와 백엔드가 함께 쓰는 정의는 `shared/`에 둔다.
- 외부 라이브러리인 `lib/`는 직접 수정하기보다 래핑과 조합으로 대응한다.
- 문서를 수정할 때는 실제 디렉터리 구조와 서비스 목적이 일치해야 한다.

## 현재 .claude Skill

- `runnable-architecture` : 러닝 경로 제작 서비스의 패키지 구조와 작업 규칙을 따르기 위한 프로젝트 전용 스킬
