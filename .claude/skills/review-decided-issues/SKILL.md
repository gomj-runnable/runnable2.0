---
name: review-decided-issues
description: This skill should be used when the user asks to "결정 끝난 이슈 검토", "decided된 이슈 다음 단계로", "결정 이슈 스케줄 한 번 돌려", "review decided issues"해야 할 때. 또는 `/loop 3h /review-decided-issues` 같은 주기 호출에서. `decision` 라벨이 붙은 open 이슈 중 모든 결정 영역에 체크박스가 채워진 이슈를 찾아 `decompose-decision-issue` SKILL을 자동 호출해 다음 단계(추가 결정 분기 또는 구현 착수)로 넘긴다.
---

# Review Decided Issues

`decision` 라벨이 붙은 open 이슈를 스캔해 "결정이 끝난" 이슈를 다음 단계로 진행하는 SKILL. 3시간 주기로 호출되어 토론 → 구현 파이프라인이 자동으로 흘러가도록 만든다.

## 트리거

- 사용자가 "결정 끝난 이슈 검토해줘", "decided된 이슈 다음 단계로" 같이 요청할 때
- 내장 `/loop 3h /review-decided-issues`로 주기 실행될 때

## 입력

- 입력 없음 (레포 고정: `all4land-runnable/runnable2.0`)

## 처리 단계

### 1. 후보 이슈 수집

`mcp__github__list_issues`로 `decision` 라벨이 붙은 open 이슈 목록 조회 (state: `OPEN`).

### 2. 각 이슈 결정 완료 여부 판정

각 이슈마다 본문 + 코멘트를 읽고:

- 본문에 `# N. 항목 ...` 형태의 결정 영역이 있다.
- 모든 영역마다 적어도 하나의 `- [x]` 옵션이 있다.
- 또는 코멘트에 명시적 결정 텍스트가 있다 (체크박스 대신).

**모두 만족하면** → "결정 완료"로 분류.
**하나라도 미충족** → skip (다음 사이클 대기).

### 3. 결정 완료 이슈 처리

각 결정 완료 이슈마다:

1. 사용자에게 짧게 보고: `#XXX "{제목}" 결정 완료 — decompose 진행할까요?`
2. 승인 시 `decompose-decision-issue` SKILL을 해당 이슈 번호로 호출.
3. 그 SKILL이 분기·close·즉시 구현 후보 식별까지 처리.

### 4. 결과 요약

전체 사이클이 끝나면:
- 처리한 이슈 수
- 새로 생성된 [결정 대기] 이슈 수 (다음 사이클 대상)
- 새로 생성된 구현/문서 이슈 수
- 같은 세션에서 구현된 항목 수

### 5. 다음 사이클 예고

`/loop`로 주기 실행 중이면 다음 호출까지 대기. 일회성 호출이면 종료.

## 결정 완료 판정 룰 (상세)

본 SKILL은 다음 패턴을 인식한다:

### 패턴 1 — 표준 template
```
# 1. 제목 (단일선택)
- [x] 옵션 A
- [ ] 옵션 B
```
→ 영역 1 결정됨 (단일선택, A)

```
# 2. 제목 (복수선택)
- [x] 옵션 A
- [x] 옵션 B
```
→ 영역 2 결정됨 (복수선택, A+B)

### 패턴 2 — 영역 중 일부 미결정
```
# 1. (단일선택)  → [x]
# 2. (단일선택)  → 모두 [ ]
```
→ 전체 미완료, skip.

### 패턴 3 — 코멘트 결정
체크박스가 0개여도 코멘트에 "결정: 옵션 A로 진행" 같은 명시적 텍스트가 있고, 작성자가 원본 작성자 또는 MEMBER 권한 이상이면 → 결정으로 인정.

## 안전 규칙

- **자동 close/생성 금지** — 항상 사용자 승인 후 `decompose-decision-issue` 호출.
- **3시간 주기로 실행되더라도** 결정 완료 이슈가 없으면 조용히 종료 (사용자 방해 X).
- **이미 처리 중인 이슈 중복 처리 방지** — 같은 이슈에 이미 "결정 처리 완료" 코멘트가 달려 있으면 skip.
- **하루에 같은 이슈를 두 번 이상 보고하지 않는다** — 사용자가 한 번 거절하면 다음 사이클까지 제외.

## /loop 통합

사용자가 한 번 `/loop 3h /review-decided-issues`를 실행하면 Claude Code가 3시간 주기로 본 SKILL을 호출한다. 

세션이 종료되면 loop도 종료되므로, 장시간 자동화가 필요하면:
- 사용자가 Claude Code 세션을 계속 띄워두거나
- GitHub Actions cron으로 별도 외부 트리거를 만들거나 (별도 SKILL/PR 필요)

지금 단계에서는 `loop` 기반으로 시작.

## 출력

각 호출 결과:

```
## review-decided-issues 사이클 결과 (YYYY-MM-DD HH:mm)

- 스캔한 open decision 이슈: N개
- 결정 완료로 판정된 이슈: M개
- decompose 진행 승인: K개 (사용자 응답 기준)
- 새로 생성된 이슈:
  - [결정 대기] M1개
  - [enhancement|refactor] M2개
  - [docs|policy] M3개
- 즉시 구현 완료: P개 (commit 링크 첨부)

다음 사이클: {다음 시각}
```

## 비-처리 케이스

- `decision` 라벨이 없는 이슈
- closed 이슈
- 이미 "결정 처리 완료" 코멘트가 있는 이슈
- 옵션이 0개 체크된 이슈 (다음 사이클 대기)
