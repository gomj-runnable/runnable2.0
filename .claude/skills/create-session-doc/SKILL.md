---
name: create-session-doc
description: This skill should be used when the user asks to "세션 문서를 만들어", "작업 내용을 정리해", "오늘 작업을 문서화해", "session doc을 작성해"해야 할 때. 현재 세션에서 수행한 작업을 public/docs/session/ 에 날짜별 markdown으로 기록한다.
---

# Create Session Document

현재 세션에서 수행한 작업을 `public/docs/session/` 하위에 날짜 기반 markdown으로 기록하는 규칙.

## 파일 위치

`public/docs/session/{YYYY-MM-DD}-{slug}.md`

- `YYYY-MM-DD`: 작업 날짜
- `slug`: 작업 내용을 영문 kebab-case로 요약 (예: `easy-issues-batch-2`, `gradient-ui-fix`)

## 문서 구조

```markdown
# {YYYY-MM-DD} {작업 제목 (한글)}

## 개요

{1-2줄로 이번 세션의 목표와 결과 요약}

## {카테고리 N}. {작업 그룹 제목}

| {컬럼 헤더} |
|-------------|
| {행 데이터}  |

## 변경 요약

- **닫은 이슈:** N건 (#번호 나열)
- **수정 파일:** N파일
- **변경량:** +N -N lines
```

## 작성 규칙

1. **제목**: `# {날짜} {한글 작업명}` — 날짜를 제목에 포함
2. **개요**: 무엇을 왜 했는지 1-2줄
3. **카테고리 분류**: 작업 유형별로 섹션을 나눈다
   - 이슈 닫기 (이미 완료 / stale)
   - 코드 수정 (이슈번호 + 제목)
   - 리팩터링
   - 신규 기능
4. **테이블 필수**: 각 카테고리는 `| Issue | 파일 | 수정 내용 |` 형태의 테이블로 정리
5. **변경 요약**: 문서 마지막에 닫은 이슈 수, 수정 파일 수, 변경량(+/-) 명시
6. **참고 패턴/커밋**: 기존 코드를 참고했거나 관련 커밋이 있으면 해시와 함께 기록

## 정보 수집 방법

세션 문서 작성 시 아래 순서로 정보를 수집한다:

1. `git diff --stat HEAD` — 변경된 파일과 변경량 확인
2. `git log --oneline -5` — 이번 세션의 커밋 확인
3. `gh issue list --state closed --since {today}` — 오늘 닫은 이슈 확인
4. 대화 맥락에서 수행한 작업 목록 정리

## 예시

기존 문서 참고: `public/docs/session/2026-04-19-easy-issues-batch-fix.md`