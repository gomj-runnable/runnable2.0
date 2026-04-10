// shared/types/example.ts
// ─────────────────────────────────────────────
// 1. 원본 Response Class — 외부 API 응답 전체 구조
// ─────────────────────────────────────────────

/** 외부 API 원본 응답 아이템 */
export class ExampleApiOriginalItem {
    code!: string
    name!: string
    value!: string
    unit!: string
    timestamp!: string
    extra1!: string
    extra2!: string
    // 외부 API의 모든 필드를 빠짐없이 나열
}

/** 외부 API 원본 응답 */
export class ExampleApiOriginalResponse {
    response?: {
        header?: {
            resultCode: string
            resultMsg: string
        }
        body?: {
            items?: {
                item?: ExampleApiOriginalItem[]
            }
            numOfRows?: number
            pageNo?: number
            totalCount?: number
        }
    }

    constructor(data: unknown) {
        Object.assign(this, data)
    }
}

// ─────────────────────────────────────────────
// 2. 추상화 Local Response — 필요한 정보만 추출
// ─────────────────────────────────────────────

/** 프로젝트에서 실제로 사용하는 추상화 응답 */
export interface ExampleLocalResponse {
    name: string
    value: number
    timestamp: string
    // extra1, extra2, unit, code 등은 의도적으로 제외
}
