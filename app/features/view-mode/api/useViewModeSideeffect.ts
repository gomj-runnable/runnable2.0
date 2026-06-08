import { watch, getCurrentScope, onScopeDispose } from 'vue'
import type { ShallowRef } from 'vue'
import type { Cartesian3 } from 'cesium'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { useViewModeStore } from '~/features/view-mode/model/useViewModeStore'

interface UseViewModeSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/** 2D 모드 수직 하향 시점 pitch (도) */
const PITCH_2D_DEG = -90
/** 3D 모드 조감 시점 pitch (도) */
const PITCH_3D_DEG = -45
/** 모드 전환 카메라 비행 시간 (초) */
const FLY_DURATION_S = 3.0
/** preRender 가드의 자세 허용 오차 (rad). 부동소수 흔들림으로 인한 매 프레임 setView 방지 */
const ATTITUDE_EPSILON = 1e-3
const TWO_PI = Math.PI * 2

/**
 * 지도 화면 모드(2D/3D)를 전환하는 sideeffect composable.
 * Cesium 정식 2D 투영이 아니라 카메라 pitch(-90° ↔ -45°) + 틸트 잠금 + preRender 가드로
 * 구현하는 "유사 2D" 방식이다. 모드 상태는 useViewModeStore가 보유하며,
 * 이 composable이 store를 watch해 카메라 전환을 수행한다 (이벤트 바인딩 없음).
 */
export const useViewModeSideeffect = (options: UseViewModeSideeffectOptions) => {
    const { viewer } = options
    const store = useViewModeStore()

    let guardViewer: CesiumViewer | null = null
    // viewer는 SPA 단일 인스턴스(useMapViewer 참조)이므로 틸트 백업은 단일 변수로 충분하다
    let savedEnableTilt = true

    /** 2D 모드에서 사용자가 시점을 기울여도 매 프레임 수직(top-down) 시점으로 되돌리는 가드 */
    const topDownGuard = () => {
        const v = guardViewer
        if (!v) return

        const CesiumLib = getCesiumRuntime()
        const targetPitch = CesiumLib.Math.toRadians(PITCH_2D_DEG)
        const { camera } = v
        // heading은 [0, 2π) 순환값이므로 0과 2π 양쪽 모두 "정북"으로 취급한다
        const headingDelta = Math.min(camera.heading, TWO_PI - camera.heading)
        if (
            Math.abs(camera.pitch - targetPitch) < ATTITUDE_EPSILON &&
            headingDelta < ATTITUDE_EPSILON
        ) {
            return
        }

        camera.setView({
            destination: CesiumLib.Cartesian3.clone(camera.positionWC),
            orientation: { heading: 0, pitch: targetPitch, roll: 0 }
        })
    }

    const enableTopDownGuard = (v: CesiumViewer) => {
        if (guardViewer === v) return
        // 단일 가드만 유지 — viewer 교체 시 기존 리스너를 먼저 해제한다
        disableTopDownGuard()
        v.scene.preRender.addEventListener(topDownGuard)
        guardViewer = v
    }

    const disableTopDownGuard = () => {
        guardViewer?.scene.preRender.removeEventListener(topDownGuard)
        guardViewer = null
    }

    /** 틸트만 잠가 평면 시점을 강제한다 (회전·줌·패닝은 허용). */
    const lockToTopDown = (v: CesiumViewer) => {
        const ctrl = v.screenSpaceCameraController
        if (!ctrl) return
        savedEnableTilt = ctrl.enableTilt
        ctrl.enableTilt = false
    }

    const unlockCamera = (v: CesiumViewer) => {
        const ctrl = v.screenSpaceCameraController
        if (!ctrl) return
        ctrl.enableTilt = savedEnableTilt
    }

    /**
     * scene.primitives의 3D 타일셋(duck-typing) 가시성을 일괄 토글한다.
     * 2D 모드에선 3D 건물 타일을 숨겨 평면 지도처럼 보이게 한다.
     */
    const setTilesetVisible = (v: CesiumViewer, visible: boolean) => {
        const primitives = v.scene.primitives
        for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives.get(i) as {
                maximumScreenSpaceError?: number
                show?: boolean
            }
            if (typeof primitive?.maximumScreenSpaceError === 'number') {
                primitive.show = visible
            }
        }
    }

    /**
     * 캔버스 중앙 픽셀에서 지표면 월드좌표와 카메라-타겟 거리를 구한다.
     * 깊이 버퍼 픽 → 지형 교차점 → 타원체 교차점 순의 3단계 폴백.
     */
    const getScreenCenterTarget = (
        v: CesiumViewer
    ): { target: Cartesian3 | null; range: number } => {
        const CesiumLib = getCesiumRuntime()
        const canvas = v.scene.canvas
        const pixel = new CesiumLib.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2)

        let target: Cartesian3 | null = null

        // 1순위: 깊이 버퍼 픽 (3D Tiles·모델 포함 정밀 위치)
        if (v.scene.pickPositionSupported) {
            const picked = v.scene.pickPosition(pixel)
            if (CesiumLib.defined(picked)) target = picked
        }

        // 2순위: 지형(terrain) 교차점
        if (!target) {
            const ray = v.camera.getPickRay(pixel)
            if (ray) {
                const picked = v.scene.globe?.pick(ray, v.scene)
                if (CesiumLib.defined(picked)) target = picked ?? null
            }
        }

        // 3순위: 타원체(지표면) 교차점
        if (!target) {
            const picked = v.camera.pickEllipsoid(pixel)
            if (CesiumLib.defined(picked)) target = picked ?? null
        }

        if (!target) return { target: null, range: 0 }
        return { target, range: CesiumLib.Cartesian3.distance(v.camera.positionWC, target) }
    }

    /** 화면 중심 타겟을 유지한 채 지정 pitch로 비행한다. 타겟 계산 실패 시 현재 위치에서 시점만 전환. */
    const flyToPitch = (v: CesiumViewer, pitchDeg: number, headingRad: number) =>
        new Promise<void>((resolve) => {
            const CesiumLib = getCesiumRuntime()
            const pitch = CesiumLib.Math.toRadians(pitchDeg)
            const { target, range } = getScreenCenterTarget(v)

            if (target) {
                v.camera.flyToBoundingSphere(new CesiumLib.BoundingSphere(target, 0), {
                    offset: new CesiumLib.HeadingPitchRange(headingRad, pitch, range),
                    duration: FLY_DURATION_S,
                    complete: resolve,
                    cancel: resolve
                })
                return
            }

            v.camera.flyTo({
                destination: CesiumLib.Cartesian3.clone(v.camera.positionWC),
                orientation: { heading: headingRad, pitch, roll: 0 },
                duration: FLY_DURATION_S,
                complete: resolve,
                cancel: resolve
            })
        })

    /** 화면 중심 타겟을 유지한 채 지정 pitch로 즉시 시점을 설정한다 (애니메이션 없음, 초기 진입용). */
    const setViewPitch = (v: CesiumViewer, pitchDeg: number, headingRad: number) => {
        const CesiumLib = getCesiumRuntime()
        v.camera.setView({
            destination: CesiumLib.Cartesian3.clone(v.camera.positionWC),
            orientation: { heading: headingRad, pitch: CesiumLib.Math.toRadians(pitchDeg), roll: 0 }
        })
    }

    /** 2D 전환 — 3D 타일 숨김 + 틸트 잠금 후 수직 하향, 완료 시 수직 시점 유지 가드 활성. */
    const switchTo2d = async (animate: boolean) => {
        const v = viewer.value
        if (!v) return

        setTilesetVisible(v, false)
        lockToTopDown(v)
        if (animate) await flyToPitch(v, PITCH_2D_DEG, 0)
        else setViewPitch(v, PITCH_2D_DEG, 0)
        enableTopDownGuard(v)
    }

    /** 3D 전환 — 가드 해제 후 조감 시점으로 이동, 완료 시 3D 타일 표시 + 카메라 컨트롤 복원. */
    const switchTo3d = async (animate: boolean) => {
        const v = viewer.value
        if (!v) return

        disableTopDownGuard()
        if (animate) await flyToPitch(v, PITCH_3D_DEG, v.camera.heading)
        else setViewPitch(v, PITCH_3D_DEG, v.camera.heading)
        setTilesetVisible(v, true)
        unlockCamera(v)
    }

    const applyMode = async (mode: typeof store.screenMode.value, animate: boolean) => {
        if (mode.is2D) await switchTo2d(animate)
        else await switchTo3d(animate)
    }

    // viewer 준비 시 현재 모드를 즉시 적용한다 (기본 2D — 애니메이션 없이 초기 시점 고정)
    watch(
        viewer,
        (v) => {
            if (v) applyMode(store.screenMode.value, false)
        },
        { immediate: true }
    )

    // 공통 컨텍스트(store) 기반 전환 — 버튼은 store만 변경하고, 카메라 제어는 여기서 반응한다
    watch(
        () => store.screenMode.value,
        async (mode, prev) => {
            if (!prev || mode.equals(prev) || !viewer.value) return

            store.setTransitioning(true)
            try {
                await applyMode(mode, true)
            } finally {
                store.setTransitioning(false)
            }
        }
    )

    if (getCurrentScope()) {
        onScopeDispose(disableTopDownGuard)
    }

    return { switchTo2d, switchTo3d }
}
