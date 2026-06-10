import { watch, getCurrentScope, onScopeDispose } from 'vue'
import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { GraphicQualityEnum } from '#shared/types/graphic-quality.enum'
import type { FixedQualityKey } from '#shared/types/graphic-quality.enum'
import { useGraphicQualityStore } from '~/features/graphic-quality/model/useGraphicQualityStore'

interface UseGraphicQualitySideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/** 품질 레벨별 Cesium 렌더링 부하 조절 값 */
interface QualityPreset {
    /** 화면 변화가 있을 때만 렌더링(온디맨드). 가장 큰 성능 향상 요소 */
    requestRenderMode: boolean
    /** requestRenderMode와 짝. Infinity면 시간 경과만으로는 재렌더하지 않는다 */
    maximumRenderTimeChange: number
    /** 렌더 해상도 배율. 낮을수록 처리 픽셀 수 감소 */
    resolutionScale: number
    /** MSAA 안티앨리어싱 샘플 수 (1 = 사실상 off) */
    msaaSamples: number
    /** FXAA 후처리 안티앨리어싱 */
    fxaa: boolean
    /** 그림자. 매우 무거우므로 전 레벨 off */
    shadows: boolean
    /** 3D 타일셋 화면 공간 오차. 클수록 낮은 LOD 사용 → 성능 향상 */
    tilesetMaximumScreenSpaceError: number
}

const QUALITY_PRESETS: Record<FixedQualityKey, QualityPreset> = {
    low: {
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        resolutionScale: 0.7,
        msaaSamples: 1,
        fxaa: false,
        shadows: false,
        tilesetMaximumScreenSpaceError: 16
    },
    medium: {
        requestRenderMode: false,
        maximumRenderTimeChange: 0,
        resolutionScale: 0.9,
        msaaSamples: 2,
        fxaa: false,
        shadows: false,
        tilesetMaximumScreenSpaceError: 8
    },
    high: {
        requestRenderMode: false,
        maximumRenderTimeChange: 0,
        resolutionScale: 1.0,
        msaaSamples: 4,
        fxaa: true,
        shadows: false,
        // 0 = 항상 최고 LOD. useMapInit의 타일셋 생성 기본값과 동일하게 유지한다
        tilesetMaximumScreenSpaceError: 0
    }
}

/** 자동 품질 조정 주기 (ms) */
const AUTO_ADJUST_INTERVAL_MS = 5000
/** FPS 집계 윈도우 (ms) */
const FPS_SAMPLE_WINDOW_MS = 1000
const FPS_LOW_THRESHOLD = 15
const FPS_MEDIUM_THRESHOLD = 40
const FPS_HIGH_THRESHOLD = 60

/**
 * 평균 FPS로 적용할 품질 레벨을 결정한다.
 * 15~40 구간은 null을 반환해 현재 레벨을 유지한다 (잦은 레벨 변경 방지).
 */
export const decideAutoLevel = (avgFps: number): FixedQualityKey | null => {
    if (avgFps < FPS_LOW_THRESHOLD) return 'low'
    if (avgFps > FPS_HIGH_THRESHOLD) return 'high'
    if (avgFps > FPS_MEDIUM_THRESHOLD) return 'medium'
    return null
}

/**
 * 그래픽 품질 프리셋을 Cesium viewer에 적용하는 sideeffect composable.
 * 자동 모드에선 scene.postRender로 실측 FPS를 집계해 5초 주기로 품질을 자동 상·하향한다.
 * 품질 레벨 상태는 useGraphicQualityStore가 보유하며, 이 composable이 store를 watch해 적용한다.
 */
export const useGraphicQualitySideeffect = (options: UseGraphicQualitySideeffectOptions) => {
    const { viewer } = options
    const store = useGraphicQualityStore()

    let frameCount = 0
    let lastTime: number | null = null
    let totalFps = 0
    let fpsCount = 0
    let autoTimer: ReturnType<typeof setInterval> | null = null
    let measuringViewer: CesiumViewer | null = null

    /** scene.postRender마다 호출되어 1초 윈도우 단위로 FPS를 집계한다. */
    const measureFps = () => {
        const now = performance.now()
        if (lastTime === null) {
            lastTime = now
            frameCount = 0
            return
        }

        frameCount++
        const elapsed = now - lastTime
        if (elapsed >= FPS_SAMPLE_WINDOW_MS) {
            totalFps += (frameCount * 1000) / elapsed
            fpsCount++
            frameCount = 0
            lastTime = now
        }
    }

    /** appliedLevel은 고정 레벨만 보유하지만, 타입상 auto 가능성은 high로 흡수한다. */
    const toFixedKey = (level: GraphicQualityEnum): FixedQualityKey =>
        level.isAuto ? 'high' : (level.key as FixedQualityKey)

    /** scene.primitives에서 3D 타일셋(duck-typing)을 찾아 화면 공간 오차를 적용한다. */
    const applyTilesetSse = (v: CesiumViewer, sse: number) => {
        const primitives = v.scene.primitives
        for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives.get(i) as { maximumScreenSpaceError?: number }
            if (typeof primitive?.maximumScreenSpaceError === 'number') {
                primitive.maximumScreenSpaceError = sse
            }
        }
    }

    /**
     * 품질 프리셋을 viewer에 적용한다.
     * 자동 모드에선 forceContinuousRender로 온디맨드 렌더를 끈다 —
     * requestRenderMode가 켜지면 정지 화면에서 postRender가 발생하지 않아 FPS가 0으로 오측정되기 때문.
     */
    const applyPreset = (
        key: FixedQualityKey,
        applyOptions: { forceContinuousRender?: boolean } = {}
    ) => {
        const v = viewer.value
        if (!v) return

        const preset = QUALITY_PRESETS[key]
        const requestRenderMode = applyOptions.forceContinuousRender
            ? false
            : preset.requestRenderMode

        v.scene.requestRenderMode = requestRenderMode
        v.scene.maximumRenderTimeChange = requestRenderMode ? preset.maximumRenderTimeChange : 0
        v.resolutionScale = preset.resolutionScale
        v.scene.msaaSamples = preset.msaaSamples
        v.scene.postProcessStages.fxaa.enabled = preset.fxaa
        v.shadows = preset.shadows
        applyTilesetSse(v, preset.tilesetMaximumScreenSpaceError)

        store.setAppliedLevel(GraphicQualityEnum.from(key))
    }

    const attachFpsMeasure = () => {
        const v = viewer.value
        if (!v || measuringViewer === v) return

        // 단일 측정기만 유지 — viewer 교체 시 기존 리스너를 먼저 해제한다
        detachFpsMeasure()
        frameCount = 0
        lastTime = null
        totalFps = 0
        fpsCount = 0
        v.scene.postRender.addEventListener(measureFps)
        measuringViewer = v
    }

    const detachFpsMeasure = () => {
        measuringViewer?.scene.postRender.removeEventListener(measureFps)
        measuringViewer = null
    }

    /** 5초 주기로 평균 FPS를 평가해 필요 시 품질 레벨을 변경한다. */
    const autoAdjust = () => {
        if (fpsCount === 0) return

        const avgFps = totalFps / fpsCount
        totalFps = 0
        fpsCount = 0

        const next = decideAutoLevel(avgFps)
        if (!next || toFixedKey(store.appliedLevel.value) === next) return
        applyPreset(next, { forceContinuousRender: true })
    }

    const startAutoMode = () => {
        attachFpsMeasure()
        if (autoTimer === null) {
            autoTimer = setInterval(autoAdjust, AUTO_ADJUST_INTERVAL_MS)
        }
    }

    const stopAutoMode = () => {
        if (autoTimer !== null) {
            clearInterval(autoTimer)
            autoTimer = null
        }
        detachFpsMeasure()
    }

    /** 선택된 품질 레벨을 적용한다. auto면 측정·조정 루프를 시작하고, 고정 레벨이면 루프를 중단한다. */
    const applyQuality = (level: GraphicQualityEnum) => {
        if (level.isAuto) {
            startAutoMode()
            applyPreset(toFixedKey(store.appliedLevel.value), { forceContinuousRender: true })
            return
        }

        stopAutoMode()
        applyPreset(toFixedKey(level))
    }

    // 공통 컨텍스트(store) 기반 적용 — 레벨 변경·viewer 준비 시 자동 반영
    watch(
        [viewer, () => store.level.value] as const,
        ([v, level]) => {
            if (!v) return
            applyQuality(level)
        },
        { immediate: true }
    )

    if (getCurrentScope()) {
        onScopeDispose(stopAutoMode)
    }

    return { applyQuality, stopAutoMode }
}
