/**
 * 서울시 공공데이터 원본 파일을 정제하여 server/data/facilities/ 에 JSON으로 출력한다.
 * - 병의원: 일반병의원만 필터 (치과/한의원 제거)
 * - 공중화장실: 전체
 * - 공원음수대: 전체
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(ROOT, 'public/temp_datas')
const DEST = resolve(ROOT, 'server/data/facilities')

// ── 병의원 ──
const ALLOWED_HOSPITAL_TYPES = ['의원', '병원', '종합병원', '상급종합병원']

interface HospitalRaw {
    hpid: string
    dutyname: string
    dutydivnam: string
    wgs84lat: string
    wgs84lon: string
    dutyaddr: string
    dutytel1?: string
    dutytime1s?: string
    dutytime1c?: string
    dutytime6s?: string
    dutytime6c?: string
}

/** 진료시간 포맷: "0900"→"09:00" */
function formatTime(t?: string): string {
    if (!t || t.length < 4) return ''
    return `${t.slice(0, 2)}:${t.slice(2)}`
}

function buildHospitalHours(r: HospitalRaw): string {
    const weekday =
        r.dutytime1s && r.dutytime1c
            ? `평일 ${formatTime(r.dutytime1s)}~${formatTime(r.dutytime1c)}`
            : ''
    const sat =
        r.dutytime6s && r.dutytime6c
            ? `토 ${formatTime(r.dutytime6s)}~${formatTime(r.dutytime6c)}`
            : ''
    return [weekday, sat].filter(Boolean).join(', ')
}

const hospitalRaw = JSON.parse(readFileSync(resolve(SRC, '서울시 병의원 위치 정보.json'), 'utf-8'))
const hospitals = (hospitalRaw.DATA as HospitalRaw[])
    .filter((r) => ALLOWED_HOSPITAL_TYPES.includes(r.dutydivnam))
    .filter((r) => {
        const lat = parseFloat(r.wgs84lat)
        const lng = parseFloat(r.wgs84lon)
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
    })
    .map((r, i) => ({
        id: `hospital-${r.hpid || i}`,
        type: 'hospital' as const,
        name: r.dutyname,
        description: r.dutyaddr,
        lng: parseFloat(r.wgs84lon),
        lat: parseFloat(r.wgs84lat),
        hours: buildHospitalHours(r) || undefined,
        tel: r.dutytel1 || undefined
    }))

writeFileSync(resolve(DEST, 'hospitals.json'), JSON.stringify(hospitals))
console.log(`[hospitals] ${hospitals.length}건 저장`)

// ── 공중화장실 ──
interface ToiletRaw {
    objectid: number
    conts_name: string
    addr_new: string
    coord_x: number
    coord_y: number
    value_02?: string
    tel_no?: string
}

/** "기타|05:00~23:00|" → "05:00~23:00" */
function parseToiletHours(raw?: string): string {
    if (!raw) return ''
    const match = raw.match(/(\d{2}:\d{2}~\d{2}:\d{2})/)
    if (match) return match[1]
    if (raw.includes('24시간')) return '24시간'
    return ''
}

const toiletRaw = JSON.parse(readFileSync(resolve(SRC, '서울시 공중화장실 위치정보.json'), 'utf-8'))
const toilets = (toiletRaw.DATA as ToiletRaw[])
    .filter((r) => r.coord_x && r.coord_y && r.coord_x !== 0 && r.coord_y !== 0)
    .map((r) => ({
        id: `toilet-${r.objectid}`,
        type: 'toilet' as const,
        name: r.conts_name,
        description: r.addr_new,
        lng: r.coord_x,
        lat: r.coord_y,
        hours: parseToiletHours(r.value_02) || undefined,
        tel: r.tel_no || undefined
    }))

writeFileSync(resolve(DEST, 'toilets.json'), JSON.stringify(toilets))
console.log(`[toilets] ${toilets.length}건 저장`)

// ── 공원음수대 ──
interface FountainRaw {
    cn_id: string
    cn_park_nm: string
    xcrd: string | null
    ycrd: string | null
    road_nm_addr: string | null
    lotno_addr: string | null
}

const fountainRaw = JSON.parse(
    readFileSync(resolve(SRC, '서울시 공원음수대 정보 조회.json'), 'utf-8')
)
const fountains = (fountainRaw.DATA as FountainRaw[])
    .filter((r) => {
        if (!r.xcrd || !r.ycrd) return false
        const lng = parseFloat(r.xcrd)
        const lat = parseFloat(r.ycrd)
        return !isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0
    })
    .map((r) => ({
        id: `fountain-${r.cn_id}`,
        type: 'fountain' as const,
        name: `${r.cn_park_nm} 음수대`,
        description: r.road_nm_addr || r.lotno_addr || '',
        lng: parseFloat(r.xcrd!),
        lat: parseFloat(r.ycrd!)
    }))

writeFileSync(resolve(DEST, 'fountains.json'), JSON.stringify(fountains))
console.log(`[fountains] ${fountains.length}건 저장`)

console.log('\n전처리 완료')
