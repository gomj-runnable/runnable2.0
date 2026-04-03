# AGENTS.md

이 저장소에서 작업하는 Codex 에이전트는 먼저 `CLAUDE.md`를 읽고, 그 문서를 프로젝트 규칙의 1차 기준으로 따른다.

## Primary Source

- 프로젝트 구조, 작업 원칙, 아키텍처 경계, 에이전트 작업 규칙은 `CLAUDE.md`를 우선 참조한다.
- 이 파일은 Codex가 `.claude` 자산을 놓치지 않도록 연결하는 얇은 진입점이다.
- `AGENTS.md`와 `CLAUDE.md`가 충돌하면 더 구체적인 지침을 우선하되, 특별한 이유가 없으면 `CLAUDE.md` 기준으로 해석한다.

## Claude Assets

- 아키텍처/문서/패키지 구조 관련 작업: `.claude/skills/runnable-architecture/SKILL.md`
- 컴포넌트/UI/layout 작업: `.claude/skills/runnable-components/SKILL.md`
- `app/composables/` 책임 분리 작업: `.claude/skills/runnable-composables/SKILL.md`
- 토큰을 아껴야 하는 작업: `.claude/commands/lean.md`

## Expected Workflow

- 작업 전 `CLAUDE.md`에서 현재 변경 범위와 직접 관련된 규칙을 먼저 확인한다.
- 변경이 architecture, components, composables 중 하나에 해당하면 대응되는 `.claude/skills/*/SKILL.md`도 함께 참고한다.
- 문서 내용을 복제하기보다 기존 `.claude` 문서를 기준으로 구현과 리뷰를 진행한다.
- 새 프로젝트 규칙이 생기면 가능하면 `CLAUDE.md` 또는 `.claude/skills`를 갱신하고, 이 파일에는 연결 정보만 최소한으로 유지한다.
