import { describe, it, expect } from 'vitest'
import { createPinIconHtml, createLabelHtml } from '../usePoiOverlay'

describe('createPinIconHtml', () => {
    it('지정된 색상으로 SVG를 생성한다', () => {
        const html = createPinIconHtml('#FF0000')
        expect(html).toContain('fill="#FF0000"')
        expect(html).toContain('<svg')
        expect(html).toContain('</svg>')
    })

    it('기본 크기는 16×20이다', () => {
        const html = createPinIconHtml('#000')
        expect(html).toContain('width="16"')
        expect(html).toContain('height="20"')
    })

    it('커스텀 크기를 지정할 수 있다', () => {
        const html = createPinIconHtml('#000', 24, 32)
        expect(html).toContain('width="24"')
        expect(html).toContain('height="32"')
    })

    it('중앙 정렬 스타일이 포함된다', () => {
        const html = createPinIconHtml('#000')
        expect(html).toContain('display:block')
        expect(html).toContain('margin:0 auto')
    })
})

describe('createLabelHtml', () => {
    it('텍스트를 포함한 div를 생성한다', () => {
        const html = createLabelHtml('테스트 라벨')
        expect(html).toContain('테스트 라벨')
        expect(html).toContain('<div')
        expect(html).toContain('</div>')
    })

    it('흰색 텍스트 + 검정 그림자 스타일이 적용된다', () => {
        const html = createLabelHtml('라벨')
        expect(html).toContain('color:#fff')
        expect(html).toContain('text-shadow')
    })

    it('줄바꿈 없이 표시된다', () => {
        const html = createLabelHtml('긴 텍스트')
        expect(html).toContain('white-space:nowrap')
    })

    it('아이콘과 4px 간격이 있다', () => {
        const html = createLabelHtml('라벨')
        expect(html).toContain('margin-top:4px')
    })
})
