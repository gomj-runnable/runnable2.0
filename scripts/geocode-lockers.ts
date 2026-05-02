/**
 * 물품보관함 CSV를 파싱하고 Seoul API(OA-22731)에서 역 좌표를 매핑하여
 * server/data/facilities/lockers.json 으로 출력한다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const CSV_PATH = resolve(ROOT, 'public/temp_datas/서울교통공사_물품보관함 위치정보_20240930.csv')
const DEST = resolve(ROOT, 'server/data/facilities/lockers.json')

const SEOUL_KEY = process.env.SEOUL_ACCESS_KEY
if (!SEOUL_KEY) {
    console.error('SEOUL_ACCESS_KEY 환경변수가 설정되지 않았습니다.')
    process.exit(1)
}

// ── CSV 파싱 (EUC-KR → UTF-8) ──
const csvBuf = readFileSync(CSV_PATH)
const decoder = new TextDecoder('euc-kr')
const csvText = decoder.decode(csvBuf)
const lines = csvText.split('\n').filter((l) => l.trim())

// 헤더 제거 후 파싱
const rows = lines.slice(1).map((line) => {
    // CSV에 쉼표가 포함된 필드는 큰따옴표로 감싸져 있음
    const parts: string[] = []
    let current = ''
    let inQuote = false
    for (const ch of line) {
        if (ch === '"') {
            inQuote = !inQuote
        } else if (ch === ',' && !inQuote) {
            parts.push(current.trim())
            current = ''
        } else {
            current += ch
        }
    }
    parts.push(current.trim())
    return { no: parts[0], line: parts[1], lockerName: parts[2], location: parts[3] }
})

// ── 역명 추출 ──
function extractStationName(lockerName: string): string {
    // "서울역1~22" → "서울역", "영업점1~22" → "영업점" 등
    return lockerName.replace(/\d[\d~]*$/, '').trim()
}

const stationNames = [...new Set(rows.map((r) => extractStationName(r.lockerName)))]
console.log(`[lockers] 고유 역명/보관함명: ${stationNames.length}개`)

// ── Seoul API에서 지하철역 마스터 좌표 조회 (subwayStationMaster) ──
interface StationMasterRow {
    BLDN_ID: string
    BLDN_NM: string
    ROUTE: string
    LAT: string
    LOT: string
}

async function fetchStationMaster(): Promise<StationMasterRow[]> {
    const all: StationMasterRow[] = []
    const batchSize = 1000

    for (let start = 1; ; start += batchSize) {
        const end = start + batchSize - 1
        const url = `http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/subwayStationMaster/${start}/${end}/`
        console.log(`[API] ${start}~${end} 조회...`)

        const res = await fetch(url)
        const json = await res.json()
        const info = json.subwayStationMaster

        if (!info?.row?.length) break
        all.push(...info.row)

        if (info.row.length < batchSize) break
    }

    return all
}

async function main() {
    const stationData = await fetchStationMaster()
    console.log(`[API] 총 ${stationData.length}건 역 마스터 데이터 조회`)

    // 역명 → 좌표 매핑 빌드
    const stationCoords = new Map<string, { lng: number; lat: number }>()
    for (const row of stationData) {
        const name = row.BLDN_NM?.trim()
        if (!name) continue

        const lat = parseFloat(row.LAT)
        const lng = parseFloat(row.LOT)

        if (!isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0) {
            const coord = { lng, lat }
            stationCoords.set(name, coord)
            stationCoords.set(name.replace(/역$/, ''), coord)
            // 괄호 앞 이름만 추출: "청량리(서울시립대입구)" → "청량리"
            const parenIdx = name.indexOf('(')
            if (parenIdx > 0) {
                stationCoords.set(name.substring(0, parenIdx), coord)
            }
        }
    }
    console.log(`[좌표] ${stationCoords.size}개 역 좌표 매핑`)

    // ── 보관함 → Facility 매핑 ──
    const lockers: Array<{
        id: string
        type: 'locker'
        name: string
        description: string
        lng: number
        lat: number
    }> = []

    const missing = new Set<string>()

    for (const [i, row] of rows.entries()) {
        const stationKey = extractStationName(row.lockerName)

        // 역명으로 좌표 찾기 (여러 변형 시도)
        const coord =
            stationCoords.get(stationKey) ||
            stationCoords.get(stationKey + '역') ||
            stationCoords.get(row.line + '호선 ' + stationKey) ||
            stationCoords.get(stationKey.replace(/역$/, ''))

        if (!coord) {
            missing.add(stationKey)
            continue
        }

        lockers.push({
            id: `locker-${i + 1}`,
            type: 'locker',
            name: `${stationKey} 물품보관함`,
            description: `${row.line}호선 ${row.location || ''}`.trim(),
            lng: coord.lng,
            lat: coord.lat
        })
    }

    writeFileSync(DEST, JSON.stringify(lockers))
    console.log(`\n[lockers] ${lockers.length}건 저장`)

    if (missing.size > 0) {
        console.log(`[경고] 좌표 매핑 실패 (${missing.size}건):`)
        for (const name of missing) {
            console.log(`  - ${name}`)
        }
    }

    console.log('\n보관함 처리 완료')
}

main().catch(console.error)
