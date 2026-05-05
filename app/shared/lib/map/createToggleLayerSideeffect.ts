import type { WatchSource } from 'vue'

interface ToggleLayerOptions<T = boolean> {
    source: WatchSource<T> | WatchSource[]
    condition?: (value: T) => boolean
    apply: () => void
    remove: () => void
    cleanup?: () => void
}

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
