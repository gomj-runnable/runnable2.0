import type { ShallowRef } from 'vue'
import type { Cartesian3 } from 'cesium'
import type { CesiumViewer } from '~/shared/lib/useWindow'

/** 기본 POI DTO */
export interface PoiDto {
    id: string
    lon: number
    lat: number
    name: string
    descript: string
}

interface PoiEntry<T> {
    dto: T
    el: HTMLDivElement
    position: Cartesian3
}

export interface PoiOverlayOptions<T extends { id: string } = PoiDto> {
    /** DTO → Cesium Cartesian3 변환 (기본: fromDegrees(dto.lon, dto.lat)) */
    toPosition?: (dto: T) => Cartesian3
    /** DTO → 아이콘 HTML (기본: 핀 SVG) */
    renderIcon?: (dto: T) => string
    /** DTO → 라벨 HTML (기본: name 텍스트) */
    renderLabel?: (dto: T) => string
    /** 아이콘 높이 px — transform 오프셋 계산에 사용 (기본 20) */
    iconHeight?: number
    /** POI 클릭 시 콜백 */
    onClick?: (dto: T) => void
    /** 기본 아이콘의 색상 결정 함수 (기본 '#2196F3'). renderIcon 커스텀 시 무시됨 */
    colorResolver?: (dto: T) => string
}

// ─── 기본 렌더러 ────────────────────────────────────────────────────

const DEFAULT_ICON_HEIGHT = 20

/** 기본 핀 SVG 아이콘 HTML을 반환한다 */
export const createPinIconHtml = (color: string, width = 16, height = 20): string =>
    `<svg style="display:block;margin:0 auto" width="${width}" height="${height}" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M8 0C3.6 0 0 3.6 0 8c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" fill="${color}"/>` +
    '<circle cx="8" cy="8" r="3" fill="white" fill-opacity="0.9"/>' +
    '</svg>'

/** 기본 라벨 HTML을 반환한다 */
export const createLabelHtml = (text: string): string =>
    `<div style="margin-top:4px;font:11px/1 sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap;">${text}</div>`

// ─── Composable ─────────────────────────────────────────────────

/**
 * HTML Overlay 방식의 POI 렌더러.
 * Cesium Entity 대신 DOM 요소를 scene.preRender마다 화면 좌표로 배치한다.
 *
 * @typeParam T - POI 데이터 타입 (최소 `{ id: string }` 필요)
 *
 * @example 기본 사용 (PoiDto)
 * ```ts
 * const overlay = usePoiOverlay(viewer, { onClick: (dto) => console.log(dto) })
 * overlay.showPoi({ id: '1', lon: 127, lat: 37, name: '음수대', descript: '' })
 * ```
 *
 * @example 커스텀 DTO + 렌더러
 * ```ts
 * interface MyMarker { id: string; x: number; y: number; label: string }
 * const overlay = usePoiOverlay<MyMarker>(viewer, {
 *     toPosition: (d) => Cesium.Cartesian3.fromDegrees(d.x, d.y),
 *     renderIcon: (d) => '<img src="marker.png" width="24" height="24"/>',
 *     renderLabel: (d) => `<span>${d.label}</span>`,
 *     iconHeight: 24,
 * })
 * ```
 */
export const usePoiOverlay = <T extends { id: string } = PoiDto>(
    viewer: ShallowRef<CesiumViewer | null>,
    options: PoiOverlayOptions<T> = {} as PoiOverlayOptions<T>
) => {
    const poiMap = new Map<string, PoiEntry<T>>()
    let container: HTMLDivElement | null = null
    let removeListener: (() => void) | null = null

    const iconHeight = options.iconHeight ?? DEFAULT_ICON_HEIGHT
    const colorResolver = options.colorResolver ?? (() => '#2196F3')

    const toPosition =
        options.toPosition ??
        ((dto: T) => {
            const d = dto as unknown as PoiDto
            return window.Cesium.Cartesian3.fromDegrees(d.lon, d.lat)
        })

    const renderIcon = options.renderIcon ?? ((dto: T) => createPinIconHtml(colorResolver(dto)))

    const renderLabel =
        options.renderLabel ?? ((dto: T) => createLabelHtml((dto as unknown as PoiDto).name))

    const ensureContainer = (v: CesiumViewer) => {
        if (container) return container

        container = document.createElement('div')
        container.style.cssText =
            'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;'
        ;(v.container as HTMLElement).appendChild(container)
        return container
    }

    const createPoiElement = (dto: T): HTMLDivElement => {
        const el = document.createElement('div')
        el.style.cssText = `position:absolute;text-align:center;transform:translate(-50%,-${iconHeight}px);pointer-events:auto;cursor:pointer;`
        el.dataset.poiId = dto.id
        el.innerHTML = renderIcon(dto) + renderLabel(dto)
        return el
    }

    const updatePositions = () => {
        const v = viewer.value
        if (!v || poiMap.size === 0) return

        const scene = v.scene

        for (const entry of poiMap.values()) {
            const windowPos = window.Cesium.SceneTransforms.worldToWindowCoordinates(
                scene,
                entry.position
            )

            if (!windowPos) {
                entry.el.style.display = 'none'
                continue
            }

            entry.el.style.display = ''
            entry.el.style.left = `${windowPos.x}px`
            entry.el.style.top = `${windowPos.y}px`
        }
    }

    const startListening = (v: CesiumViewer) => {
        if (removeListener) return
        removeListener = v.scene.preRender.addEventListener(updatePositions)
    }

    const stopListening = () => {
        removeListener?.()
        removeListener = null
    }

    const showPoi = (dto: T) => {
        const v = viewer.value
        if (!v) return

        if (poiMap.has(dto.id)) unshowPoi(dto)

        ensureContainer(v)
        startListening(v)

        const position = toPosition(dto)
        const el = createPoiElement(dto)

        el.addEventListener('click', () => options.onClick?.(dto))
        container!.appendChild(el)
        poiMap.set(dto.id, { dto, el, position })
    }

    const unshowPoi = (dto: Pick<T, 'id'>) => {
        const entry = poiMap.get(dto.id)
        if (!entry) return

        entry.el.remove()
        poiMap.delete(dto.id)

        if (poiMap.size === 0) stopListening()
    }

    const clear = () => {
        for (const entry of poiMap.values()) {
            entry.el.remove()
        }
        poiMap.clear()
        stopListening()
    }

    onBeforeUnmount(() => {
        clear()
        container?.remove()
        container = null
    })

    return { showPoi, unshowPoi, clear }
}
