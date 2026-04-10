---
name: runnable-architecture
description: This skill should be used when the user asks to "러닝 경로 서비스 구조를 정리", "Runnable 아키텍처에 맞게 수정", "front-end와 back-end 패키지 규칙에 맞춰 작업", "README나 CLAUDE 문서를 프로젝트 구조에 맞게 갱신"해야 할 때. 구조 경계와 디렉터리 책임을 빠르게 판별하는 기준으로 쓴다.
---

# Runnable Architecture

> 작업 원칙·패키지 구조·composable 분리 규칙은 `CLAUDE.md`를 기준으로 한다. 이 스킬은 **판단이 모호할 때의 추가 기준**만 둔다.

## 디렉터리 빠른 판단표

| 변경 대상 | 위치 |
|-----------|------|
| 화면 조합 | `app/pages/` · `app/components/<page>/templates/` |
| 재사용 UI | `app/components/<page>/molecules/` · `templates/` |
| CSS 토큰 | `app/assets/css/base/primitive.css` · `semantic.css` |
| 컴포넌트 외부 CSS | `app/assets/css/components/**` |
| 페이지 CSS | `app/assets/css/pages/**` |
| 순수 계산 | `app/composables/action/` |
| 외부 API·브라우저·지도 | `app/composables/sideeffect/` |
| 공유 상태 | `app/composables/store/` |
| 공통 타입·스키마·fixture | `shared/**` |
| API·프록시·인증·DB | `server/**` |
| 외부 라이브러리 | `lib/` (직접 수정 금지, 래핑으로 대응) |

## 데이터 경계

- 공통 도메인 타입 → `shared/types/`, 입력 검증 → `shared/schemas/`
- draw 응답 변환 등 공통 해석 규칙 → `shared/schemas/` 내 class
- 프론트·백에서 같은 도메인 정의를 복제하지 않고 `shared/`로 올린다

## 서버 경계

| 경계 | 위치 |
|------|------|
| better-auth 설정 | `server/utils/auth.ts` → `server/api/auth/[...all].ts` |
| DB·ORM | `server/utils/db.ts` · `server/database/schema.ts` |
| 외부 서비스 중계 | `server/routes/` (프론트 직결보다 서버 경유 우선) |

## 점검 항목

- `app/pages/`가 화면 조합만 수행하는가
- 외부 지도 서버 접근이 서버 프록시로 수렴되는가
- 브라우저 전역 객체가 composable/래퍼에 모여 있는가
- 공통 타입·스키마가 `shared/` 기준인가
- 문서가 현재 구조와 일치하는가
