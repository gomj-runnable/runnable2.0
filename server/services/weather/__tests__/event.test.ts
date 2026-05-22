import { describe, it, expect, vi } from 'vitest'
import { parseSources, resolveWeatherKeys } from '../event'

describe('parseSources', () => {
    it('미지정이면 전체 소스 반환', () => {
        expect(parseSources()).toEqual(['observed', 'forecast', 'airquality'])
        expect(parseSources(undefined)).toEqual(['observed', 'forecast', 'airquality'])
    })

    it('쉼표 구분 + trim + 유효 값만 통과', () => {
        expect(parseSources(' observed , forecast , invalid ')).toEqual(['observed', 'forecast'])
    })

    it('유효 값 없으면 빈 배열', () => {
        expect(parseSources('foo,bar')).toEqual([])
    })
})

describe('resolveWeatherKeys', () => {
    it('runtimeConfig 의 weatherKor / openData / airKoreaKey 를 trim 해서 반환', () => {
        const stub = vi.fn(() => ({
            weatherKor: '  obs-key  ',
            openData: 'forecast-key',
            airKoreaKey: 42 // 숫자도 String() 처리 후 trim
        }))
        vi.stubGlobal('useRuntimeConfig', stub)

        const result = resolveWeatherKeys({} as any)

        expect(stub).toHaveBeenCalledWith({})
        expect(result).toEqual({
            authKey: 'obs-key',
            openDataKey: 'forecast-key',
            airKoreaKey: '42'
        })
    })

    it('값이 없으면 빈 문자열', () => {
        vi.stubGlobal('useRuntimeConfig', () => ({}))

        expect(resolveWeatherKeys({} as any)).toEqual({
            authKey: '',
            openDataKey: '',
            airKoreaKey: ''
        })
    })
})
