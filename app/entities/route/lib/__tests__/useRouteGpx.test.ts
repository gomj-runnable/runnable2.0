import { describe, it, expect } from 'vitest'
import { createRouteGpx, toGpxFileName } from '~/entities/route/lib/useRouteGpx'

describe('createRouteGpx()', () => {
    it('XML 헤더 + gpx 1.1 namespace 포함', () => {
        const gpx = createRouteGpx({ title: '한강 경로', description: '설명' }, [
            {
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127, 37, 50],
                        [127.001, 37.001, 60]
                    ]
                },
                attrs: [{ seq: 0, name: '시작 구간' }]
            } as any
        ])
        expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>')
        expect(gpx).toContain('xmlns="http://www.topografix.com/GPX/1/1"')
        expect(gpx).toContain('<name>한강 경로</name>')
        expect(gpx).toContain('<desc>설명</desc>')
        expect(gpx).toContain('<trkseg>')
        expect(gpx).toContain('<sectionName>시작 구간</sectionName>')
        expect(gpx).toContain('<trkpt lat="37" lon="127"')
    })

    it('description 없으면 desc 태그 생략', () => {
        const gpx = createRouteGpx({ title: 'A', description: '' }, [])
        expect(gpx).not.toContain('<desc>')
    })

    it('section.geom 좌표 없으면 trkseg 생략', () => {
        const gpx = createRouteGpx({ title: 'A', description: undefined }, [
            {
                geom: { type: 'LineString', coordinates: [] },
                attrs: [{ seq: 0, name: 'empty' }]
            } as any
        ])
        expect(gpx).not.toContain('<trkseg>')
    })

    it('section.attrs[0].name 없으면 기본 라벨', () => {
        const gpx = createRouteGpx({ title: 'A', description: undefined }, [
            {
                geom: { type: 'LineString', coordinates: [[127, 37, 0]] },
                attrs: []
            } as any
        ])
        expect(gpx).toContain('<sectionName>구간 1</sectionName>')
    })

    it('XML 특수문자 escape (&, <, >, ", \')', () => {
        const gpx = createRouteGpx({ title: '<A&B "C\'D>', description: undefined }, [])
        expect(gpx).toContain('&lt;A&amp;B &quot;C&apos;D&gt;')
    })
})

describe('toGpxFileName()', () => {
    it('빈/undefined 제목은 기본 파일명', () => {
        expect(toGpxFileName()).toBe('route-draft.gpx')
        expect(toGpxFileName('')).toBe('route-draft.gpx')
    })

    it('공백/특수문자는 - 로 치환 (연속 치환 가능)', () => {
        // ":" 가 "-" 으로 치환된 뒤 " " 도 "-" 으로 치환되므로 연속 "-" 발생
        expect(toGpxFileName('My Route: A/B')).toBe('My-Route--A-B.gpx')
    })

    it('파일시스템 금지 문자 모두 치환', () => {
        expect(toGpxFileName('a\\b/c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j.gpx')
    })

    it('치환 후 비면 기본 파일명', () => {
        expect(toGpxFileName('   ')).toBe('route-draft.gpx')
    })
})
