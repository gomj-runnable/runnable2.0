// 기본 named import + composable 호출
import { useFoo } from './foo'

export function useBasic() {
    const foo = useFoo()
    return { foo }
}

export function useFoo() {
    return { value: 1 }
}
