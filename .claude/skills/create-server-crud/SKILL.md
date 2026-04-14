---
name: create-server-crud
description: This skill should be used when the user asks to "API 엔드포인트를 추가", "CRUD를 구현", "새 도메인 리소스를 추가", "Repository 패턴으로 구현", "서버 API를 만들어"해야 할 때. Nitro API 핸들러 4종(GET/POST/PUT/DELETE) + Repository 인터페이스/InMemory/Drizzle/팩토리 4파일의 스캐폴딩 규칙을 정의한다.
---

# Create Server CRUD

새 도메인 리소스의 API 엔드포인트 + Repository 파일 세트를 생성할 때 따르는 규칙.

## 반복 패턴 근거

`server/api/routes/` 엔드포인트들이 HTTP 메서드별로 일관된 4가지 변형을 따른다:

| 변형 | 파일 | 핵심 구조 |
|------|------|-----------|
| A: 인증 + Zod + 쓰기 | `index.post.ts` | `requireSession` + schema.parse + repository.create |
| B: 소유권 + param + 변경 | `[routeId]/index.delete.ts` | `requireRouteOwnership` + repository.delete |
| C: Query + 필터 + 읽기 | `search.get.ts` | `getQuery` + repository.search |
| D: 외부 프록시 + 캐시 | `boundary/seoul.get.ts` | 모듈 캐시 + fetch + fallback |

Repository는 **인터페이스 + InMemory + Drizzle + 팩토리** 4파일 구조:
- `route.repository.ts` — 인터페이스
- `route.repository.memory.ts` — InMemory 구현체
- `route.repository.drizzle.ts` — Drizzle ORM 구현체
- `index.ts` — 환경 기반 팩토리

## 핵심 원칙

| 항목 | 규칙 |
|------|------|
| 인증 3단계 | `getSessionUser` (선택) → `requireSession` (필수) → `require{Domain}Ownership` (소유권) |
| 입력 검증 | POST/PUT은 Zod 스키마로 `readBody` + `parse` |
| param 추출 | `getRouterParam(event, '{domainId}')` + null 체크 |
| 에러 형식 | `createError({ statusCode, message })` 통일 |
| Repository DI | 인터페이스로 계약, 환경변수로 구현체 전환 |
| 반환값 | 목록: 배열, 단건: 객체, 삭제: `{ success: true }` |

## 구조

```
server/api/{domain}/
├── index.get.ts                    ← 목록 조회
├── index.post.ts                   ← 생성 (인증 + Zod)
├── [{domainId}]/
│   ├── index.get.ts                ← 상세 조회
│   ├── index.put.ts                ← 수정 (소유권 + Zod)
│   └── index.delete.ts             ← 삭제 (소유권)

server/repositories/
├── {domain}.repository.ts          ← I{Domain}Repository 인터페이스
├── {domain}.repository.memory.ts   ← InMemory 구현체
├── {domain}.repository.drizzle.ts  ← Drizzle ORM 구현체
└── index.ts                        ← 팩토리 (환경 분기)
```

## API 엔드포인트 스켈레톤

### GET 목록 — `index.get.ts`

```typescript
import { {domain}Repository } from '~/repositories'
import { getSessionUser } from '~/utils/session'

export default defineEventHandler(async (event) => {
    const user = await getSessionUser(event)
    if (user) {
        return {domain}Repository.listByUser(user.userId)
    }
    return {domain}Repository.list()
})
```

### POST 생성 — `index.post.ts`

```typescript
import { {domain}Repository } from '~/repositories'
import { requireSession } from '~/utils/session'
import { create{Domain}Schema } from '#shared/schemas/{domain}.schema'

export default defineEventHandler(async (event) => {
    const user = await requireSession(event)
    const body = await readBody(event)
    const input = create{Domain}Schema.parse(body)
    return {domain}Repository.create(input, user.userId)
})
```

### PUT 수정 — `[{domainId}]/index.put.ts`

```typescript
import { {domain}Repository } from '~/repositories'
import { require{Domain}Ownership } from '~/utils/session'
import { update{Domain}Schema } from '#shared/schemas/{domain}.schema'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, '{domainId}')
    if (!id) throw createError({ statusCode: 400, message: '{domainId} is required' })
    await require{Domain}Ownership(event, id)

    const body = await readBody(event)
    const input = update{Domain}Schema.parse(body)
    const result = await {domain}Repository.update(id, input)
    if (!result) throw createError({ statusCode: 404, message: '{Domain} not found' })
    return result
})
```

### DELETE 삭제 — `[{domainId}]/index.delete.ts`

```typescript
import { {domain}Repository } from '~/repositories'
import { require{Domain}Ownership } from '~/utils/session'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, '{domainId}')
    if (!id) throw createError({ statusCode: 400, message: '{domainId} is required' })
    await require{Domain}Ownership(event, id)
    await {domain}Repository.delete(id)
    return { success: true }
})
```

## Repository 스켈레톤

### 인터페이스 — `{domain}.repository.ts`

```typescript
import type { {Domain}DraftInput, Saved{Domain} } from '#shared/types/{domain}'

export interface I{Domain}Repository {
    create(input: {Domain}DraftInput, userId: string): Promise<Saved{Domain}>
    get(id: string): Promise<Saved{Domain} | null>
    list(): Promise<Saved{Domain}[]>
    listByUser(userId: string): Promise<Saved{Domain}[]>
    update(id: string, input: Partial<{Domain}DraftInput>): Promise<Saved{Domain} | null>
    delete(id: string): Promise<boolean>
}
```

### InMemory 구현체 — `{domain}.repository.memory.ts`

```typescript
import type { I{Domain}Repository } from './{domain}.repository'
import type { {Domain}DraftInput, Saved{Domain} } from '#shared/types/{domain}'

class InMemory{Domain}Repository implements I{Domain}Repository {
    private readonly store = new Map<string, Saved{Domain}>()

    async create(input: {Domain}DraftInput, userId: string): Promise<Saved{Domain}> {
        const id = crypto.randomUUID()
        const saved: Saved{Domain} = {
            {domain}Id: id,
            ...input,
            userId,
            createdAt: new Date().toISOString(),
        }
        this.store.set(id, saved)
        return saved
    }

    async get(id: string) { return this.store.get(id) ?? null }
    async list() { return [...this.store.values()] }
    async listByUser(userId: string) {
        return [...this.store.values()].filter(item => item.userId === userId)
    }
    async update(id: string, input: Partial<{Domain}DraftInput>) {
        const existing = this.store.get(id)
        if (!existing) return null
        const updated = { ...existing, ...input }
        this.store.set(id, updated)
        return updated
    }
    async delete(id: string) { return this.store.delete(id) }
}

export const {domain}Repository = new InMemory{Domain}Repository()
```

### 팩토리 — `index.ts` (기존 파일에 추가)

```typescript
import type { I{Domain}Repository } from './{domain}.repository'

export const {domain}Repository: I{Domain}Repository =
    process.env.USE_DATABASE_MODE === 'MEMORY'
        ? require('./{domain}.repository.memory').{domain}Repository
        : require('./{domain}.repository.drizzle').{domain}Repository
```

## 인증 레벨 선택 기준

| 레벨 | 함수 | 사용 시점 |
|------|------|-----------|
| 공개 | `getSessionUser` (nullable) | 목록 조회 (로그인 시 추가 필터) |
| 로그인 필수 | `requireSession` | 생성, 본인 데이터 조회 |
| 소유권 필수 | `require{Domain}Ownership` | 수정, 삭제 |

## 새 CRUD 추가 절차

1. **타입/스키마 준비** — `shared/types/{domain}.ts` + `shared/schemas/{domain}.schema.ts` (`create-domain-type` 스킬 사용)
2. **Repository 인터페이스 정의** — `server/repositories/{domain}.repository.ts`
3. **InMemory 구현체 작성** — `server/repositories/{domain}.repository.memory.ts`
4. **팩토리 등록** — `server/repositories/index.ts`에 export 추가
5. **API 엔드포인트 생성** — `server/api/{domain}/` 하위 CRUD 파일
6. **소유권 검증 추가** — `server/utils/session.ts`에 `require{Domain}Ownership` 추가
7. **(선택) Drizzle 구현체** — DB 스키마 + `{domain}.repository.drizzle.ts`

## 점검 항목

- POST/PUT에 Zod 스키마 검증이 적용되었는가
- DELETE/PUT에 소유권 검증(`require{Domain}Ownership`)이 적용되었는가
- `getRouterParam` 후 null 체크가 있는가
- Repository 인터페이스와 구현체의 메서드 시그니처가 일치하는가
- 팩토리(`index.ts`)에 새 repository가 등록되었는가
- 에러 응답이 `createError({ statusCode, message })` 형식을 따르는가
- InMemory 구현체에서 `crypto.randomUUID()`로 ID를 생성하는가
