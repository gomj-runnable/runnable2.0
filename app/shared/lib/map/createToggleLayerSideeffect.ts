// 반응형 소스를 watch해 레이어를 켜고 끄는 sideeffect 팩토리.
import type { WatchSource } from 'vue'

interface ToggleLayerOptions<T = boolean> {
    source: WatchSource<T> | WatchSource[]
    condition?: (value: T) => boolean
    apply: () => void
    remove: () => void
    cleanup?: () => void
}

/** source 값 변경 시 condition에 따라 apply/remove를 호출하고, 언마운트 시 cleanup하는 sideeffect를 생성한다. */
export const createToggleLayerSideeffect = <T = boolean>(options: ToggleLayerOptions<T>) => {
    const init = () => {
        const stopWatch = watch(
            options.source as WatchSource<T>,
            (value) => {
                const active = options.condition ? options.condition(value) : Boolean(value)
                if (active) options.apply()
                else options.remove()
            },
            { immediate: true }
        )
        onBeforeUnmount(() => {
            stopWatch()
            options.cleanup?.()
        })
    }
    return { init }
}
