/**
 * sidewalk.geojson을 서울 25개 구 단위로 분할하는 전처리 스크립트.
 * 실행: node scripts/split-sidewalk.mjs
 *
 * 출력: public/sidewalk/{구이름}.json (좌표 배열만 저장하여 용량 최소화)
 *       public/sidewalk/index.json (구 목록)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const BOUNDARY_URL =
    'https://raw.githubusercontent.com/southkorea/seoul-maps/master/juso/2015/json/seoul_municipalities_geo_simple.json'
const SIDEWALK_PATH = join(import.meta.dirname, '..', 'public', 'sidewalk.geojson')
const OUTPUT_DIR = join(import.meta.dirname, '..', 'public', 'sidewalk')

// ─── Point-in-Polygon (Ray Casting) ──────────────────────────────

function pointInRing(point, ring) {
    const [px, py] = point
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i]
        const [xj, yj] = ring[j]
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
            inside = !inside
        }
    }
    return inside
}

function pointInPolygon(point, polygon) {
    // polygon.coordinates = [ outerRing, ...holes ]
    const coords = polygon.type === 'MultiPolygon' ? polygon.coordinates.flat() : polygon.coordinates
    // outer ring
    if (!pointInRing(point, coords[0])) return false
    // holes
    for (let h = 1; h < coords.length; h++) {
        if (pointInRing(point, coords[h])) return false
    }
    return true
}

// ─── 중심점 + 양 끝점 계산 ───────────────────────────────────────

function getCheckPoints(coords) {
    if (coords.length === 0) return []
    const mid = Math.floor(coords.length / 2)
    const points = [coords[mid]] // 중점
    points.push(coords[0]) // 시작점
    points.push(coords[coords.length - 1]) // 끝점
    return points
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
    console.log('1. 서울 행정경계 GeoJSON 다운로드...')
    const boundaryRes = await fetch(BOUNDARY_URL)
    const boundary = await boundaryRes.json()

    const districts = boundary.features.map((f) => ({
        name: f.properties.SIG_KOR_NM,
        code: f.properties.SIG_CD,
        geometry: f.geometry
    }))
    console.log(`   ${districts.length}개 구 로드 완료`)

    console.log('2. sidewalk.geojson 읽기...')
    const sidewalkRaw = readFileSync(SIDEWALK_PATH, 'utf-8')
    const sidewalk = JSON.parse(sidewalkRaw)
    console.log(`   ${sidewalk.features.length}개 피처 로드 완료`)

    // 구별 좌표 그룹
    const groups = new Map()
    for (const d of districts) {
        groups.set(d.name, [])
    }
    let unmatched = 0

    console.log('3. 피처별 구 할당 중...')
    for (let i = 0; i < sidewalk.features.length; i++) {
        if (i % 10000 === 0) console.log(`   ${i}/${sidewalk.features.length}`)

        const coords = sidewalk.features[i].geometry.coordinates
        if (!coords || coords.length < 2) continue

        const checkPoints = getCheckPoints(coords)
        const matched = new Set()

        for (const pt of checkPoints) {
            for (const d of districts) {
                if (matched.has(d.name)) continue
                if (pointInPolygon(pt, d.geometry)) {
                    matched.add(d.name)
                }
            }
        }

        if (matched.size === 0) {
            unmatched++
            continue
        }

        // 경계 중복: 양쪽 구 모두에 추가
        for (const name of matched) {
            groups.get(name).push(coords)
        }
    }

    console.log(`4. 파일 저장... (미매칭: ${unmatched}건)`)
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    const index = []
    for (const [name, coords] of groups) {
        if (coords.length === 0) continue
        const district = districts.find((d) => d.name === name)
        const filename = `${name}.json`
        writeFileSync(join(OUTPUT_DIR, filename), JSON.stringify(coords))
        index.push({ name, code: district?.code, count: coords.length })
        console.log(`   ${name}: ${coords.length}건`)
    }

    writeFileSync(join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2))
    console.log(`\n완료! ${index.length}개 구 파일 생성됨`)
}

main().catch(console.error)
