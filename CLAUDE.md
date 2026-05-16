# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. One Issue Per Branch · PR-Only Close

**머지 누락 사고 방지 규칙.**

브랜치/세션은 **이슈 1개**(또는 명시적 epic)만 다룬다.

- 여러 이슈를 한 브랜치에 누적하지 않는다. 충돌 머지 시 한 이슈의 변경 파일이 통째로 누락돼도 사람이 추적 못 함.
- 별도 이슈가 발견되면 새 브랜치를 파거나 사용자에게 분리를 제안한다.

이슈는 **PR 머지로만 close** 한다 (수동 close 금지).

- PR 본문에 `Closes #N` 키워드를 반드시 명시 — 머지 시 자동 close 되도록.
- "구현 완료" 코멘트를 단 뒤 사용자가 수동 close 하는 흐름은 금지. "이슈 closed = master 에 코드 반영됨" 이 보장돼야 한다.

PR 머지 후 셀프 검증:

- 이슈 본문/코멘트에 명시된 "변경 파일 목록" 이 PR diff 에 실제로 있는지 grep 확인.
- 없으면 머지 충돌 해결 시 누락된 것 — 즉시 후속 PR 로 보완.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

> 모든 답변은 한들로 작성해줘.
