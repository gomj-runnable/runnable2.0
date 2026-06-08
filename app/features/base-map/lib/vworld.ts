// V-World WMTS 타일 URL 빌더.
import type { BaseMapKey } from '#shared/types/base-map.enum'

/** V-World WMTS 레이어별 타일 종류·확장자 */
const VWORLD_LAYER_CONFIG: Record<BaseMapKey, { layer: string; ext: string }> = {
    satellite: { layer: 'Satellite', ext: 'jpeg' },
    base: { layer: 'Base', ext: 'png' }
}

/** V-World 타일 최대 줌 레벨 */
export const VWORLD_MAX_LEVEL = 18

/**
 * V-World WMTS 타일 URL 템플릿을 만든다. ({z}/{y}/{x}는 Cesium이 치환)
 * @param kind 베이스맵 종류 (위성영상/기본지도)
 * @param key V-World API 키
 */
export const buildVworldUrl = (kind: BaseMapKey, key: string): string => {
    const { layer, ext } = VWORLD_LAYER_CONFIG[kind]
    return `https://api.vworld.kr/req/wmts/1.0.0/${key}/${layer}/{z}/{y}/{x}.${ext}`
}
