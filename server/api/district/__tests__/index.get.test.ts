import { describe, it, expect } from 'vitest'
import handler from '../index.get'
import { SEOUL_GU_DATA } from '../../../utils/district/seoul-gu-data'
import { SEOUL_DONG_MAP } from '../../../utils/district/seoul-dong-data'

describe('GET /api/district', () => {
    it('서울 구 + 동 데이터를 반환한다', async () => {
        const result = await handler({} as any)
        expect(result.gu).toBe(SEOUL_GU_DATA)
        expect(result.dongMap).toBe(SEOUL_DONG_MAP)
    })

    it('두 번째 호출에서 동일한 객체 참조를 재사용한다 (모듈 캐싱)', async () => {
        const first = await handler({} as any)
        const second = await handler({} as any)
        expect(second).toBe(first)
    })
})
