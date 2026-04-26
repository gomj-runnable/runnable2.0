# CLAUDE.md

## 프로젝트 개요

이 저장소는 Cesium 3D 지도 기반 러닝 경로 제작 서비스를 위한 풀스택 프로젝트다.
프론트엔드는 `app/` 아래의 Vue/Nuxt UI를 사용하고, 백엔드는 `server/` 아래의 Nuxt 서버 기능으로 구성한다.
공통 도메인 코드와 타입, 상수, 샘플 데이터는 `shared/`에 둔다.
지도 렌더링과 외부 지도 엔진 연동은 브라우저 전용 경계로 분리해 다룬다.

## 패키지 구조

### Front-end (FSD — Feature-Sliced Design)

- `app/` : 프론트엔드 루트
- `app/entities/` : 도메인 엔티티 슬라이스 (boundary, facility, gradient, notification, route, user, weather)
- `app/features/` : 사용자 기능 슬라이스 (camera, discover, draw-route, elevation-layer, explore, route-info, simulation, weather-overlay)
- `app/shared/` : FSD 공용 레이어
- `app/shared/lib/` : 공용 composable (map/useCesiumRuntime, map/useMapInit, map/useTerrainSampler, useWindow, useFormatUtils 등)
- `app/shared/ui/` : 최소 단위 재사용 UI (BottomDrawer, Card, TextfieldCard 등)
- `app/widgets/` : 복합 위젯 (map-shell, facility-overlay, right-panel)
- `app/widgets/map-shell/` : 지도 셸 위젯 (MapShell, MapSidebar, MapFooter, MapSidebarTabs, useRouteMapFacade, useEntityCleanup)
- `app/assets/css/` : 전역 CSS, 디자인 토큰, 지도 UI 스타일
- `app/assets/images/` : 이미지 자산
- `app/assets/icons/` : 아이콘 자산
- `app/layouts/` : 공통 레이아웃
- `app/pages/` : 실제 라우트 페이지

각 FSD 슬라이스 내부 레이어:
- `api/` : 부수 효과 — 외부 API 통신, 브라우저 API 접근, Cesium Entity 조작 (구 `composables/sideeffect/`)
- `lib/` : 순수 계산 — 독립적인 유틸리티 함수, 데이터 변환 (구 `composables/action/`)
- `model/` : 상태 관리 — `useState` 기반 공유 상태, computed, mutation (구 `composables/store/`)
- `ui/` : Vue 컴포넌트 — 슬라이스 전용 UI

### Back-end

- `server/` : 백엔드 루트
- `server/api/` : API 엔드포인트
- `server/api/auth/` : better-auth 핸들러
- `server/api/boundary/` : 서울 행정경계 GeoJSON API
- `server/api/routes/` : 러닝 경로 CRUD API
- `server/api/weather/` : 날씨 API
- `server/routes/` : Nitro route 핸들러
- `server/database/` : DB 연결, 스키마, 시드
- `server/repositories/` : 데이터 접근 계층 (route.repository.ts = 인터페이스, route.repository.memory.ts = 인메모리 구현체)
- `server/utils/` : 인증, DB, 에러 공통 유틸
- `server/utils/weather/` : 날씨 서비스 (observed.adapter, forecast.adapter, merge.service, weather.service, common)

### Shared

- `shared/` : 프론트엔드와 백엔드 공용 코드
- `shared/constants/` : 상수 정의
- `shared/data/` : sample-data 함수
- `shared/schemas/` : 스키마 정의, 타입 및 클래스의 기준 (여기서 정의된 값은 type, class로써도 적용된다)
- `shared/types/` : 도메인 타입 정의

### 기타

- `lib/` : 외부 라이브러리 저장소, 일반적인 기능 수정 범위에서는 우선순위가 낮다
- `public/` : 참고 이미지, 기타 정적 자료

## 작업 원칙

- 화면 조합은 `app/pages/`에서 최소한으로 유지한다.
- 도메인 엔티티는 `app/entities/<도메인>/`에, 사용자 기능은 `app/features/<기능>/`에 둔다.
- 복합 위젯은 `app/widgets/`에 둔다.
- 재사용 가능한 최소 단위 UI는 `app/shared/ui/`에 둔다.
- 각 슬라이스 내부에서 책임을 `api`(부수 효과), `lib`(순수 계산), `model`(상태 관리)로 분리한다.
- 슬라이스 간 공용 composable은 `app/shared/lib/`에 둔다.
- 브라우저 전용 지도 화면은 `ssr: false` 페이지와 전용 layout으로 분리한다.
- 외부 지도 서버나 외부 API 접근은 가능하면 `server/routes/` 또는 `server/api/`를 경유한다.
- 프론트엔드와 백엔드가 함께 쓰는 정의는 `shared/`에 둔다.
- 도메인 타입과 입력 검증 스키마의 기준은 `shared/types/`, `shared/schemas/`에 둔다.
- 외부 라이브러리인 `lib/`는 직접 수정하기보다 래핑과 조합으로 대응한다.
- 문서를 수정할 때는 실제 디렉터리 구조와 서비스 목적이 일치해야 한다.
- 디자인 토큰은 `primitive -> semantic -> feature CSS` 순서로 계층을 유지한다.
- primitive token은 값 자체만 두고, semantic token은 역할 이름으로 재매핑한다.
- feature CSS(`widgets/**`, `features/**`, `pages/**`)에는 토큰 정의보다 실제 UI 규칙을 우선 둔다.

## 에이전트 작업 규칙

- `TODO:` 또는 `TODO 0.` 주석을 발견하면 설명으로 남기지 말고 해당 기능 구현을 우선 검토한다.
- `TODO`, `TODO-`, `TODO1` 등 다른 표기는 자동 구현 대상으로 간주하지 않는다.
- 사용자가 `@`로 첨부하지 않은 파일을 읽어야 하면 먼저 파일 경로와 읽는 이유를 짧게 설명하고 권한을 요청한다.
- 한 번 권한을 받은 범위 안에서만 추가 파일을 읽고, 범위를 벗어나면 다시 요청한다.
- 토큰 사용량을 줄이기 위해 필요한 파일과 직접 연관된 파일만 읽고, 광범위한 검색과 긴 출력은 피한다.
- 요약이 가능하면 원문 인용보다 요약을 우선하고, 진행 보고도 짧게 유지한다.
- 사용자가 이미 설명한 내용을 다시 요약하거나 반복하지 않는다.
- 이미 읽은 파일은 같은 대화 안에서 다시 읽지 않는다.
- 독립적인 도구 호출은 동시에 실행하고, 불필요한 호출을 최소화한다.
- 요청받은 범위만 수정한다. "전체에서 찾아줘" 식의 광범위한 탐색보다 "X 파일의 Y 함수"처럼 명확한 범위에 집중한다.

## 컨텍스트 관리

- 새로운 작업으로 전환할 때는 이전 컨텍스트를 수동으로 정리한다.
- 대화가 길어지면 컨텍스트 사용량을 확인하고, 60% 도달 시점에 `/compact`를 실행한다.
- 20줄 이상의 불필요한 출력이 예상되는 작업은 서브 에이전트로 처리한다.

## 토큰 절약 명령

- `/project:lean` : 최소 파일만 읽고, 짧은 진행 보고와 짧은 최종 답변으로 작업하도록 유도하는 프로젝트 전용 명령
- `/project:lean` 사용 시에는 필요한 파일 목록을 먼저 좁히고, 구현에 직접 필요한 구간만 읽는다.

## 3-에이전트 팀 워크플로우

모든 비trivial 작업은 아래 구조로 진행한다.

| 역할 | 모델 | 책임 |
|------|------|------|
| **설계 (Architect)** | Claude Opus 4.6 | 시스템 분석, 구현 계획, 브리프 작성 |
| **코딩 (Builder)** | Claude Sonnet 4.5 | 브리프 기반 코드 구현 |
| **테스트 (Tester)** | Claude Sonnet 4.5 | 품질 검증, 성능 테스트 |

작업 순서: Architect → Builder → Tester → Architect(최종 확인)

- Architect는 전체 구조를 파악하고 무엇을, 어느 파일에, 어떤 순서로 수정할지 브리프를 작성한다. 실제 코드 수정은 하지 않는다.
- Builder는 브리프에 명시된 파일과 범위만 수정한다. 브리프에 없는 기능은 추가하지 않는다.
- Tester는 변경된 코드의 품질과 브리프 준수 여부를 검증하고, 문제 발생 시 구체적인 수정 사항을 Builder에게 반환한다.

## Front-end 아키텍처

### 페이지와 레이아웃

- `app/pages/`는 화면 조합과 초기 진입만 담당한다.
- 브라우저 전용 지도 화면은 `definePageMeta({ ssr: false })` 형태를 기본으로 본다.
- 지도 전용 스타일은 일반 전역 스타일과 섞지 않고 `app/widgets/map-shell/ui/MapShell.vue`, `app/assets/css/base/main.css` 같은 전용 경계에 둔다.

### CSS 토큰과 스타일 경계

- raw value token은 `app/assets/css/base/primitive.css`에 둔다.
- semantic token은 `app/assets/css/base/semantic.css`에 두고, primitive token을 역할 이름으로 매핑한다.
- 전역 CSS 엔트리는 `app/assets/css/base/main.css`이며, `primitive.css`, `semantic.css`, `components/common.css` 순서의 import를 기준으로 본다.
- 지도 전역 레이아웃과 지도 DOM 전용 스타일은 `app/assets/css/base/main.css`의 전역 블록에서 관리한다.
- `app/assets/css/components/**`는 컴포넌트 단위 스타일만 둔다.
- `app/assets/css/pages/**`는 페이지 조합 스타일만 둔다.
- 현재 외부 CSS 경계는 `app/assets/css/components/templates/**`, `app/assets/css/components/molecules/**`, `app/assets/css/components/organization/**`, `app/assets/css/components/common.css`를 기본으로 본다.
- 숫자/색상/px 값을 컴포넌트 CSS에 직접 반복 선언하기보다 semantic token을 먼저 추가할 수 있는지 검토한다.
- 동일한 버튼, 카드, 입력, 라벨 골격이 반복되면 공용 CSS 블록으로 통합하고, 개별 컴포넌트는 modifier 또는 CSS 변수 override 중심으로 유지한다.
- 상태 표현은 `.active`, `.collapse`, `.w480` 같은 의미가 좁거나 값 중심인 이름보다 `.is-active`, `.is-collapsed` 같은 상태 이름과 semantic token 조합을 우선한다.
- 경로 정리나 UI 변경 후 더 이상 쓰지 않는 class, CSS variable override, 구분선 pseudo-element 같은 잔재는 바로 제거한다.

### 지도 엔진 연동

- Cesium, MapPrime 같은 브라우저 전역 객체는 직접 페이지에 흩뿌리지 않고 composable 또는 전용 래퍼로 감싼다.
- 스크립트 로딩, `window` 접근, viewer 초기화는 `api/` 레이어(부수 효과) 책임으로 본다.
- 공용 지도 초기화는 `app/shared/lib/map/`에 둔다 (useCesiumRuntime, useMapInit, useTerrainSampler).
- `window` 전역 확장은 한 곳에서 타입 선언으로 관리한다.
- 지도 엔진 리소스는 `/lib` 정적 자산과 `/proxy/**` 서버 프록시를 통해 연결한다.

### 좌표 체계와 폴리라인

- 프로젝트 전체에서 좌표 체계는 WGS84(`[longitude, latitude, elevation]` = `GeoJsonPosition`)로 통일한다.
- 경로 좌표의 단일 진실 소스는 `drawnPositions: Ref<GeoJsonPosition[] | null>`이다. 경로 그리기(draw)와 경로 목록(select) 모두 좌표를 `drawnPositions`에 반영해야 한다.
- 경사도, 고도 프로필 등 경로 좌표에 의존하는 공통 부수 효과(`api/`)는 `drawnPositions`를 watch하여 동작한다. 새로운 좌표 소스가 추가되더라도 `drawnPositions`에 반영하는 것으로 통합한다.
- 지면 고정 폴리라인이 겹칠 때는 기존 폴리라인을 `entity.show = false`로 숨기고 오버레이 폴리라인을 그린다. 오버레이 해제 시 `entity.show = true`로 복원한다. `createEntityGroup`의 `hide()/show()`를 사용한다.
- 경로 최적화(TMap/OSM 등) 후 section 분할은 API 반환 전체 포인트가 아니라 사용자가 클릭한 원본 waypoint 기준으로 한다. `createWaypointBasedSectionRanges(optimizedPositions, originalWaypoints)`를 사용한다.
- 여러 슬라이스가 공유해야 하는 상태는 `ref()`가 아닌 `useState()`를 사용한다. `ref()`는 호출마다 새 인스턴스를 생성하므로 교차 슬라이스 공유에 적합하지 않다.

### UI 공통 패턴

- 호버 시 tooltip을 표시하려면 `app/shared/ui/` 내의 HoverTooltip 컴포넌트를 사용한다. `#trigger` 슬롯에 호버 대상, `#content` 슬롯에 tooltip 내용을 배치한다. `placement`(`top`/`bottom`/`left`/`right`)와 `offset`(px) props로 위치를 제어한다.
- `app/shared/ui/`는 프로젝트 전역에서 재사용하는 최소 단위 UI 컴포넌트를 둔다 (BottomDrawer, Card, TextfieldCard 등).

### 상태와 데이터 흐름

- 페이지는 샘플 데이터나 서버 응답을 받아 `model/`에 반영하고, 화면 동작은 composable을 조합해 수행한다.
- 트리 탐색, 평탄화, 좌표 변환 같은 순수 계산은 `lib/`로 분리한다.
- `useState` 기반 공유 상태는 `model/` 책임으로 간주한다.

## Back-end 아키텍처

### API와 Route 경계

- `server/api/`는 애플리케이션 기능 엔드포인트를 둔다.
- `server/routes/`는 프록시, 정적 경로형 핸들러, 외부 서비스 중계 같은 Nitro route 경계를 둔다.
- 프론트엔드에서 직접 외부 서비스에 붙기보다 서버 경유 경계를 먼저 검토한다.

### Repository 패턴

- 데이터 접근은 `server/repositories/`에서 관리한다.
- `route.repository.ts`는 인터페이스(계약)를 정의하고, `route.repository.memory.ts`는 인메모리 구현체를 제공한다.
- DB 연동 구현체가 추가되어도 인터페이스를 교체 없이 바꿀 수 있도록 의존성 역전 원칙을 따른다.

### 인증과 DB 경계

- better-auth 설정과 핸들러 소유권은 `server/utils/auth.ts`, `server/api/auth/[...all].ts`에 둔다.
- DB 연결과 ORM 초기화는 `server/utils/db.ts`에 둔다.
- Drizzle 테이블 정의는 `server/database/schema/**`에 두고, 진입점은 `server/database/schema.ts`로 통합한다.
- 시드 데이터는 `server/database/seed.ts`에서 관리한다.

### 날씨 서비스 구조

- `server/utils/weather/`는 날씨 데이터 처리 파이프라인을 담당한다.
- `observed.adapter`: 현재 관측 데이터를 정규화한다.
- `forecast.adapter`: 예보 데이터를 정규화한다.
- `merge.service`: 관측 + 예보 데이터를 병합한다.
- `weather.service`: 외부 날씨 API 호출과 전체 파이프라인을 조율한다.
- `common`: 공통 타입과 유틸리티를 둔다.

## Shared 아키텍처

- `shared/types/`는 프론트엔드와 백엔드가 공유하는 도메인 타입의 기준이다.
- `shared/schemas/`는 Zod 같은 런타임 검증 스키마의 기준이다.
- `shared/data/`는 샘플 데이터, 목업 데이터, 개발용 fixtures를 둔다.
- 프론트엔드와 백엔드에서 공통 도메인 정의가 필요하면 로컬 정의를 복제하지 말고 `shared/`로 올린다.

## 외부 라이브러리 원칙

- `lib/`의 라이브러리는 정적 자산으로 취급하고 직접 수정하지 않는다.
- 브라우저 전용 외부 스크립트는 런타임 로딩과 래핑을 통해 사용한다.
- 외부 라이브러리 자체보다 이를 감싸는 프로젝트 코드의 경계를 우선 설계한다.

## FSD 레이어 분리 원칙

각 슬라이스(`entities/*`, `features/*`, `widgets/*`) 내부는 `api/`, `lib/`, `model/` 레이어로 역할을 분리한다. 하나의 composable이 여러 책임을 동시에 가지지 않도록 우선 구조를 나눈 뒤 구현한다.

### 구현 위임 규칙

- 각 슬라이스에서 캡슐화와 추상화를 기본 원칙으로 유지한다.
- 사용자가 추상 클래스나 추상 함수를 만들면 구현체는 `*Impl` 이름으로 분리해 추가한다.
- 구현체 파일과 클래스, 함수의 상세 구현은 `*Impl` 쪽에 위임한다.
- 사용자가 지정한 파라미터와 반환값은 계약으로 취급하고 임의로 바꾸지 않는다.
- 파라미터나 반환값 계약을 조정해야 하면 먼저 이유를 설명하고 사용자 권한을 요청한다.
- `*Impl` 하위 코드는 에이전트가 책임지고 완성한다.

### `lib/` (순수 계산)

- 독립적인 유틸리티 기능을 구현한다.
- 외부 API 호출, 전역 상태 저장, 브라우저 IO에 직접 의존하지 않는다.
- 입력과 출력이 분명해야 하며 재사용과 조합이 쉬워야 한다.
- 가능하면 작은 단위 함수로 쪼개고 테스트가 쉬운 형태를 유지한다.
- 예: 트리 탐색, 노드 평탄화, 좌표/데이터 변환

### `api/` (부수 효과)

- 외부 API 통신, 브라우저 기능 접근, 타이머, 로깅 등 부수 효과를 관리한다.
- 부수 효과의 시작점과 종료 조건이 코드에서 분명히 드러나야 한다.
- 테스트 가능성을 위해 의존성 주입, 래핑, 인터페이스 분리를 우선 고려한다.
- 상태를 직접 소유하기보다 `model/`과 연결하거나 호출 결과를 반환하는 방식으로 구성한다.
- 예: Cesium 스크립트 로딩, MapPrime viewer 초기화, 외부 API 호출, DOM 접근

### `model/` (상태 관리)

- 화면과 기능에서 공유하는 데이터 상태를 관리한다.
- 읽기, 쓰기, 파생 상태를 한 곳에서 이해할 수 있게 유지한다.
- 가능한 한 상태 전이 규칙을 명시적으로 드러낸다.
- 외부 통신 자체는 `api/`에 두고, `model/`은 상태 반영과 구독 가능한 데이터 제공에 집중한다.
- 예: `useState` 기반 theme-map 상태, 로딩 상태, 선택 상태

## FSD 레이어 점검 항목

- 유틸성 로직이 `model/`이나 `api/`에 불필요하게 섞여 있지 않은지 확인한다.
- 외부 통신 코드가 `lib/`에 들어가지 않았는지 확인한다.
- 상태 변경 책임이 `api/`에 과도하게 들어가지 않았는지 확인한다.
- 하나의 composable이 `lib/`, `api/`, `model/`의 책임을 동시에 수행하지 않는지 확인한다.
- 브라우저 전용 지도 엔진 접근이 페이지에 직접 남아 있지 않은지 확인한다.
- 외부 지도 서버 호출이 프론트엔드에서 직접 수행되지 않는지 확인한다.

## 빠른 판단표

- 화면 조합 변경: `app/pages/` 또는 `app/widgets/*/ui/`
- 도메인 엔티티 추가: `app/entities/<도메인>/` (api, lib, model, ui)
- 사용자 기능 추가: `app/features/<기능>/` (api, lib, model, ui)
- 복합 위젯 추가: `app/widgets/<위젯>/` (lib, model, ui)
- 순수 계산 로직: 해당 슬라이스의 `lib/` 또는 `app/shared/lib/`
- 외부 API, 브라우저 API, 지도 초기화: 해당 슬라이스의 `api/`
- 공유 상태: 해당 슬라이스의 `model/`
- 최소 단위 재사용 UI: `app/shared/ui/`
- 공용 지도 composable: `app/shared/lib/map/`
- 외부 CSS 수정: `app/assets/css/components/**`, `app/assets/css/pages/**`
- 토큰 수정: `app/assets/css/base/primitive.css`, `app/assets/css/base/semantic.css`
- 공통 타입, 스키마, fixture: `shared/**`
- API, 프록시, 인증, DB: `server/**`

## 현재 .claude Skill

### 프로젝트 구조 스킬

- `runnable-architecture` : 러닝 경로 제작 서비스의 패키지 구조와 작업 규칙을 따르기 위한 프로젝트 전용 스킬
- `runnable-composables` : `app/composables/action`, `app/composables/sideeffect`, `app/composables/store`의 책임 분리를 따르기 위한 프로젝트 전용 스킬
- `runnable-components` : `app/components/<page>/molecules/`와 `app/components/<page>/templates/` 계층 기준으로 Toss Flat+Compound 원칙에 따라 UI 컴포넌트를 설계하고 구현하기 위한 프로젝트 전용 스킬

### 생성(Create) 스킬

- `create-api-service` : 외부 API 연동 시 원본 Response Class + 추상화 Local Response 분리, `service.requestBy{기준}()` 네이밍 규칙을 따르기 위한 프로젝트 전용 스킬
- `create-bottom-drawer` : `BottomDrawer` 래퍼 컴포넌트를 감싸 하단 Drawer UI를 구현하기 위한 프로젝트 전용 스킬
- `create-domain-type` : `shared/types` + `shared/schemas` + `shared/data` 3파일을 Base/DraftInput/Saved 계층으로 동시 생성하기 위한 프로젝트 전용 스킬
- `create-map-layer-sideeffect` : Cesium Entity 생명주기(add/remove/clear) + Options DI + Init/Destroy 패턴으로 지도 레이어 sideeffect를 구현하기 위한 프로젝트 전용 스킬
- `create-map-overlay` : MapShell `#overlay` 슬롯에 배치되는 부유 UI(지도 위 컨트롤 패널)의 공통 구조·CSS 패턴을 따르기 위한 프로젝트 전용 스킬
- `create-popup-modal` : Vue 3 Chip Button + Modal Popup 구현 규칙을 따르기 위한 프로젝트 전용 스킬
- `create-server-crud` : Nitro API 핸들러 4종(GET/POST/PUT/DELETE) + Repository 인터페이스/InMemory/Drizzle/팩토리 4파일 세트를 생성하기 위한 프로젝트 전용 스킬
- `create-session-doc` : 현재 세션에서 수행한 작업을 `docs/session/` 하위에 날짜별 markdown으로 기록하기 위한 프로젝트 전용 스킬
- `create-store-composable` : `useState` + `computed` + mutation 함수의 3단 구조와 토글/데이터 2가지 유형의 store composable을 생성하기 위한 프로젝트 전용 스킬
- `create-type-role` : 복수 API 응답 통합 시 공통 도메인 타입 → adapter 정규화 → 서비스 소비 패턴을 정의하기 위한 프로젝트 전용 스킬
- `create-unified-api-response` : 한 기능에서 2개 이상 API 사용 시 공통 Local Response를 정의하고, 호출부 외 모든 후속 로직을 통일하는 프로젝트 전용 스킬

### 동기화·인프라 스킬

- `sync-overlay-visibility` : 경로 카드와 연관 오버레이 UI(시뮬레이션·경로정보·고도·경사도)의 가시성을 `MapOverlayContextEnum` 기반으로 동기화하기 위한 프로젝트 전용 스킬
- `tailscale-funnel` : macOS에서 Tailscale Funnel을 사용해 로컬 포트를 외부 HTTPS로 노출/종료하기 위한 인프라 스킬

## 현재 .claude Command

- `lean` : 토큰 사용량을 최소화하기 위해 읽기 범위, 출력 길이, 보고 방식을 압축하는 프로젝트 전용 명령
