import { computed, isRef, useFetch } from '#imports'
import type { Ref, ComputedRef } from 'vue'
import type { DiagramJSON } from '../../runtime/types'

export function useDiagramData(path: string | Ref<string> | ComputedRef<string>) {
    const key = computed(() => `diagram-${isRef(path) ? path.value : path}`)

    const { data, pending, error, refresh } = useFetch<DiagramJSON>(path as string, {
        key: key.value,
        watch: [key],
        server: false
    })

    return { data, pending, error, refresh }
}
