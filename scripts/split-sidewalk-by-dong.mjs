/**
 * 구 단위 인도 JSON을 법정동 단위로 분할하는 전처리 스크립트.
 * 실행: node scripts/split-sidewalk-by-dong.mjs
 *
 * 입력: public/sidewalk/{구}.json (구 단위 좌표 배열)
 * 출력: public/sidewalk/{구}/{동}.json (동 단위 좌표 배열)
 *       public/sidewalk/index.json (구+동 목록)
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'

const DONG_BOUNDARY_URL =
    'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_submunicipalities_geo_simple.json'
const GU_BOUNDARY_URL =
    'https://raw.githubusercontent.com/southkorea/seoul-maps/master/juso/2015/json/seoul_municipalities_geo_simple.json'
const SIDEWALK_DIR = join(import.meta.dirname, '..', 'public', 'sidewalk')

// ─── Point-in-Polygon (Ray Casting) ──────────────────────────────

function pointInRing(px, py, ring) {
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

function pointInGeometry(px, py, geometry) {
    if (geometry.type === 'Polygon') {
        return pointInRing(px, py, geometry.coordinates[0])
    }
    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.some((poly) => pointInRing(px, py, poly[0]))
    }
    return false
}

/** polyline 중간점의 [lng, lat]을 반환 */
function midpoint(coords) {
    const mid = Math.floor(coords.length / 2)
    return coords[mid]
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
    // 1. 구 경계 로드 (구 코드 → 구 이름 매핑용)
    console.log('1. 구 경계 GeoJSON 다운로드...')
    const guRes = await fetch(GU_BOUNDARY_URL)
    const guData = await guRes.json()
    console.log(`   ${guData.features.length}개 구 로드`)

    // 2. 동 경계 로드
    console.log('2. 법정동 경계 GeoJSON 다운로드...')
    const dongRes = await fetch(DONG_BOUNDARY_URL)
    const dongData = await dongRes.json()

    // 동 경계의 여러 샘플점으로 구를 판별하는 순수 기하학적 매핑
    const dongsByGu = new Map() // 구이름 → [{ name, geometry }]
    let dongMapped = 0
    let dongFailed = 0

    for (const f of dongData.features) {
        const dongName = f.properties.name
        const dongCode = f.properties.code

        // 동 폴리곤에서 여러 샘플점 추출 (중심점, 첫 점, 1/4점, 3/4점)
        const outerRing =
            f.geometry.type === 'Polygon'
                ? f.geometry.coordinates[0]
                : f.geometry.coordinates[0][0]
        const samplePoints = [
            // 중심점
            [
                outerRing.reduce((s, c) => s + c[0], 0) / outerRing.length,
                outerRing.reduce((s, c) => s + c[1], 0) / outerRing.length
            ],
            // 첫 점, 1/4, 1/2, 3/4
            outerRing[0],
            outerRing[Math.floor(outerRing.length / 4)],
            outerRing[Math.floor(outerRing.length / 2)],
            outerRing[Math.floor((outerRing.length * 3) / 4)]
        ]

        let guName = null
        for (const [px, py] of samplePoints) {
            for (const gf of guData.features) {
                if (pointInGeometry(px, py, gf.geometry)) {
                    guName = gf.properties.SIG_KOR_NM
                    break
                }
            }
            if (guName) break
        }

        if (!guName) {
            console.warn(`   ⚠ 동 "${dongName}" (code ${dongCode}) 구 매핑 실패`)
            dongFailed++
            continue
        }

        if (!dongsByGu.has(guName)) dongsByGu.set(guName, [])
        dongsByGu.get(guName).push({ name: dongName, geometry: f.geometry })
        dongMapped++
    }

    console.log(
        `   ${dongData.features.length}개 동 로드, ${dongsByGu.size}개 구에 ${dongMapped}개 매핑 (실패: ${dongFailed})`
    )

    // 3. 각 구의 sidewalk JSON을 동 단위로 분류
    console.log('3. 인도 데이터 동 단위 분류...')
    const indexData = JSON.parse(readFileSync(join(SIDEWALK_DIR, 'index.json'), 'utf-8'))
    const newIndex = []

    for (const gu of indexData) {
        const guFile = join(SIDEWALK_DIR, `${gu.name}.json`)
        if (!existsSync(guFile)) {
            console.warn(`   ⚠ ${gu.name}.json 없음, 건너뜀`)
            continue
        }

        const polylines = JSON.parse(readFileSync(guFile, 'utf-8'))
        const dongs = dongsByGu.get(gu.name) || []

        if (dongs.length === 0) {
            console.warn(`   ⚠ ${gu.name}: 동 경계 없음`)
            continue
        }

        // 동별 polyline 그룹
        const dongGroups = new Map()
        for (const d of dongs) dongGroups.set(d.name, [])
        dongGroups.set('기타', [])

        let matched = 0
        let unmatched = 0

        for (const polyline of polylines) {
            if (!polyline || polyline.length < 2) continue
            const [lng, lat] = midpoint(polyline)

            let found = false
            for (const d of dongs) {
                if (pointInGeometry(lng, lat, d.geometry)) {
                    dongGroups.get(d.name).push(polyline)
                    matched++
                    found = true
                    break
                }
            }

            if (!found) {
                dongGroups.get('기타').push(polyline)
                unmatched++
            }
        }

        // 구 디렉터리 생성
        const guDir = join(SIDEWALK_DIR, gu.name)
        mkdirSync(guDir, { recursive: true })

        // 동별 파일 저장
        const dongIndex = []
        for (const [dongName, coords] of dongGroups) {
            if (coords.length === 0) continue
            writeFileSync(join(guDir, `${dongName}.json`), JSON.stringify(coords))
            dongIndex.push({ name: dongName, count: coords.length })
        }

        console.log(`   ${gu.name}: ${polylines.length}건 → ${dongIndex.length}개 동 (미매칭: ${unmatched}건)`)

        newIndex.push({
            name: gu.name,
            code: gu.code,
            count: gu.count,
            dongs: dongIndex.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        })
    }

    // 모든 구 처리 완료 후 기존 구 단위 JSON 삭제
    console.log('4. 기존 구 단위 파일 삭제...')
    for (const gu of newIndex) {
        const guFile = join(SIDEWALK_DIR, `${gu.name}.json`)
        if (existsSync(guFile)) rmSync(guFile)
    }

    // index.json 갱신
    writeFileSync(join(SIDEWALK_DIR, 'index.json'), JSON.stringify(newIndex, null, 2))
    console.log(`\n완료! ${newIndex.length}개 구, 총 ${newIndex.reduce((s, g) => s + g.dongs.length, 0)}개 동 파일 생성`)
}

main().catch(console.error)
