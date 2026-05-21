---
description: 테스트 커버리지 epic #267 다음 Phase 자동 진행 (이전 세션 컨텍스트 자동 로드)
---

# Coverage Next — epic #267 자동 이어가기

이 명령은 새 세션에서 테스트 커버리지 epic #267 의 다음 Phase 를 바로 시작한다.

## 0. 컨텍스트 로드 (필수, 무조건 먼저)

다음 메모리를 읽어 epic 상태와 PR 정책을 파악한다:

- `@.claude/projects/-Users-mjkim-developer-projects-runnable2-0/memory/coverage_epic.md`
- `@.claude/projects/-Users-mjkim-developer-projects-runnable2-0/memory/coverage_pr_policy.md`

그리고 GitHub epic 의 최신 진척을 확인한다:

```bash
gh issue view 267 --json title,body,state
gh pr list --state merged --limit 10 --search "Refs #267 in:body"
```

## 1. 현재 커버리지 baseline 측정

```bash
git checkout master && git pull origin master
pnpm test:cov 2>&1 | tail -10
```

`coverage/coverage-summary.json` 의 \`total.lines.pct\` 를 기록한다.

## 2. 다음 Phase 결정

epic 본문의 체크박스 상태와 커버리지 결과를 보고 다음 중 하나를 선택해 **사용자에게 1줄로 확인** 받는다:

| Phase | 대상 | 권장 우선순위 |
|---|---|---|
| 2c | `server/utils/{auth,district-lookup,uml/analyzers}` | 낮음 (인프라 heavy) |
| 3 | `server/services` + `server/repositories` | 중간 (PGlite 패턴 재사용) |
| 4 | `server/api` 50 핸들러 | **높음** — 현재 0%, 가장 큰 미커버 면적. TDD 부적합 핸들러는 service 로 추출 리팩토링 허용 |
| 5 | `app/**` lib/model (composable/store) | 중간 |
| 6 | 임계값 잠금 + CI 게이트 | 마지막 |

기본 권장: **Phase 4** — 가장 큰 leverage. 사용자가 다른 선택 안 하면 Phase 4 진행.

## 3. Phase 4 (server/api) 진행 절차

1. **이슈 생성** — `gh issue create --title "test(server/api): {핸들러 그룹} 커버리지 (Phase 4-N)" --label chore --body "Refs #267"`
2. **브랜치 분기** — `git checkout -b test/server-api-{group}` (master 기준)
3. **Nitro 테스트 패턴 PoC 먼저** — 첫 1개 핸들러로 \`@nuxt/test-utils\` 의 \`setup({ server: true })\` 또는 핸들러 함수 직접 호출 패턴 정립. \`vitest.setup.ts\` 의 h3 stub 활용.
4. **핸들러 그룹별 PR 분리** (한 PR 7~10 파일):
   - `/api/routes/*` (CRUD)
   - `/api/route-info/*`
   - `/api/curations/*`
   - `/api/run-records/*`
   - `/api/segments/*`
   - `/api/user-route/*`
   - `/api/weather/*`
   - `/api/district/*`, `/api/boundary/*`
   - `/api/uml/*`
   - `/api/auth/*`
5. **TDD 부적합 핸들러는 리팩토링** — 사용자 승인됨. 핸들러 내부 인라인 비즈니스 로직 → `server/services/*.service.ts` 로 추출 후 service 단위로 테스트. 기능은 그대로 작동해야 하며 chrome-devtools MCP 로 동작 확인 가능.

## 4. PR 규칙 (coverage_pr_policy.md 적용)

- 한 PR 당 한 Phase (또는 sub-phase) — 섞지 않는다
- PR body 에 `Closes #N` 명시 + `Refs #267`
- gitleaks 라이선스 실패는 무시
- `.claude/settings.local.json` 은 gitignored — 커밋 금지
- squash + delete-branch 로 머지

## 5. 진행 중 매 PR 머지 후

```bash
pnpm test:cov 2>&1 | grep -E "Lines\\s*:"
```

수치를 기록하고, epic #267 의 해당 Phase 체크박스를 `gh issue edit 267 --body` 로 업데이트한다 (또는 코멘트로 진척 보고).

## 6. 종료 조건

- 전체 라인 커버리지 ≥ 75% 도달
- 또는 사용자가 중단 지시
- Phase 6 진행 시 `vitest.config.ts` 의 `thresholds` 를 0 → 실제값으로 변경, CI 게이트는 별도 이슈로 분리

## 즉시 실행

이 명령이 호출되면 **확인 질문 없이 0~1 단계를 바로 실행**하고, 2 단계에서만 사용자에게 Phase 선택 확인을 받는다.
