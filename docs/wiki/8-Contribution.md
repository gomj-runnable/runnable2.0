# 8. Contribution

## 8.1 PR Workflow — One Issue Per Branch · PR-Only Close

`CLAUDE.md` 5번 규칙: **머지 누락 사고 방지**.

- 브랜치/세션은 **이슈 1개** 만 다룬다 (또는 명시적 epic)
- 여러 이슈를 한 브랜치에 누적하지 않는다 — 충돌 머지 시 한 이슈의 변경 파일이 통째로 누락돼도 사람이 추적 못 함
- 별도 이슈 발견 시 새 브랜치를 파거나 사용자에게 분리를 제안한다

**이슈는 PR 머지로만 close** 합니다 (수동 close 금지).

- PR 본문에 `Closes #N` 반드시 명시 — 머지 시 자동 close
- "구현 완료" 코멘트 후 수동 close 흐름 금지 — _이슈 closed = master 에 코드 반영됨_ 을 보장해야 함

**PR 머지 후 셀프 검증**:

- 이슈 본문/코멘트에 명시된 변경 파일 목록이 PR diff 에 실제 있는지 grep 확인
- 없으면 머지 충돌 해결 시 누락된 것 — 즉시 후속 PR 로 보완

## 8.2 코드 가이드라인 (CLAUDE.md)

| 원칙                      | 핵심                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| **Think Before Coding**   | 가정·모호함은 명시적으로 표면화. 다중 해석이면 옵션 제시 후 사용자 결정 |
| **Simplicity First**      | 요청한 만큼만. 추측성 추상화·옵션 X                                     |
| **Surgical Changes**      | 무관 코드는 손대지 않음. 스타일도 유지                                  |
| **Goal-Driven Execution** | "validation 추가" → "테스트 작성 후 통과" 로 번역                       |

## 8.3 커밋 메시지 컨벤션

최근 커밋 예시 (master):

```
feat(route-compare): 경로 비교 지표 계산 서비스 추가 (#189)
feat(safety): 안전 점수 Z-score 정규화 엔진 구현 (#195)
fix(admin): /admin 카드 NuxtLink 동적 컴포넌트 네비게이션 깨짐 수정
fix(config): BETTER_AUTH_TRUSTED_ORIGINS에 localhost:3333 추가
fix(auth): seed upsert 시 accountId 미갱신 버그 수정 + 계정/admin 카드 모듈화
```

형식:

```
<type>(<scope>): <한국어 요약> (#이슈번호)
```

| Type       | 사용 시점                |
| ---------- | ------------------------ |
| `feat`     | 새 기능                  |
| `fix`      | 버그 수정                |
| `refactor` | 동작 변경 없는 구조 개선 |
| `docs`     | 문서만                   |
| `test`     | 테스트만                 |
| `chore`    | 빌드·툴링                |

## 8.4 결정 이슈 워크플로우

- `decision` 라벨 — "결정 대기" 이슈
- 사용자가 옵션을 체크박스로 선택
- 모든 결정이 채워지면 **sub-issue 분기** + 즉시 구현 가능한 건 같은 세션에서 착수
- 관련 스킬 — `decompose-decision-issue`, `review-decided-issues`

## 8.5 테스트 / 게이트

- [6-1-TDD-Concepts](6-1-TDD-Concepts) — TDD 개념과 규칙
- [6-4-CI-Gate](6-4-CI-Gate) — PR 전 로컬 게이트
- 로컬 게이트 흉내: `pnpm lint --fix && pnpm typecheck && pnpm test && pnpm build`
