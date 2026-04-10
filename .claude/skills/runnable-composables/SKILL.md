---
name: runnable-composables
description: This skill should be used when the user asks to "composable 구조를 정리", "action/sideeffect/store 규칙에 맞게 분리", "상태와 부수 효과를 분리", "app/composables 설계를 문서화 또는 리팩터링"해야 할 때. 로직의 책임 분리와 구현 위임 기준을 명확히 한다.
---

# Runnable Composables

> 패키지 역할·분리 원칙은 `CLAUDE.md`를 기준으로 한다. 이 스킬은 **판단이 모호할 때의 추가 기준**만 둔다.

## 빠른 판단표

| 코드 성격 | 위치 | 예시 |
|-----------|------|------|
| 순수 계산·변환·평탄화 | `action/` | 트리 탐색, 좌표 변환, GPX 생성 |
| fetch·SDK 로드·DOM·timer | `sideeffect/` | Cesium 초기화, API 호출, 파일 다운로드 |
| 선택/로딩/derived state | `store/` | `useState` 기반 공유 상태 |
| 계약 유지 + 구현 분리 | `*Impl` | 추상 함수의 구현체 |

## 경계 규칙

- `action`은 외부 환경(API·DOM·전역 상태)에 직접 의존하지 않는다
- `sideeffect`는 상태의 최종 소유자가 되지 않는다 — `store`에 위임하거나 결과를 반환
- `store`는 네트워크 세부 구현을 품지 않는다
- 하나의 composable이 세 역할을 동시에 수행하면 먼저 분리를 검토한다
- 페이지·컴포넌트는 composable 조합만 수행, `window`·외부 API 세부 구현을 직접 품지 않는다

## 추상화·구현 위임

- 추상 클래스/함수의 구현체는 `*Impl`로 분리한다
- 파라미터·반환값은 계약 — 변경 시 사용자 승인 필요
- `TODO:` 또는 `TODO 0.`은 구현 대상, 그 외 표기(`TODO`, `TODO-`)는 대상 아님

## 적용 순서

1. 유틸 / 부수 효과 / 상태 중 무엇인지 판별
2. 외부 통신 + 상태 변경이 섞여 있으면 `sideeffect` + `store`로 분리
3. 중복 계산은 `action`으로 추출
4. 추상 계약이 보이면 `*Impl` 분리

## 점검 항목

- 외부 API 호출이 `action`이나 페이지에 남아 있지 않은가
- 상태 초기화·갱신이 `store`에서 한눈에 보이는가
- 계산 로직이 `sideeffect`·`store`에 불필요하게 섞여 있지 않은가
- 지도 엔진·DOM 접근이 페이지에 직접 남아 있지 않은가
