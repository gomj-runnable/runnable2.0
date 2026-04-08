import { defineEventHandler, getRouterParam, createError } from 'h3'
import type { SeoulMonthlyWeather, DongWeather, DailyWeather, WeatherCondition, Pm10Grade } from '#shared/types/weather'

// 서울 구별 대표 격자 (기상청 격자 좌표)
const SEOUL_GU_GRID: Record<string, { name: string; nx: number; ny: number; guCode: string }> = {
  '11110': { name: '종로구', nx: 60, ny: 127, guCode: '11110' },
  '11140': { name: '중구', nx: 60, ny: 127, guCode: '11140' },
  '11170': { name: '용산구', nx: 60, ny: 126, guCode: '11170' },
  '11200': { name: '성동구', nx: 61, ny: 127, guCode: '11200' },
  '11215': { name: '광진구', nx: 62, ny: 127, guCode: '11215' },
  '11230': { name: '동대문구', nx: 61, ny: 127, guCode: '11230' },
  '11260': { name: '중랑구', nx: 62, ny: 128, guCode: '11260' },
  '11290': { name: '성북구', nx: 61, ny: 127, guCode: '11290' },
  '11305': { name: '강북구', nx: 61, ny: 128, guCode: '11305' },
  '11320': { name: '도봉구', nx: 61, ny: 129, guCode: '11320' },
  '11350': { name: '노원구', nx: 61, ny: 129, guCode: '11350' },
  '11380': { name: '은평구', nx: 59, ny: 127, guCode: '11380' },
  '11410': { name: '서대문구', nx: 59, ny: 127, guCode: '11410' },
  '11440': { name: '마포구', nx: 59, ny: 127, guCode: '11440' },
  '11470': { name: '양천구', nx: 58, ny: 126, guCode: '11470' },
  '11500': { name: '강서구', nx: 58, ny: 126, guCode: '11500' },
  '11530': { name: '구로구', nx: 58, ny: 125, guCode: '11530' },
  '11545': { name: '금천구', nx: 59, ny: 124, guCode: '11545' },
  '11560': { name: '영등포구', nx: 58, ny: 126, guCode: '11560' },
  '11590': { name: '동작구', nx: 59, ny: 126, guCode: '11590' },
  '11620': { name: '관악구', nx: 59, ny: 125, guCode: '11620' },
  '11650': { name: '서초구', nx: 61, ny: 125, guCode: '11650' },
  '11680': { name: '강남구', nx: 61, ny: 126, guCode: '11680' },
  '11710': { name: '송파구', nx: 62, ny: 126, guCode: '11710' },
  '11740': { name: '강동구', nx: 62, ny: 126, guCode: '11740' },
}

// 기상청 API 단기예보 조회
async function fetchVilageFcst(
  serviceKey: string,
  baseDate: string,
  nx: number,
  ny: number
): Promise<{ category: string; fcstDate: string; fcstValue: string }[]> {
  const url = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst')
  url.searchParams.set('serviceKey', serviceKey)
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('numOfRows', '1000')
  url.searchParams.set('dataType', 'JSON')
  url.searchParams.set('base_date', baseDate)
  url.searchParams.set('base_time', '0500')
  url.searchParams.set('nx', String(nx))
  url.searchParams.set('ny', String(ny))

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return []
    const json = await res.json()
    return json?.response?.body?.items?.item ?? []
  } catch {
    return []
  }
}

// PTY, SKY 코드 → WeatherCondition
function toCondition(pty: number, sky: number): WeatherCondition {
  if (pty === 1 || pty === 4) return 'rainy'
  if (pty === 2) return 'rainy'
  if (pty === 3) return 'snowy'
  if (sky === 1) return 'clear'
  if (sky === 3) return 'partly-cloudy'
  return 'cloudy'
}

// PM10 수치 → 등급
function toPm10Grade(pm10: number): Pm10Grade {
  if (pm10 <= 30) return 'good'
  if (pm10 <= 80) return 'moderate'
  if (pm10 <= 150) return 'bad'
  return 'very-bad'
}

// 일별 기상 데이터 집계
function aggregateDaily(
  items: { category: string; fcstDate: string; fcstValue: string }[],
  date: string
): Pick<DailyWeather, 'condition' | 'tempMin' | 'tempMax'> {
  const dayItems = items.filter(i => i.fcstDate === date)
  const getVal = (cat: string) =>
    dayItems.find(i => i.category === cat)?.fcstValue

  const tmx = parseFloat(getVal('TMX') ?? getVal('TMP') ?? '10')
  const tmn = parseFloat(getVal('TMN') ?? getVal('TMP') ?? '5')
  const sky = parseInt(getVal('SKY') ?? '1')
  const pty = parseInt(getVal('PTY') ?? '0')

  return {
    condition: toCondition(pty, sky),
    tempMin: isNaN(tmn) ? 5 : tmn,
    tempMax: isNaN(tmx) ? 15 : tmx,
  }
}

export default defineEventHandler(async (event) => {
  const dateParam = getRouterParam(event, 'date') // "202504"
  if (!dateParam || !/^\d{6}$/.test(dateParam)) {
    throw createError({ statusCode: 400, message: 'date must be YYYYMM' })
  }

  const config = useRuntimeConfig()
  const serviceKey = config.weatherKor

  const year = parseInt(dateParam.slice(0, 4))
  const month = parseInt(dateParam.slice(4, 6))

  // 해당 월의 날짜 목록 생성
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d)
    // 오늘 이후 날짜는 단기예보로 커버 (최대 D+3)
    const daysDiff = Math.ceil((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff <= 3) {
      dates.push(`${year}${String(month).padStart(2, '0')}${String(d).padStart(2, '0')}`)
    }
  }

  // 구별로 날씨 데이터 조회
  const dongs: DongWeather[] = []

  // 유니크 격자 목록 추출 (중복 제거로 API 호출 최소화)
  const gridMap = new Map<string, { nx: number; ny: number }>()
  for (const gu of Object.values(SEOUL_GU_GRID)) {
    gridMap.set(`${gu.nx}_${gu.ny}`, { nx: gu.nx, ny: gu.ny })
  }

  // 기상청 API 조회 (오늘 기준 단기예보 1회 호출)
  const gridResults = new Map<string, { category: string; fcstDate: string; fcstValue: string }[]>()
  const baseDateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`

  for (const [key, grid] of gridMap) {
    const items = await fetchVilageFcst(serviceKey, baseDateStr, grid.nx, grid.ny)
    gridResults.set(key, items)
  }

  // 각 구별 월간 데이터 구성
  for (const [guCode, guMeta] of Object.entries(SEOUL_GU_GRID)) {
    const gridKey = `${guMeta.nx}_${guMeta.ny}`
    const items = gridResults.get(gridKey) ?? []

    const monthly: DailyWeather[] = dates.map(dateStr => {
      const daily = aggregateDaily(items, dateStr)
      const pm10 = 30 + Math.floor(Math.random() * 50) // TODO: 에어코리아 API로 교체
      return {
        date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
        ...daily,
        pm10,
        pm10Grade: toPm10Grade(pm10),
      }
    })

    dongs.push({
      dongCode: guCode,
      dongName: guMeta.name,
      nx: guMeta.nx,
      ny: guMeta.ny,
      monthly,
    })
  }

  const result: SeoulMonthlyWeather = { year, month, dongs }
  return result
})
