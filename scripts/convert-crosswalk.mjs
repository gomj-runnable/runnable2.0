/**
 * 교통안전시설물 CSV → crosswalks.json 변환 스크립트
 * 사용법: node scripts/convert-crosswalk.mjs
 *
 * 입력: public/crosswalk/A057_L.csv (EPSG:5186)
 * 출력: server/data/facilities/crosswalks.json (WGS84)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import proj4 from 'proj4'

// EPSG:5186 (Korea 2000 / Central Belt 2010) 정의
proj4.defs(
    'EPSG:5186',
    '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs'
)

const toWgs84 = (x, y) => {
    const [lng, lat] = proj4('EPSG:5186', 'WGS84', [x, y])
    return [Math.round(lng * 1e7) / 1e7, Math.round(lat * 1e7) / 1e7]
}

/** SDO_ORDINATE_ARRAY에서 좌표쌍 추출 */
const parseOrdinates = (xgeo) => {
    const match = xgeo.match(/SDO_ORDINATE_ARRAY\(([^)]+)\)/)
    if (!match) return null
    const nums = match[1].split(',').map(Number)
    const coords = []
    for (let i = 0; i < nums.length - 1; i += 2) {
        const x = nums[i]
        const y = nums[i + 1]
        if (Number.isFinite(x) && Number.isFinite(y)) {
            coords.push(toWgs84(x, y))
        }
    }
    return coords.length >= 2 ? coords : null
}

/** CSV 라인 파서 (따옴표 내 콤마 처리) */
const parseCsvLine = (line) => {
    const fields = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            inQuotes = !inQuotes
        } else if (ch === ',' && !inQuotes) {
            fields.push(current)
            current = ''
        } else {
            current += ch
        }
    }
    fields.push(current)
    return fields
}

// ─── 메인 ─────────────────────────────────────────────────────
const csv = readFileSync('public/crosswalk/A057_L.csv', 'latin1')
const lines = csv.split('\n').filter((l) => l.trim())
const headers = parseCsvLine(lines[0])

const colIdx = (name) => headers.indexOf(name)
const iMGRNU = colIdx('MGRNU')
const iKND = colIdx('A057_KND_CDE')
const iXCE = colIdx('XCE')
const iYCE = colIdx('YCE')
const iXGEO = colIdx('XGEO')
const iSNLP = colIdx('SNLP_QUA')
const iBSNLP = colIdx('BSNLP_QUA')
const iSTAT = colIdx('STAT_CDE')

console.log(`총 ${lines.length - 1}건 처리 시작...`)

const facilities = []
let skipped = 0

for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    if (fields.length < 20) continue

    // 001 = 사용중 상태만
    const stat = fields[iSTAT]?.trim()
    if (stat !== '001') {
        skipped++
        continue
    }

    const knd = fields[iKND]?.trim()
    // 002 = 횡단보도, 003 = 기타 교통안전시설물 (신호등 관련)
    if (knd !== '002' && knd !== '003') {
        skipped++
        continue
    }

    const x = parseFloat(fields[iXCE])
    const y = parseFloat(fields[iYCE])
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        skipped++
        continue
    }

    const [lng, lat] = toWgs84(x, y)

    // 서울 영역 필터 (대략 126.7~127.2E, 37.4~37.7N)
    if (lng < 126.7 || lng > 127.2 || lat < 37.4 || lat > 37.7) {
        skipped++
        continue
    }

    const mgrnu = fields[iMGRNU]?.trim() || `crosswalk-${i}`

    // XGEO에 콤마가 포함되어 필드가 밀림 → 뒤에서부터 SNLP_QUA, BSNLP_QUA 추출
    const bsnlp = parseInt(fields[fields.length - 1]) || 0
    const hasSignal = bsnlp > 0

    // 폴리라인 파싱 (XGEO부터 뒤에서 3번째 필드까지가 XGEO)
    const xgeo = fields.slice(iXGEO, fields.length - 3).join(',')
    const polyline = parseOrdinates(xgeo)

    facilities.push({
        id: `crosswalk-${mgrnu}`,
        type: 'crosswalk',
        name: hasSignal ? '횡단보도 (신호)' : '횡단보도 (무신호)',
        lng,
        lat,
        hasSignal,
        ...(polyline && { polyline })
    })
}

console.log(`변환 완료: ${facilities.length}건 (스킵: ${skipped}건)`)

writeFileSync(
    'server/data/facilities/crosswalks.json',
    JSON.stringify(facilities, null, 0) // 용량 절감
)

const sizeMB = (Buffer.byteLength(JSON.stringify(facilities)) / 1024 / 1024).toFixed(1)
console.log(`출력: server/data/facilities/crosswalks.json (${sizeMB} MB)`)
