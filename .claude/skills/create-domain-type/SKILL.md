---
name: create-domain-type
description: This skill should be used when the user asks to "도메인 타입을 추가", "shared 타입을 정의", "Zod 스키마를 만들어", "새 도메인의 타입/스키마/샘플 데이터를 생성", "Base/DraftInput/Saved 계층을 구현"해야 할 때. shared/types + shared/schemas + shared/data 3파일을 동시에 생성하는 규칙을 정의한다.
---

# Create Domain Type

새 도메인의 타입, Zod 스키마, 샘플 데이터를 `shared/` 하위에 일관되게 생성할 때 따르는 규칙.

## 반복 패턴 근거

`shared/` 하위 파일들이 3가지 계층을 1:1 대응으로 유지한다:

| 타입 파일 | 스키마 파일 | 데이터 파일 |
|-----------|------------|------------|
| `shared/types/route.ts` | `shared/schemas/route.schema.ts` | — |
| `shared/types/user.ts` | `shared/schemas/user.schema.ts` | — |
| `shared/types/user-route.ts` | `shared/schemas/user-route.schema.ts` | — |
| `shared/types/category.ts` | `shared/schemas/category.schema.ts` | — |
| `shared/types/facility.ts` | — | `shared/data/sample-facilities.ts` |
| `shared/types/weather.ts` | — | — |

## 핵심 원칙

| 항목 | 규칙 |
|------|------|
| 도메인당 1파일 | `shared/types/{domain}.ts` — 하나의 파일에 해당 도메인의 모든 타입 |
| 열거값 | `type {Domain}Type = 'a' \| 'b' \| 'c'` — union literal 사용 (enum 금지) |
| 타입 계층 | `{Domain}Base` → `{Domain}DraftInput` → `Saved{Domain}` 3단계 |
| 스키마 연결 | `z.ZodType<{Domain}DraftInput>`으로 타입 안전성 보장 |
| 한국어 에러 | Zod 에러 메시지는 한국어로 작성 |
| infer export | `export type Create{Domain}Schema = z.infer<typeof create{Domain}Schema>` |

## 구조

```
shared/types/{domain}.ts             ← 도메인 타입 정의
shared/schemas/{domain}.schema.ts    ← Zod 런타임 검증 스키마
shared/data/sample-{domain}s.ts      ← 개발용 샘플 데이터 (선택)
```

## 타입 스켈레톤 — `shared/types/{domain}.ts`

### 기본 구조 (순수 도메인)

```typescript
// 열거값 — union literal
export type {Domain}Type = 'type-a' | 'type-b' | 'type-c'

// Base — 핵심 도메인 필드
export interface {Domain}Base {
    title: string
    description?: string
    type: {Domain}Type
}

// DraftInput — 생성/수정 입력 (Base와 동일하거나 확장)
export type {Domain}DraftInput = {Domain}Base

// Saved — 서버 저장 후 반환 (Base + 서버 생성 필드)
export interface Saved{Domain} extends {Domain}Base {
    {domain}Id: string
    userId?: string
    createdAt?: string
}
```

### 레퍼런스
- `shared/types/route.ts:35-52` — `RouteBase` → `RouteDraftInput` → `SavedRoute`
- `shared/types/facility.ts:1-33` — `FacilityType` union literal + `Facility` interface

### 하위 엔티티가 있는 경우

```typescript
// 상위 엔티티
export interface {Domain}Base {
    title: string
    sections: {Section}Base[]
}

// 하위 엔티티
export interface {Section}Base {
    seq: number
    name: string
}

export interface Saved{Section} extends {Section}Base {
    {section}Id: string
}
```

### 레퍼런스
- `shared/types/route.ts:54-73` — `RouteSectionBase` → `SavedSection`

### API 연동 타입이 포함된 경우

```typescript
// 도메인 Local Response (프로젝트 내부용)
export interface {Domain}LocalResponse {
    date: string
    value: number
    label: string
}

// 외부 API 원본 Response Class
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
```

### 레퍼런스
- `shared/types/weather.ts:1-88` — `HourlyWeather` + `KmaObservedOriginalResponse`

## 스키마 스켈레톤 — `shared/schemas/{domain}.schema.ts`

```typescript
import { z } from 'zod'
import type { {Domain}DraftInput } from '#shared/types/{domain}'

// 하위 스키마 (있을 경우)
export const {section}Schema = z.object({
    seq: z.number(),
    name: z.string().min(1, '이름을 입력해주세요'),
})

// 생성 스키마 — 타입 연결 필수
export const create{Domain}Schema: z.ZodType<{Domain}DraftInput> = z.object({
    title: z.string().min(1, '제목을 입력해주세요').max(50, '제목은 50자 이내로 입력해주세요'),
    description: z.string().max(200, '설명은 200자 이내로 입력해주세요').optional(),
    type: z.enum(['type-a', 'type-b', 'type-c']),
    sections: z.array({section}Schema).optional(),
})

// infer 타입 export
export type Create{Domain}Schema = z.infer<typeof create{Domain}Schema>
```

### 규칙 요약

| 규칙 | 예시 |
|------|------|
| 파일명 | `{domain}.schema.ts` |
| 스키마명 | `create{Domain}Schema` (camelCase) |
| 타입 연결 | `z.ZodType<{Domain}DraftInput>` |
| 에러 메시지 | 한국어 (`'제목을 입력해주세요'`) |
| infer export | `export type Create{Domain}Schema = z.infer<typeof ...>` |

### 레퍼런스
- `shared/schemas/route.schema.ts:42-51` — `z.ZodType<RouteDraftInput>` 연결
- `shared/schemas/category.schema.ts:1-10` — 최소 단위 스키마

## 샘플 데이터 스켈레톤 — `shared/data/sample-{domain}s.ts`

```typescript
import type { {Domain} } from '#shared/types/{domain}'

export const sample{Domain}s: {Domain}[] = [
    {
        {domain}Id: '{domain}-01',
        type: 'type-a',
        title: '샘플 항목 1',
        description: '개발용 샘플 데이터',
    },
    {
        {domain}Id: '{domain}-02',
        type: 'type-b',
        title: '샘플 항목 2',
    },
]
```

### 레퍼런스
- `shared/data/sample-facilities.ts:1-188` — `Facility[]` 배열

## 새 도메인 타입 추가 절차

1. **도메인 분석** — 열거값, Base 필드, 하위 엔티티 여부 결정
2. **타입 파일 생성** — `shared/types/{domain}.ts` (Base → DraftInput → Saved 계층)
3. **스키마 파일 생성** — `shared/schemas/{domain}.schema.ts` (`z.ZodType<T>` 연결)
4. **샘플 데이터 생성 (선택)** — `shared/data/sample-{domain}s.ts`
5. **API 연동 시** — 같은 타입 파일에 `OriginalResponse` class 추가 (`create-api-service` 스킬 참조)

## 점검 항목

- 열거값이 union literal으로 정의되었는가 (enum 미사용)
- `{Domain}Base` → `{Domain}DraftInput` → `Saved{Domain}` 계층이 유지되는가
- `Saved{Domain}`에 `{domain}Id`, `userId`, `createdAt` 서버 생성 필드가 포함되었는가
- 스키마가 `z.ZodType<{Domain}DraftInput>`으로 타입 연결되었는가
- 에러 메시지가 한국어로 작성되었는가
- `z.infer` 타입이 export 되었는가
- 샘플 데이터가 타입과 일치하는가
- 타입 파일과 스키마 파일의 필드가 동기화되었는가
