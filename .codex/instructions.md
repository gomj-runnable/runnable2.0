# Codex Instructions

이 프로젝트의 모든 규칙과 아키텍처 지침은 `CLAUDE.md`에 정의되어 있다.
Codex도 동일한 규칙을 따른다.

## 필수 참조 파일

작업 전 반드시 아래 파일을 읽고 규칙을 따를 것:

1. **`CLAUDE.md`** (프로젝트 루트) — 패키지 구조, 작업 원칙, 아키텍처, composable 분리, CSS 토큰 규칙 등 모든 프로젝트 규칙의 1차 기준
2. **`.claude/skills/`** — 반복 패턴의 구체적 구현 규칙
   - `runnable-architecture/SKILL.md` — 패키지 구조와 디렉터리 책임
   - `runnable-composables/SKILL.md` — action/sideeffect/store 분리 원칙
   - `runnable-components/SKILL.md` — UI 컴포넌트 계층 설계
   - `create-api-service/SKILL.md` — 외부 API 연동 패턴
   - `create-unified-api-response/SKILL.md` — 다중 API 통합 패턴
   - `create-map-overlay/SKILL.md` — 지도 오버레이 UI 패턴

## 핵심 규칙 요약

- 화면 조합: `app/pages/`, `app/components/<page>/templates/`
- 재사용 UI: `app/components/<page>/molecules/`
- 순수 계산: `app/composables/action/`
- 외부 API/브라우저: `app/composables/sideeffect/`
- 공유 상태: `app/composables/store/`
- 공통 타입/스키마: `shared/types/`, `shared/schemas/`
- API 엔드포인트: `server/api/`
- CSS 토큰: `app/assets/css/base/primitive.css`, `semantic.css`

## 3-에이전트 팀 워크플로우

| 역할 | 책임 |
|------|------|
| Architect | 시스템 분석, 구현 계획, 브리프 작성 (코드 수정 안 함) |
| Builder | 브리프 기반 코드 구현 (브리프 범위만 수정) |
| Tester | 품질 검증, 브리프 준수 여부 확인 |

상세 규칙은 `CLAUDE.md`의 "3-에이전트 팀 워크플로우" 섹션 참조.