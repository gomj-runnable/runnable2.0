---
name: runnable-components
description: This skill should be used when the user asks to "컴포넌트 구조를 정리", "UI 컴포넌트를 추가", "Toss 디자인 시스템 원칙에 맞게 구현", "molecules/templates 계층을 설계", "사이드바/지도 shell 컴포넌트를 수정"해야 할 때. 실제 컴포넌트 경로와 CSS 자산 경계를 함께 정리한다.
---

# Runnable Components

> CSS 토큰 계층·composable 분리·패키지 구조는 `CLAUDE.md`를 기준으로 한다. 이 스킬은 **컴포넌트 설계와 CSS 경계 규칙**만 둔다.

## Toss Flat + Compound 원칙

| 방식 | 사용 시점 | 패턴 |
|------|-----------|------|
| **Flat** | 단순 사용 | props만으로 기본 동작 |
| **Compound** | 커스텀 필요 | slot + sub-component 조합 |

Flat API 내부에서 Compound(molecule)를 렌더한다. 확장 지점(slot)은 설계 시 미리 명시한다.

## 계층 구조

| 계층 | 위치 | 역할 |
|------|------|------|
| atoms | `app/components/<page>/atoms/` | 최소 입력 단위 (Textfield 등), 제한적 사용 |
| molecules | `app/components/<page>/molecules/` | 재사용 최소 UI. props 입력, slot 내용 교체, emit 인터랙션 전달. 외부 상태·composable 의존 금지 |
| templates | `app/components/<page>/templates/` | molecules를 slot으로 조합하는 레이아웃. 내용 직접 렌더링 금지, 최소 props만 허용 |

## Shell 슬롯 구조

```
MapShell: #sidebar · #default(Viewer) · #overlay(부유 UI)
MapSidebar: #header(로고+제어) · #subheader(탭) · #default(스크롤 영역) · #footer(프로필)
```

## 사이드바 검색 패널 규칙

- 검색창은 `#default` 영역 상단에 배치 (헤더는 브랜드+전역 제어만)
- 액션 항목은 배열 데이터 + `v-for`로 선언적 렌더링
- 축소 상태에서도 액션 유지 — 슬롯 자체를 숨기지 말고 하위 UI가 `collapsed`에 반응

## CSS 자산 경계

| 역할 | 위치 |
|------|------|
| raw token | `primitive.css` |
| semantic token | `semantic.css` |
| 전역 엔트리 + 지도 DOM | `base/main.css` |
| 공용 골격 (버튼·카드·입력) | `components/common.css` |
| 컴포넌트 CSS | `components/templates/**` · `molecules/**` · `organization/**` |
| 페이지 CSS | `pages/*.css` |

## 컴포넌트 설계 원칙

- **slot 우선** — 내용은 slot, 데이터는 props, 인터랙션은 emit
- **semantic token 우선** — 색상·글꼴·크기 하드코딩 금지, semantic 없으면 추가 먼저 검토
- **외부 CSS 분리** — `.vue` 안에 style 정의 금지, `<style scoped src="...">`만 사용
- **상태 클래스** — `.is-active`, `.is-collapsed` 등 의미 중심 이름 사용
- **공용 골격 통합** — 반복 UI는 `common.css` 블록으로, 개별 CSS는 modifier/변수 override만

## 새 컴포넌트 추가 절차

1. 페이지 결정 → 2. molecule/template 판단 → 3. Flat/Compound 결정 → 4. props→slot→emit 설계 → 5. 외부 CSS 작성 + `style src` 연결 → 6. semantic token 참조 → 7. 페이지에서 template 조합

## 점검 항목

- molecule이 composable·전역 상태에 의존하지 않는가
- template이 slot으로 위임하는가
- CSS가 semantic token을 우선 참조하는가
- 중복 UI 골격이 `common.css`로 통합 가능한가
- `.vue` 안에 style 정의가 남아 있지 않은가
