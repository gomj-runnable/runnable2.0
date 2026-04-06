# AGENTS.md

이 저장소에서 작업하는 Codex 에이전트는 먼저 `CLAUDE.md`를 읽고, 그 문서를 프로젝트 규칙의 1차 기준으로 따른다.

## Primary Source

- 프로젝트 구조, 작업 원칙, 아키텍처 경계, 에이전트 작업 규칙은 `CLAUDE.md`를 우선 참조한다.
- 이 파일은 Codex가 `.claude` 자산과 현재 프로젝트 규칙을 빠르게 연결하기 위한 진입점이다.
- `AGENTS.md`와 `CLAUDE.md`가 충돌하면 더 구체적인 지침을 우선하되, 특별한 이유가 없으면 `CLAUDE.md` 기준으로 해석한다.

## Claude Assets

- 아키텍처/문서/패키지 구조 관련 작업: `.claude/skills/runnable-architecture/SKILL.md`
- 컴포넌트/UI/layout 작업: `.claude/skills/runnable-components/SKILL.md`
- `app/composables/` 책임 분리 작업: `.claude/skills/runnable-composables/SKILL.md`
- 토큰을 아껴야 하는 작업: `.claude/commands/lean.md`

컴포넌트/UI/layout 작업에는 `app/assets/css/base/primitive.css`, `app/assets/css/base/semantic.css`, `app/assets/css/base/main.css`, `app/assets/css/components/**`, `app/assets/css/pages/**`의 토큰/스타일 경계 정리도 포함한다.
최근 구조 기준으로 외부 CSS는 `app/assets/css/components/templates/**`, `app/assets/css/components/molecules/**`, `app/assets/css/components/organization/**`, `app/assets/css/components/common.css`를 우선 확인한다.

## Expected Workflow

- 작업 전 `CLAUDE.md`에서 현재 변경 범위와 직접 관련된 규칙을 먼저 확인한다.
- 변경이 architecture, components, composables 중 하나에 해당하면 대응되는 `.claude/skills/*/SKILL.md`도 함께 참고한다.
- CSS 토큰 구조를 바꾸거나 공통 스타일을 통합할 때는 `CLAUDE.md`의 token 계층 규칙과 `runnable-components` 스킬의 CSS 규칙을 함께 따른다.
- Vue 파일의 `style src`와 실제 CSS 파일 경로가 일치하는지 항상 확인한다.
- 문서 내용을 복제하기보다 기존 `.claude` 문서를 기준으로 구현과 리뷰를 진행한다.
- 새 프로젝트 규칙이 생기면 가능하면 `CLAUDE.md` 또는 `.claude/skills`를 갱신하고, 이 파일에는 연결 정보만 최소한으로 유지한다.

## 3-에이전트 협업 구조

복잡한 작업에서 방향을 잃지 않기 위해 역할을 세 단계로 분리한다.

### Architect (설계자)
- 전체 시스템 구조를 파악하고 세부 구현 계획을 수립한다.
- 무엇을, 어떤 순서로, 어느 파일을 수정할지에 대한 브리프를 작성한다.
- 실제 코드 수정은 하지 않으며 계획 확정 후 Builder에게 전달한다.

### Builder (구현자)
- Architect가 작성한 브리프에 따라 정확하게 코드를 구현한다.
- 브리프에 없는 기능은 추가하지 않으며, 지정된 파일만 수정한다.
- 전체 코드베이스를 탐색하지 않고 할당된 범위에만 집중한다.

### Reviewer (검증자)
- Builder가 완성한 코드의 품질 및 브리프 준수 여부를 검증한다.
- 변경된 부분만 집중 확인하며, 문제 발생 시 구체적인 수정 사항을 Builder에게 반려한다.

### 작업 순서
1. **Architect**: 계획 수립 및 브리프 전달
2. **Builder**: 브리프 기반 코드 구현
3. **Reviewer**: 코드 검토 및 최종 확인
4. **Architect**: 최종 결과물 확인 후 세션 종료
