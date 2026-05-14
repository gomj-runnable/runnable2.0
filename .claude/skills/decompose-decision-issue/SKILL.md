---
name: decompose-decision-issue
description: This skill should be used when the user asks to "결정 이슈 처리해줘", "decision 이슈 분기해줘", "체크박스 결정된 이슈를 하위 이슈로 나눠", "#XXX 결정 사항 구현 이슈로 분기", "이 discuss 처리해줘"해야 할 때. `decision` 라벨이 붙은 "결정 대기" 이슈에서 사용자가 체크한 옵션을 파싱해 (1) 추가 결정이 필요한 영역은 새 [결정 대기] template 이슈로, (2) 결정이 최종 확정된 영역은 구현/문서/외부 이슈로 분기한 뒤 원본을 close한다. 즉시 구현 가능한 sub-issue는 같은 세션에서 바로 구현 착수한다.
---

# Decompose Decision Issue

`decision` 라벨이 붙은 "결정 대기" 이슈에서 사용자가 체크한 옵션을 파싱해 결정 영역별로 분기하고, 원본은 close하는 워크플로우.

## 핵심 원칙

**Claude가 임의로 결정하지 않는다.** 추가 판단이 필요한 항목은 **새 [결정 대기] template 이슈**로 만들어 사용자에게 토론·결정을 맡긴다. 그 토론은 3시간 주기 `review-decided-issues` 스케줄(SKILL)이 픽업해 다음 단계로 이어진다.

## 트리거

사용자가 다음과 같이 요청할 때:
- "#XXX 이슈 결정 처리해줘"
- "decision 이슈 분기해줘"
- "이 discuss 결정 끝났으니 다음으로 넘겨"
- "체크박스 결정된 이슈를 하위 이슈로 나눠"

## 입력

- 대상 이슈 번호 (필수, 단일 — 한 번에 한 이슈만)
- 레포지토리: `all4land-runnable/runnable2.0`

## 처리 단계

### 1. 대상 이슈 읽기 및 검증

`mcp__github__issue_read` (method: `get`, `get_comments`)로 본문·라벨·상태·코멘트를 가져온다.

검증:
- 라벨에 `decision` 또는 `needs-review`가 있어야 함 — 없으면 사용자에게 확인.
- 이미 `CLOSED`면 작업 중단.
- 본문이 결정 템플릿(`# N. 항목 ...` + 체크박스) 패턴이거나, 코멘트에 명시적 결정 텍스트가 있어야 함 — 둘 다 없으면 사용자에게 보고 후 종료.

### 2. 결정 항목 파싱

본문 구조:
- `# N. 항목 제목 (단일선택 | 복수선택)` 헤더 단위로 영역 분리.
- 각 영역 내 `- [x] **옵션명** — 설명` 패턴에서 선택된 옵션 추출.
- 영역별 결정 결과: `{ section: 제목, options: [선택된 옵션들], description: 영역 설명, mode: '단일선택' | '복수선택' }`.
- 코멘트에 결정이 있으면 영역으로 흡수.

### 3. 분기 정책 분류

각 영역을 다음 중 하나로 분류:

| 분류 | 조건 | 처리 |
|------|------|------|
| **needs-sub-decision** | 결정은 됐지만 다음 단계가 또 결정 필요 (매핑·전략·우선순위 등 추가 분기점 존재) | **새 [결정 대기] template 이슈** 생성 |
| **code** | 결정이 단일·명확하고 코드 구현만 남음 | enhancement|refactor 이슈 생성, 즉시 구현 후보 |
| **policy** | 약관·가격·정책 (코드 변경 없음) | docs|policy 이슈 |
| **external** | 라이선스·결제 PG·영업 등 외부 액션 필요 | enhancement + blocked 이슈 |
| **roadmap** | 우선순위 결정·시리즈 구성 (메타 결정) | epic 이슈, 하위 sub-issue 별도 분기 |
| **skip** | 체크된 옵션 0개 | 하위 이슈 생성 안 함, 원본에 보류 사유 코멘트 |

**기준**: 코드를 작성하려는 순간 또 다른 결정 분기가 보이면 `needs-sub-decision`. 분기 없이 바로 패턴대로 작성 가능하면 `code`.

### 4. 하위 이슈 생성

#### 4a. needs-sub-decision (사용자에게 다시 토론 맡김)

`.github/ISSUE_TEMPLATE/decision.md` 형식의 본문으로 `mcp__github__issue_write` (method: `create`)로 생성. 라벨: `decision`.

```
제목: [결정 대기] {영역 한 줄 요약} (#원본 분기)

본문:
> 본 이슈는 #{원본} 결정의 후속 토론용. 옵션을 골라주시면 3시간 주기 검토 스케줄(`review-decided-issues`)에서 다음 단계로 진행합니다.

## 컨텍스트
원본: #{parent} — {원본 제목}
상위 결정: {원본에서 선택된 옵션}

추가로 결정해야 할 사항을 옵션으로 정리:

---

# 1. {세부 결정 항목 1} (단일선택 | 복수선택)

> {배경·트레이드오프 1~2줄}

- [ ] **옵션 A** — {효과/근거}
- [ ] **옵션 B** — {효과/근거}
- [ ] **옵션 C** — {효과/근거}

---

# 2. {세부 결정 항목 2} (단일선택)

...

---

## Refs
- 원본: #{parent}
```

옵션은 Claude가 후보를 적어두고, 최종 선택은 사용자가 함.

#### 4b. code / policy / external / roadmap (구현/문서/외부)

```
제목: [{타입}] {영역 한 줄 요약} (#원본 분기)

본문:
## 컨텍스트
원본: #{parent} — {원본 제목}
영역: "{영역 헤더}"

## 결정 사항
- 선택: **{옵션명}** — {옵션 설명}
{복수선택이면 다중 라인}

## 작업 범위
{타입별 추정}
- code → 변경 범위·파일·체크리스트
- policy → 문서 작성 항목
- external → 사람이 해야 할 액션
- roadmap → 추가 분기할 sub-issue 목록

## Refs
- 원본: #{parent}
```

라벨 매핑:
- `code` → `enhancement` 또는 `refactor`
- `policy` → `docs` 또는 `policy`
- `external` → `enhancement` + `blocked`
- `roadmap` → `epic`

### 5. 원본 이슈 정리

순서:
1. `mcp__github__add_issue_comment`로 분기 요약 코멘트 추가
   ```
   ## 결정 처리 완료

   본 이슈의 결정사항을 다음 하위 이슈로 분기:
   - [결정 대기 →] #{N1} {제목 1}
   - [구현 →] #{N2} {제목 2}
   - ...

   추가 결정이 필요한 항목은 [결정 대기] 라벨로 분기됨 — 옵션 체크 후 3시간 주기 `review-decided-issues` 스케줄에서 다음 단계로 진행됩니다.

   원본은 close 처리.
   ```
2. **사용자에게 확인** (close는 되돌리기 어려움) — `AskUserQuestion`으로 close 여부 묻기.
3. 승인 시 `mcp__github__issue_write` (method: `update`, state: `closed`, state_reason: `completed`)로 close.

### 6. 즉시 구현 가능한 sub-issue 식별 및 착수

"즉시 구현 가능"의 기준 (모두 충족):
- 분류가 `code`
- 변경 범위가 단일 파일 또는 명확한 모듈
- 외부 의존 없음
- 결정된 옵션이 단일 — 분기점 없음
- 기존 코드 패턴 그대로 따라 구현 가능

해당 항목이 있으면:
1. 사용자에게 "이 항목은 즉시 구현 가능합니다. 진행할까요?" 확인.
2. 승인 시 현재 작업 브랜치(`claude/fix-reported-issue-XXX`)에서 작업 → commit → push.
3. sub-issue에 commit 링크 코멘트.

## 안전 규칙

- **한 번에 한 이슈만 처리** (배치 X).
- **close 전 반드시 확인**.
- **하위 이슈 생성 전 미리보기** — 5개 이상 분기되면 사용자에게 분기 목록 보여주고 승인.
- **즉시 구현은 별도 동의** — 분기까지만 자동.
- **임의 결정 금지** — 분기점이 또 있으면 반드시 `needs-sub-decision`으로 새 [결정 대기] 이슈 생성.

## 비-처리 케이스

- `decision` 라벨이 없는 일반 이슈
- 체크된 옵션이 0개인 이슈 → 원본에 "결정 필요" 코멘트
- 파싱 실패 → 사용자에게 보고 후 종료
- 이미 closed인 이슈

## 후속 워크플로우

본 SKILL이 만든 새 [결정 대기] 이슈는 `review-decided-issues` SKILL이 3시간 주기로 픽업한다:
- 모든 체크박스가 적어도 하나 [x]가 되어 있으면 → 본 SKILL을 다시 호출해 분기.
- 미결정 상태면 → skip.

사용자는 `/loop 3h /review-decided-issues`로 스케줄을 시작한다.

## 예시

**입력**: `#119 Playwright 스냅샷 대상 명확화`

1. 파싱: 코멘트로 "기획/프론트/백/라이브러리 4분류" 결정.
2. 분류:
   - "탭 4분류 + 내부 세분화" → `needs-sub-decision` (정확한 매핑·세분화 단위·마이그레이션 전략이 또 결정 필요)
   - "Playwright 스냅샷 대상 재정의" → `code` (단 #109 차단)
3. 분기:
   - [결정 대기] DomainTab 4분류 매핑·세분화·마이그 전략 (#119)
   - [enhancement, blocked] Playwright 스냅샷 대상 재정의 (#109 차단) (#119)
4. 원본 #119에 코멘트 + 사용자 승인 → close.
5. 즉시 구현 가능 항목 없음 (둘 다 추가 결정/차단).
