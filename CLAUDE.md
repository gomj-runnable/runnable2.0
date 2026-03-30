# CLAUDE.md — SKILL 가이드

## SKILL이란?

SKILL은 Claude Code에서 특정 도메인이나 작업에 특화된 지식·워크플로우·도구를 모듈 단위로 제공하는 확장 기능이다.
범용 Claude를 특정 분야 전문가로 변환하는 "온보딩 가이드"라고 볼 수 있다.

### SKILL이 제공하는 것

- **전문화된 워크플로우** — 특정 도메인의 다단계 절차
- **도구 통합** — 특정 파일 형식·API 사용 방법
- **도메인 지식** — 프로젝트별 비즈니스 로직, 스키마, 정책
- **번들 리소스** — 복잡·반복 작업을 위한 스크립트·참조 자료

---

## SKILL 파일 구조

모든 SKILL은 `SKILL.md`(필수)와 선택적 번들 리소스로 구성된다.

```
skills/
└── <skill-name>/
    ├── SKILL.md          # 필수
    ├── references/       # 참조 문서 (필요 시 컨텍스트에 로드)
    ├── examples/         # 동작하는 예시 코드
    ├── scripts/          # 실행 가능한 스크립트 (Python/Bash 등)
    └── assets/           # 출력에 사용되는 파일 (템플릿·이미지 등)
```

### SKILL.md 프론트매터

```yaml
---
name: skill-name           # 필수 — kebab-case 이름
description: >             # 필수 — 트리거 조건 명시 (3인칭)
  This skill should be used when the user asks to "동작1", "동작2", ...
version: 0.1.0             # 선택
disable-model-invocation: true  # 선택 — true면 사용자 직접 실행만 허용
---
```

**description 작성 규칙:**
- 3인칭 서술 (`This skill should be used when...`)
- 사용자가 실제로 입력할 구체적인 트리거 문구 포함
- 모호한 설명 지양

```yaml
# 좋은 예
description: This skill should be used when the user asks to "nuxt로 마이그레이션", "Vue 3으로 전환", "composable 분리"를 요청할 때.

# 나쁜 예
description: Nuxt 관련 작업을 위한 스킬.  # 트리거 문구 없음, 3인칭 아님
```

---

## 번들 리소스 상세

### `references/`

Claude가 작업 중 참조할 문서를 저장한다. 필요할 때만 컨텍스트에 로드된다.

- DB 스키마, API 명세, 정책 문서, 상세 가이드
- 파일이 크면(10k 단어 이상) SKILL.md에 grep 패턴을 제공한다.

### `scripts/`

반복적으로 작성되거나 결정론적 신뢰성이 필요한 실행 코드.

- 유효성 검사 도구, 테스트 헬퍼, 파싱 유틸리티
- 컨텍스트 로드 없이 실행 가능하므로 토큰 효율적

### `assets/`

출력에 사용되는 파일. 컨텍스트에 로드되지 않고 복사·수정된다.

- 템플릿, 이미지, 아이콘, 보일러플레이트 코드, 폰트

### `examples/`

완전하고 실행 가능한 예시. 사용자가 직접 복사·응용할 수 있다.

---

## 점진적 공개 (Progressive Disclosure)

SKILL은 3단계 로딩 시스템으로 컨텍스트를 효율적으로 관리한다.

| 단계 | 내용 | 항상 로드? |
|------|------|-----------|
| 1 | `name` + `description` (메타데이터) | 항상 (~100 words) |
| 2 | `SKILL.md` 본문 | 트리거 시 (<5k words) |
| 3 | 번들 리소스 (`references/` 등) | 필요 시 (무제한) |

**SKILL.md 본문은 1,500~2,000 단어를 목표로 유지한다.** 상세 내용은 `references/`로 이동한다.

---

## SKILL 작성 스타일

본문 전체를 **명령형/부정사형**으로 작성한다. 2인칭 금지.

```markdown
# 올바른 예 (명령형)
구성 파일을 먼저 읽는다.
입력값을 검증한 뒤 처리한다.

# 잘못된 예 (2인칭)
당신은 구성 파일을 먼저 읽어야 합니다.
입력값을 검증해야 합니다.
```

---

## SKILL 사용 방법

SKILL은 두 가지 방법으로 사용한다.

### 1. 자동 트리거

Claude가 사용자의 요청을 분석해 `description`의 트리거 문구와 일치하면 자동으로 SKILL을 로드한다.

### 2. 슬래시 커맨드로 직접 호출

```
/<skill-name> [인자]
```

예시:
```
/nuxt-migrate app/pages/map.vue
```

---

## 이 프로젝트의 SKILL

| SKILL | 경로 | 설명 |
|-------|------|------|
| `nuxt-migrate` | `.claude/skills/nuxt-migrate/` | 바닐라 JS/HTML → Nuxt 3 + Vue 3 Composition API 마이그레이션 |

---

## 새 SKILL 만들기

```bash
mkdir -p .claude/skills/<skill-name>/{references,scripts,examples}
touch .claude/skills/<skill-name>/SKILL.md
```

`SKILL.md` 최소 구성:

```markdown
---
name: skill-name
description: This skill should be used when the user asks to "트리거1", "트리거2".
---

# Skill 이름

## 목적

이 스킬이 하는 일을 2~3문장으로 설명한다.

## 절차

1. 첫 번째 단계
2. 두 번째 단계

## 추가 리소스

- **`references/guide.md`** — 상세 가이드
```

---

## 검증 체크리스트

- [ ] `SKILL.md`에 `name`과 `description` 프론트매터 존재
- [ ] `description`이 3인칭이며 구체적인 트리거 문구 포함
- [ ] 본문이 명령형/부정사형으로 작성됨
- [ ] SKILL.md 본문이 5,000 단어 미만 (이상이면 `references/`로 분리)
- [ ] 참조하는 파일이 실제로 존재함
- [ ] `references/`·`scripts/`·`examples/`를 SKILL.md에서 명시적으로 안내함