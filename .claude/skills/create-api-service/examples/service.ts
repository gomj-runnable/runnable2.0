// server/utils/example/example.service.ts
import { ExampleApiOriginalResponse, type ExampleLocalResponse } from '#shared/types/example'

const API_BASE = 'https://api.example.com/v1'

class ExampleService {
    private apiKey: string

    constructor() {
        this.apiKey = process.env.EXAMPLE_API_KEY ?? ''
    }

    /** 날짜 기준 조회 */
    async requestByDate(date: string): Promise<ExampleLocalResponse[]> {
        const url = `${API_BASE}/data?date=${date}&key=${this.apiKey}`
        const res = await fetch(url)
        const json = await res.json()

        // 원본 Response class 생성
        const original = new ExampleApiOriginalResponse(json)

        // 추상화 변환
        return this.toLocal(original)
    }

    /** ID 기준 조회 */
    async requestById(id: string): Promise<ExampleLocalResponse | null> {
        const url = `${API_BASE}/data/${id}?key=${this.apiKey}`
        const res = await fetch(url)

        if (!res.ok) return null

        const json = await res.json()
        const original = new ExampleApiOriginalResponse(json)
        const results = this.toLocal(original)

        return results[0] ?? null
    }

    // ─────────────────────────────────────
    // 내부 변환 로직 (자유롭게 구현)
    // ─────────────────────────────────────

    private toLocal(original: ExampleApiOriginalResponse): ExampleLocalResponse[] {
        const items = original.response?.body?.items?.item ?? []

        return items.map((item) => ({
            name: item.name,
            value: Number(item.value),
            timestamp: item.timestamp,
        }))
    }
}

/** 싱글턴 export */
export const exampleService = new ExampleService()
