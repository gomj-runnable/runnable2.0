import { useBaz } from '~/entities/baz/model/useBaz'

export function useBar() {
    useBaz()
    return { data: null }
}
