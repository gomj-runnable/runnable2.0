import type { ChipAnchor, PluginManifest } from './types'

/** position 미지정 chip 의 기본 앵커. */
export const DEFAULT_CHIP_ANCHOR: ChipAnchor = 'top-center'

/** chip 플러그인을 order 오름차순으로 정렬한다(미지정은 0). 원본 배열은 변경하지 않는다. */
export function sortChips(plugins: PluginManifest[]): PluginManifest[] {
    return plugins.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/** 주어진 앵커에 배치될 chip 플러그인을 정렬된 순서로 반환한다. */
export function chipsForAnchor(plugins: PluginManifest[], anchor: ChipAnchor): PluginManifest[] {
    return sortChips(plugins.filter((p) => (p.position ?? DEFAULT_CHIP_ANCHOR) === anchor))
}
