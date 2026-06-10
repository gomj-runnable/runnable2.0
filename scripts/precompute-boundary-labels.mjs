import fs from 'node:fs'
import path from 'node:path'

const FILES = [
    path.resolve('public/admin_area/sgg_4326.geojson'),
    path.resolve('public/admin_area/emd_4326.geojson')
]

function round6(n) {
    return Math.round(n * 1e6) / 1e6
}

function shoelaceArea(ring) {
    let area = 0
    for (let i = 0, n = ring.length; i < n; i++) {
        const [x1, y1] = ring[i]
        const [x2, y2] = ring[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    }
    return Math.abs(area) / 2
}

function centroid(ring) {
    let cX = 0
    let cY = 0
    for (const [x, y] of ring) {
        cX += x
        cY += y
    }
    return [cX / ring.length, cY / ring.length]
}

function interiorPoint(ring) {
    const [cX, cY] = centroid(ring)

    // 수평 스캔라인 y=cY 와 폴리곤 변들의 교점 x 좌표 수집
    const xs = []
    for (let i = 0, n = ring.length; i < n; i++) {
        const [x1, y1] = ring[i]
        const [x2, y2] = ring[(i + 1) % n]
        // 변이 스캔라인을 가로지르는지 (반열린 구간으로 꼭짓점 중복 방지)
        if (y1 > cY !== y2 > cY) {
            const t = (cY - y1) / (y2 - y1)
            xs.push(x1 + t * (x2 - x1))
        }
    }

    if (xs.length < 2) {
        return [cX, cY]
    }

    xs.sort((a, b) => a - b)

    // 짝수 인덱스 쌍 (내부 구간) 중 가장 넓은 구간의 중점
    let bestX = cX
    let bestWidth = -Infinity
    for (let i = 0; i + 1 < xs.length; i += 2) {
        const width = xs[i + 1] - xs[i]
        if (width > bestWidth) {
            bestWidth = width
            bestX = (xs[i] + xs[i + 1]) / 2
        }
    }

    return [bestX, cY]
}

function largestOuterRing(geometry) {
    if (geometry.type === 'Polygon') {
        return geometry.coordinates[0]
    }
    if (geometry.type === 'MultiPolygon') {
        let bestRing = null
        let bestArea = -Infinity
        for (const polygon of geometry.coordinates) {
            const ring = polygon[0]
            const area = shoelaceArea(ring)
            if (area > bestArea) {
                bestArea = area
                bestRing = ring
            }
        }
        return bestRing
    }
    throw new Error(`Unsupported geometry type: ${geometry.type}`)
}

function bbox(ring) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of ring) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
    }
    return { minX, minY, maxX, maxY }
}

function processFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)
    const features = data.features

    features.forEach((feature, index) => {
        const ring = largestOuterRing(feature.geometry)
        const [lng, lat] = interiorPoint(ring)

        const name = feature.properties?.NAME

        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            throw new Error(
                `Non-finite label point at index ${index} (NAME=${name}): [${lng}, ${lat}]`
            )
        }

        const box = bbox(ring)
        const eps = 1e-9
        if (
            lng < box.minX - eps ||
            lng > box.maxX + eps ||
            lat < box.minY - eps ||
            lat > box.maxY + eps
        ) {
            throw new Error(
                `Label point outside ring bbox at index ${index} (NAME=${name}): ` +
                    `point=[${lng}, ${lat}] bbox=[${box.minX}, ${box.minY}, ${box.maxX}, ${box.maxY}]`
            )
        }

        feature.properties._labelPoint = [round6(lng), round6(lat)]
    })

    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8')

    console.log(`${path.basename(filePath)}: ${features.length} features`)
    console.log(`${path.basename(filePath)}: all label points validated`)

    return features.length
}

for (const filePath of FILES) {
    processFile(filePath)
}
