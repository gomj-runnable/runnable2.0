import { describe, it, expect } from 'vitest'

import type { PluginManifest } from '../types'
import { chipsForAnchor, sortChips, DEFAULT_CHIP_ANCHOR } from '../chip-anchors'

/** 테스트용 최소 chip manifest 팩토리. */
function chip(id: string, extra: Partial<PluginManifest> = {}): PluginManifest {
    return {
        id,
        label: id,
        description: '',
        slot: 'chip',
        component: {},
        defaultEnabled: true,
        ...extra
    }
}

describe('chipsForAnchor', () => {
    it('해당 앵커에 배치된 chip 만 반환한다', () => {
        // Arrange
        const plugins = [
            chip('a', { position: 'top-right' }),
            chip('b', { position: 'top-left' }),
            chip('c', { position: 'top-right' })
        ]

        // Act
        const result = chipsForAnchor(plugins, 'top-right')

        // Assert
        expect(result.map((p) => p.id)).toEqual(['a', 'c'])
    })

    it('position 미지정 chip 은 기본 앵커(top-center)로 분배된다', () => {
        // Arrange
        const plugins = [chip('a'), chip('b', { position: 'top-right' })]

        // Act & Assert
        expect(chipsForAnchor(plugins, DEFAULT_CHIP_ANCHOR).map((p) => p.id)).toEqual(['a'])
        expect(chipsForAnchor(plugins, 'top-right').map((p) => p.id)).toEqual(['b'])
    })

    it('같은 앵커 내에서 order 오름차순으로 정렬한다', () => {
        // Arrange
        const plugins = [
            chip('late', { position: 'top-right', order: 10 }),
            chip('early', { position: 'top-right', order: 1 }),
            chip('mid', { position: 'top-right', order: 5 })
        ]

        // Act
        const result = chipsForAnchor(plugins, 'top-right')

        // Assert
        expect(result.map((p) => p.id)).toEqual(['early', 'mid', 'late'])
    })

    it('order 미지정은 0 으로 취급해 명시 order 보다 앞에 온다', () => {
        // Arrange
        const plugins = [
            chip('explicit', { position: 'top-right', order: 1 }),
            chip('implicit', { position: 'top-right' })
        ]

        // Act
        const result = chipsForAnchor(plugins, 'top-right')

        // Assert
        expect(result.map((p) => p.id)).toEqual(['implicit', 'explicit'])
    })

    it('일치하는 chip 이 없으면 빈 배열을 반환한다', () => {
        // Arrange
        const plugins = [chip('a', { position: 'top-right' })]

        // Act & Assert
        expect(chipsForAnchor(plugins, 'bottom-left')).toEqual([])
    })
})

describe('sortChips', () => {
    it('원본 배열을 변경하지 않는다(불변)', () => {
        // Arrange
        const plugins = [chip('b', { order: 2 }), chip('a', { order: 1 })]

        // Act
        const sorted = sortChips(plugins)

        // Assert
        expect(sorted.map((p) => p.id)).toEqual(['a', 'b'])
        expect(plugins.map((p) => p.id)).toEqual(['b', 'a'])
    })
})
