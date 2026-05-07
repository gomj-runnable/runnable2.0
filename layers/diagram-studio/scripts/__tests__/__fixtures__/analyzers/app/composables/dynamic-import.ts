// 동적 import — analyzer 가 dynamic import 패턴에서도 use* 호출은 인식
export async function useDynamic() {
    const mod = await import('./basic-import')
    const foo = mod.useFoo()
    return foo
}
