---
name: create-unified-api-response
description: This skill should be used when the user asks to "여러 API 응답을 통합", "다중 API 소스를 하나로 합쳐", "공통 Response를 만들어", "서로 다른 API의 결과를 같은 인터페이스로 처리"해야 할 때. 한 기능에서 2개 이상 외부 API를 사용할 때 공통 Local Response를 정의하고, 호출부 외의 모든 로직이 동일한 함수를 쓰도록 강제하는 규칙을 정의한다.
---

# Create Unified API Response

한 기능에서 2개 이상의 서로 다른 외부 API를 사용할 때, 공통 Local Response를 정의하여 **호출부(`service.requestBy000()`)를 제외한 모든 후속 로직이 같은 함수를 사용**하도록 통일하는 규칙.

## 핵심 원칙

1. **각 API마다 원본 Response Class** — `create-api-service` 스킬 규칙 적용
2. **공통 Local Response 하나** — 모든 API 결과가 변환되는 단일 인터페이스
3. **호출부만 분기, 나머지는 통일** — `service.requestByX()` 반환 이후의 코드는 API 출처를 모른다

## 구조

```
shared/types/{domain}.ts
├── {ApiA}OriginalResponse       ← class: API-A 원본
├── {ApiB}OriginalResponse       ← class: API-B 원본
└── {Domain}LocalResponse        ← interface: 공통 추상화 응답 (하나만)

server/utils/{domain}/
├── {domain}.service.ts          ← 오케스트레이터: 여러 adapter 호출 + merge
├── {sourceA}.adapter.ts         ← API-A 호출 + 원본 → 공통 변환
├── {sourceB}.adapter.ts         ← API-B 호출 + 원본 → 공통 변환
├── merge.service.ts             ← 공통 Local Response 병합/우선순위 (선택)
└── common.ts                    ← 공통 유틸

server/api/{domain}/
└── [...].get.ts                 ← 엔드포인트, service만 호출

app/composables/
├── sideeffect/use{Domain}Sideeffect.ts  ← API 호출
├── store/use{Domain}Store.ts            ← 공통 Local Response 상태 관리
└── action/use{Domain}Transform.ts       ← 공통 Local Response 변환 (선택)
```

## 분기 경계: 호출부만

- `service.requestByX()` 반환 이후의 코드는 API 출처를 모른다
- adapter별 호출부만 분기하고, 이후 merge·filter·display는 공통 함수로 통일
- API별 전용 함수가 adapter 외부에 존재하면 위반

→ ✅/❌ 패턴 예시: [examples/template-patterns.md](examples/template-patterns.md#분기-경계-호출부만)

## 공통 Local Response 설계

- `shared/types/{domain}.ts`에 단일 interface로 정의
- `source` 필드를 **필수**로 포함 — 병합 우선순위 판단 + 디버깅 출처 추적용
- `{Domain}Source` 타입으로 출처를 열거한다

→ 코드 템플릿: [examples/template-patterns.md](examples/template-patterns.md#공통-local-response)

## Adapter 패턴

- 각 adapter는 **자신의 API 호출 + 공통 Local Response 변환**만 책임진다
- 반환 타입은 반드시 공통 Local Response

→ 코드 템플릿: [examples/template-patterns.md](examples/template-patterns.md#adapter)

## Merge 패턴

- 소스별 우선순위를 명시적으로 정의
- 동일 키 데이터가 여러 소스에 있으면 우선순위가 높은 것을 채택

→ 코드 템플릿: [examples/template-patterns.md](examples/template-patterns.md#merge)

## Service 오케스트레이터

- 여러 adapter를 `Promise.all`로 병렬 호출
- 개별 실패 시 `.catch(() => [])` 로 graceful fallback
- merge 함수로 통합 후 반환

→ 코드 템플릿: [examples/template-patterns.md](examples/template-patterns.md#service-오케스트레이터)

## 예시 참조

| 예시 | 설명 |
|------|------|
| [examples/weather-usage.md](examples/weather-usage.md) | 실제 프로젝트 사례 — Weather 3개 API 통합 |
| [examples/template-patterns.md](examples/template-patterns.md) | 템플릿 코드 패턴 (`{Domain}` 플레이스홀더) |
| [examples/unified.ts](examples/unified.ts) | 가상 Air 도메인 전체 코드 예제 |

## 새 통합 API 추가 절차

1. **공통 Local Response 정의** — `shared/types/{domain}.ts`에 단일 interface + source 타입
2. **각 API 원본 Response Class** — `create-api-service` 스킬 규칙 적용
3. **Adapter 생성** — API별 `{source}.adapter.ts`, 반환은 공통 Local Response
4. **Merge 서비스 생성** — `merge.service.ts`에 우선순위 기반 병합
5. **오케스트레이터 생성** — `{domain}.service.ts`에서 adapter 병렬 호출 + merge
6. **후속 로직 작성** — 공통 Local Response만 사용하는 함수로 통일

## 점검 항목

- 공통 Local Response가 **하나의 interface**로 정의되었는가
- `source` 필드가 포함되어 있는가
- 각 adapter의 반환값이 공통 Local Response 타입인가
- `service.requestBy000()` 호출부 이후의 코드가 API 출처에 의존하지 않는가
- API별 전용 함수가 adapter 내부에만 존재하는가
- 개별 API 실패 시 다른 API로 계속 동작하는가 (graceful fallback)
- 병합 우선순위가 명시적으로 정의되었는가

## 관련 스킬

- `create-api-service` — 단일 API의 원본 Response Class + Local Response 분리 규칙
