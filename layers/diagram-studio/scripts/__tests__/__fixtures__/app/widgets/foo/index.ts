import { useBar } from '~/features/bar/api/useBar'
import { useOtherWidget } from '~/widgets/alpha/index'

export function useFoo() {
    const bar = useBar()
    const other = useOtherWidget()
    return { bar, other }
}
