---
name: create-api-service
description: This skill should be used when the user asks to "외부 API를 연동", "API 서비스를 추가", "외부 데이터 소스를 연결", "API Response 클래스를 정의", "service.requestBy000() 패턴으로 구현"해야 할 때. 원본 Response Class와 추상화된 Local Response를 분리하는 API 서비스 구현 규칙을 정의한다.
---

# Create API Service

외부 API 연동 시 원본 Response Class와 추상화된 Local Response를 분리하는 구현 규칙.

## 핵심 원칙

1. **원본 Response는 class로 명시** — 외부 API가 반환하는 전체 구조를 class로 선언
2. **메서드 네이밍 통일** — `service.requestBy{기준}()` 패턴
3. **반환값 추상화** — 내부 로직은 자유, 반환값은 필요한 정보만 담은 Local Response
4. **두 가지 명세 필수** — 원본 Response Class + 추상화 Local Response (interface 또는 type)

## 구조

```
shared/types/{domain}.ts
├── {Api}OriginalResponse     ← class: 외부 API 원본 응답 전체 구조
└── {Domain}LocalResponse     ← interface: 필요한 필드만 추출한 추상화 응답

server/utils/{domain}/
├── {domain}.service.ts       ← requestBy{기준}() 메서드, 변환 로직 포함
├── {domain}.adapter.ts       ← 외부 호출 + 원본 → 로컬 변환 (선택)
└── common.ts                 ← 공통 유틸 (선택)

server/api/{domain}/
└── [...].get.ts              ← API 엔드포인트, service 호출만 수행
```

## 원본 Response Class

외부 API의 응답 구조를 **class**로 선언한다. 이유:

- API 문서와 1:1 매핑을 보장
- `instanceof` 검증 가능
- 원본 데이터의 전체 형태를 명시적으로 기록

```typescript
// shared/types/{domain}.ts

/** 외부 API 원본 응답 — {API 이름} */
export class {Api}OriginalResponse {
    response?: {
        header?: { resultCode: string; resultMsg: string }
        body?: {
            items?: { item?: {Api}OriginalItem[] }
            totalCount?: number
        }
    }

    constructor(data: unknown) {
        Object.assign(this, data)
    }
}

export class {Api}OriginalItem {
    category!: string
    value!: string
    // ... 외부 API 필드 전부 나열
}
```

## 추상화 Local Response

프로젝트에서 **실제로 사용하는 필드만** 추출한 interface.

```typescript
// shared/types/{domain}.ts

/** 추상화된 로컬 응답 */
export interface {Domain}LocalResponse {
    date: string
    value: number
    label: string
    // ... 필요한 필드만
}
```

## Service 메서드 네이밍

```typescript
// server/utils/{domain}/{domain}.service.ts

class {Domain}Service {
    /** 날짜 기준 조회 */
    async requestByDate(date: string): Promise<{Domain}LocalResponse[]> { ... }

    /** 좌표 기준 조회 */
    async requestByCoord(lat: number, lng: number): Promise<{Domain}LocalResponse> { ... }

    /** ID 기준 조회 */
    async requestById(id: string): Promise<{Domain}LocalResponse | null> { ... }
}
```

| 패턴 | 의미 |
|------|------|
| `requestByDate()` | 날짜 기준 조회 |
| `requestByCoord()` | 좌표 기준 조회 |
| `requestById()` | 식별자 기준 조회 |
| `requestBy{기준}()` | 기준에 따라 자유 확장 |

## 변환 흐름

```
외부 API 호출
  → JSON parse
  → new {Api}OriginalResponse(json)    ← 원본 class 생성
  → transform(original)                ← 필요한 필드만 추출
  → {Domain}LocalResponse              ← 추상화 반환
```

→ 코드: [examples/service.ts](examples/service.ts), [examples/types.ts](examples/types.ts)

## 기존 프로젝트 패턴과의 관계

현재 `server/utils/weather/`의 adapter 패턴과 호환:

| 기존 패턴 | 이 스킬 적용 후 |
|-----------|-----------------|
| `VilageFcstResponse` (interface) | `VilageFcstOriginalResponse` (class) |
| `HourlyWeather` (interface) | 그대로 유지 (Local Response 역할) |
| `fetchForecast()` | `service.requestByDate()` |

기존 코드를 **즉시 전환할 필요 없음**. 새 API 연동부터 이 규칙을 적용한다.

## 새 API 서비스 추가 절차

1. **원본 Response Class 정의** — `shared/types/{domain}.ts`에 외부 API 응답 구조 class 선언
2. **Local Response 정의** — 같은 파일에 필요한 필드만 담은 interface 선언
3. **Service 생성** — `server/utils/{domain}/{domain}.service.ts`에 `requestBy{기준}()` 메서드 구현
4. **Adapter 분리 (선택)** — 외부 호출과 변환이 복잡하면 adapter 파일로 분리
5. **API 엔드포인트 연결** — `server/api/{domain}/`에서 service 호출
6. **프론트엔드 sideeffect 연결** — `composables/sideeffect/`에서 API 호출

## 점검 항목

- 원본 Response가 class로 정의되었는가
- class가 외부 API의 전체 응답 구조를 반영하는가
- Local Response가 필요한 필드만 포함하는가
- Service 메서드가 `requestBy{기준}()` 네이밍을 따르는가
- Service 반환값이 Local Response 타입인가
- 원본 Response와 Local Response가 모두 `shared/types/`에 명세되었는가
- API 내부 로직(에러 처리, 캐싱 등)이 Service/Adapter 안에 캡슐화되었는가
