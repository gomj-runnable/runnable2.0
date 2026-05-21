import { ref, computed as vueComputed, watch as vueWatch } from 'vue'
import { vi } from 'vitest'

// Nuxt auto-import인 useState를 Vue의 ref로 대체한다.
// 각 테스트 파일에서 store composable을 직접 호출할 수 있게 해준다.
vi.stubGlobal('useState', (_key: string, init?: () => any) => ref(init?.()))
vi.stubGlobal('computed', vueComputed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', vueWatch)

// h3 auto-import 의 server 측 헬퍼 stub. statusCode 가 붙은 Error 를 던지는 식으로 Nitro 와 동일하게 동작.
class H3Error extends Error {
    statusCode: number
    statusMessage?: string
    constructor(opts: { statusCode: number; message?: string; statusMessage?: string }) {
        super(opts.message ?? opts.statusMessage ?? `HTTP ${opts.statusCode}`)
        this.statusCode = opts.statusCode
        this.statusMessage = opts.statusMessage ?? opts.message
        this.name = 'H3Error'
    }
}
vi.stubGlobal(
    'createError',
    (opts: { statusCode: number; message?: string; statusMessage?: string }) => new H3Error(opts)
)
vi.stubGlobal('getRouterParam', (event: any, name: string) => event?.context?.params?.[name])
vi.stubGlobal('getQuery', (event: any) => event?.query ?? {})
vi.stubGlobal('readBody', async (event: any) => event?.body)
vi.stubGlobal('defineEventHandler', <T>(fn: T) => fn)
