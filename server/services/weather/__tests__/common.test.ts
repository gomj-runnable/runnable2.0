import { describe, it, expect } from 'vitest'
import {
    fromKstParts,
    toDateOnly,
    addDays,
    addHours,
    withKstHour,
    truncateToKstHour,
    getKstHour,
    formatDate,
    formatHour,
    formatYmd,
    formatKstMinute,
    parseYmd,
    parseNumber,
    toSlotDateTimeKey,
    parseSlotDateTime,
    mapPm10Grade,
    mapConditionByCloudAndRain,
    mapConditionByPrecipitation
} from '../common'

// KST는 UTC+9 이므로 UTC 기준 Date를 직접 생성해 테스트한다.
// fromKstParts(2025, 4, 8, 13, 0) → UTC 2025-04-08T04:00:00Z

describe('fromKstParts', () => {
    it('KST 날짜/시각을 UTC Date로 변환한다', () => {
        const date = fromKstParts(2025, 4, 8, 13, 0)
        expect(date.getTime()).toBe(new Date('2025-04-08T04:00:00.000Z').getTime())
    })

    it('hour/minute 기본값은 0이다', () => {
        const date = fromKstParts(2025, 1, 1)
        expect(date.getTime()).toBe(new Date('2024-12-31T15:00:00.000Z').getTime())
    })

    it('월 경계: 12월 → 1월 이월', () => {
        const date = fromKstParts(2024, 12, 31, 23, 59)
        expect(date.toISOString()).toBe('2024-12-31T14:59:00.000Z')
    })

    it('자정 KST (hour=0)는 전날 UTC 15:00이다', () => {
        const date = fromKstParts(2025, 4, 8, 0, 0)
        expect(date.toISOString()).toBe('2025-04-07T15:00:00.000Z')
    })
})

describe('toDateOnly', () => {
    it('KST 시각을 자정(00:00 KST)으로 절삭한다', () => {
        const input = fromKstParts(2025, 4, 8, 13, 30)
        const result = toDateOnly(input)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 8, 0, 0).getTime())
    })

    it('이미 자정인 경우 그대로 반환한다', () => {
        const input = fromKstParts(2025, 4, 8, 0, 0)
        const result = toDateOnly(input)
        expect(result.getTime()).toBe(input.getTime())
    })
})

describe('addDays', () => {
    it('일수를 더한다', () => {
        const input = fromKstParts(2025, 4, 8, 12, 0)
        const result = addDays(input, 3)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 11, 12, 0).getTime())
    })

    it('음수 일수로 과거로 이동한다', () => {
        const input = fromKstParts(2025, 4, 8, 12, 0)
        const result = addDays(input, -2)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 6, 12, 0).getTime())
    })

    it('월말 이월: 4월 30일 + 1일 = 5월 1일', () => {
        const input = fromKstParts(2025, 4, 30, 0, 0)
        const result = addDays(input, 1)
        expect(result.getTime()).toBe(fromKstParts(2025, 5, 1, 0, 0).getTime())
    })
})

describe('addHours', () => {
    it('시간을 더한다', () => {
        const base = new Date('2025-04-08T00:00:00.000Z')
        const result = addHours(base, 5)
        expect(result.getTime()).toBe(new Date('2025-04-08T05:00:00.000Z').getTime())
    })

    it('음수 시간으로 과거로 이동한다', () => {
        const base = new Date('2025-04-08T10:00:00.000Z')
        const result = addHours(base, -3)
        expect(result.getTime()).toBe(new Date('2025-04-08T07:00:00.000Z').getTime())
    })

    it('24시간 추가 시 하루 뒤가 된다', () => {
        const base = new Date('2025-04-08T00:00:00.000Z')
        const result = addHours(base, 24)
        expect(result.getTime()).toBe(new Date('2025-04-09T00:00:00.000Z').getTime())
    })
})

describe('withKstHour', () => {
    it('KST 시각을 지정한 시(hour)로 교체한다', () => {
        const input = fromKstParts(2025, 4, 8, 13, 30)
        const result = withKstHour(input, 9)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 8, 9, 0).getTime())
    })

    it('분은 항상 0으로 초기화된다', () => {
        const input = fromKstParts(2025, 4, 8, 13, 45)
        const result = withKstHour(input, 13)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 8, 13, 0).getTime())
    })
})

describe('truncateToKstHour', () => {
    it('분을 0으로 절삭한다', () => {
        const input = fromKstParts(2025, 4, 8, 14, 37)
        const result = truncateToKstHour(input)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 8, 14, 0).getTime())
    })

    it('이미 정각이면 그대로다', () => {
        const input = fromKstParts(2025, 4, 8, 14, 0)
        const result = truncateToKstHour(input)
        expect(result.getTime()).toBe(input.getTime())
    })
})

describe('getKstHour', () => {
    it('KST 시(hour)를 반환한다', () => {
        const date = fromKstParts(2025, 4, 8, 17, 0)
        expect(getKstHour(date)).toBe(17)
    })

    it('자정(0시)을 반환한다', () => {
        const date = fromKstParts(2025, 4, 8, 0, 0)
        expect(getKstHour(date)).toBe(0)
    })

    it('23시를 반환한다', () => {
        const date = fromKstParts(2025, 4, 8, 23, 0)
        expect(getKstHour(date)).toBe(23)
    })
})

describe('formatDate', () => {
    it('YYYY-MM-DD 형식으로 포맷한다', () => {
        const date = fromKstParts(2025, 4, 8, 13, 0)
        expect(formatDate(date)).toBe('2025-04-08')
    })

    it('월/일이 한 자리면 0으로 패딩한다', () => {
        const date = fromKstParts(2025, 1, 5, 0, 0)
        expect(formatDate(date)).toBe('2025-01-05')
    })
})

describe('formatHour', () => {
    it('HH:00 형식으로 포맷한다', () => {
        const date = fromKstParts(2025, 4, 8, 9, 0)
        expect(formatHour(date)).toBe('09:00')
    })

    it('두 자리 시간은 그대로 출력된다', () => {
        const date = fromKstParts(2025, 4, 8, 13, 0)
        expect(formatHour(date)).toBe('13:00')
    })

    it('자정(0시)은 00:00이다', () => {
        const date = fromKstParts(2025, 4, 8, 0, 0)
        expect(formatHour(date)).toBe('00:00')
    })
})

describe('formatYmd', () => {
    it('YYYYMMDD 형식으로 포맷한다', () => {
        const date = fromKstParts(2025, 4, 8, 0, 0)
        expect(formatYmd(date)).toBe('20250408')
    })

    it('월/일이 한 자리면 0으로 패딩한다', () => {
        const date = fromKstParts(2025, 1, 5, 0, 0)
        expect(formatYmd(date)).toBe('20250105')
    })
})

describe('formatKstMinute', () => {
    it('YYYYMMDDHHmm 형식으로 포맷하고 분은 항상 00이다', () => {
        const date = fromKstParts(2025, 4, 8, 13, 45)
        expect(formatKstMinute(date)).toBe('202504081300')
    })

    it('자정(0시)은 HH=00이다', () => {
        const date = fromKstParts(2025, 4, 8, 0, 0)
        expect(formatKstMinute(date)).toBe('202504080000')
    })
})

describe('parseYmd', () => {
    it('올바른 YYYY-MM-DD 문자열을 Date로 파싱한다', () => {
        const result = parseYmd('2025-04-08')
        expect(result).not.toBeNull()
        expect(formatDate(result!)).toBe('2025-04-08')
    })

    it('형식이 다르면 null을 반환한다', () => {
        expect(parseYmd('20250408')).toBeNull()
        expect(parseYmd('2025/04/08')).toBeNull()
        expect(parseYmd('2025-4-8')).toBeNull()
    })

    it('빈 문자열은 null을 반환한다', () => {
        expect(parseYmd('')).toBeNull()
    })

    it('유효하지 않은 날짜(2월 30일)는 null을 반환한다', () => {
        expect(parseYmd('2025-02-30')).toBeNull()
    })
})

describe('parseNumber', () => {
    it('숫자 문자열을 number로 파싱한다', () => {
        expect(parseNumber('3.5')).toBe(3.5)
        expect(parseNumber('0')).toBe(0)
        expect(parseNumber('-10')).toBe(-10)
    })

    it('number 타입은 그대로 반환한다', () => {
        expect(parseNumber(42)).toBe(42)
        expect(parseNumber(0)).toBe(0)
    })

    it('null/undefined는 null을 반환한다', () => {
        expect(parseNumber(null)).toBeNull()
        expect(parseNumber(undefined)).toBeNull()
    })

    it('결측 마커 문자열은 null을 반환한다', () => {
        expect(parseNumber('-9')).toBeNull()
        expect(parseNumber('-9.0')).toBeNull()
        expect(parseNumber('///')).toBeNull()
        expect(parseNumber('NaN')).toBeNull()
        expect(parseNumber('')).toBeNull()
    })

    it('Infinity는 null을 반환한다', () => {
        expect(parseNumber(Infinity)).toBeNull()
        expect(parseNumber(-Infinity)).toBeNull()
    })

    it('숫자로 변환 불가능한 문자열은 null을 반환한다', () => {
        expect(parseNumber('abc')).toBeNull()
    })
})

describe('toSlotDateTimeKey', () => {
    it('date와 time을 "T"로 연결한 키를 반환한다', () => {
        const slot = { date: '2025-04-08', time: '13:00' }
        expect(toSlotDateTimeKey(slot)).toBe('2025-04-08T13:00')
    })
})

describe('parseSlotDateTime', () => {
    it('slot의 date/time을 KST 기준 Date로 변환한다', () => {
        const slot = { date: '2025-04-08', time: '13:00' }
        const result = parseSlotDateTime(slot)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 8, 13, 0).getTime())
    })

    it('자정(00:00)도 올바르게 파싱한다', () => {
        const slot = { date: '2025-04-08', time: '00:00' }
        const result = parseSlotDateTime(slot)
        expect(result.getTime()).toBe(fromKstParts(2025, 4, 8, 0, 0).getTime())
    })
})

describe('mapPm10Grade', () => {
    it('30 이하는 good이다', () => {
        expect(mapPm10Grade(0)).toBe('good')
        expect(mapPm10Grade(30)).toBe('good')
    })

    it('31~80은 moderate이다', () => {
        expect(mapPm10Grade(31)).toBe('moderate')
        expect(mapPm10Grade(80)).toBe('moderate')
    })

    it('81~150은 bad이다', () => {
        expect(mapPm10Grade(81)).toBe('bad')
        expect(mapPm10Grade(150)).toBe('bad')
    })

    it('151 이상은 very-bad이다', () => {
        expect(mapPm10Grade(151)).toBe('very-bad')
        expect(mapPm10Grade(999)).toBe('very-bad')
    })
})

describe('mapConditionByCloudAndRain', () => {
    it('강수량 > 0이고 온도 > 0이면 rainy', () => {
        expect(mapConditionByCloudAndRain(5, 0.5, null)).toBe('rainy')
    })

    it('강수량 > 0이고 온도 <= 0이면 snowy', () => {
        expect(mapConditionByCloudAndRain(0, 1, null)).toBe('snowy')
        expect(mapConditionByCloudAndRain(-5, 2, null)).toBe('snowy')
    })

    it('강수 없고 cloudAmount null이면 clear', () => {
        expect(mapConditionByCloudAndRain(10, 0, null)).toBe('clear')
        expect(mapConditionByCloudAndRain(10, null, null)).toBe('clear')
    })

    it('cloudAmount 0~2는 clear', () => {
        expect(mapConditionByCloudAndRain(10, 0, 0)).toBe('clear')
        expect(mapConditionByCloudAndRain(10, 0, 2)).toBe('clear')
    })

    it('cloudAmount 3~7은 partly-cloudy', () => {
        expect(mapConditionByCloudAndRain(10, 0, 3)).toBe('partly-cloudy')
        expect(mapConditionByCloudAndRain(10, 0, 7)).toBe('partly-cloudy')
    })

    it('cloudAmount 8 이상은 cloudy', () => {
        expect(mapConditionByCloudAndRain(10, 0, 8)).toBe('cloudy')
        expect(mapConditionByCloudAndRain(10, 0, 10)).toBe('cloudy')
    })
})

describe('mapConditionByPrecipitation', () => {
    it('snowfall > 0이면 snowy (온도 무관)', () => {
        expect(mapConditionByPrecipitation(10, 0, 1, null)).toBe('snowy')
        expect(mapConditionByPrecipitation(-5, 0, 0.1, null)).toBe('snowy')
    })

    it('precipitation > 0이고 온도 > 0이면 rainy', () => {
        expect(mapConditionByPrecipitation(5, 1, 0, null)).toBe('rainy')
    })

    it('precipitation > 0이고 온도 <= 0이면 snowy', () => {
        expect(mapConditionByPrecipitation(0, 1, 0, null)).toBe('snowy')
        expect(mapConditionByPrecipitation(-3, 2, null, null)).toBe('snowy')
    })

    it('강수 없고 cloudCover null이면 clear', () => {
        expect(mapConditionByPrecipitation(10, 0, 0, null)).toBe('clear')
        expect(mapConditionByPrecipitation(10, null, null, null)).toBe('clear')
    })

    it('cloudCover 0~25는 clear', () => {
        expect(mapConditionByPrecipitation(10, 0, 0, 0)).toBe('clear')
        expect(mapConditionByPrecipitation(10, 0, 0, 25)).toBe('clear')
    })

    it('cloudCover 26~70은 partly-cloudy', () => {
        expect(mapConditionByPrecipitation(10, 0, 0, 26)).toBe('partly-cloudy')
        expect(mapConditionByPrecipitation(10, 0, 0, 70)).toBe('partly-cloudy')
    })

    it('cloudCover 71 이상은 cloudy', () => {
        expect(mapConditionByPrecipitation(10, 0, 0, 71)).toBe('cloudy')
        expect(mapConditionByPrecipitation(10, 0, 0, 100)).toBe('cloudy')
    })
})
