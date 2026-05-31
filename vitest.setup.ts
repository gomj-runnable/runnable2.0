import { ref, computed as vueComputed, watch as vueWatch } from 'vue'
import { vi } from 'vitest'

// 테스트 환경에선 .env 가 로드되지 않으므로 DB 모드를 PGLITE 로 보강한다.
// (getDbMode() 가 USE_DATABASE_MODE 미설정 시 throw 하므로)
process.env.DATABASE_MODE ??= 'PGLITE'
process.env.ENVIRONMENT_MODE ??= 'DEVELOP'

// Nuxt auto-import인 useState를 Vue의 ref로 대체한다.
// 각 테스트 파일에서 store composable을 직접 호출할 수 있게 해준다.
// init 결과를 T 로 캐스팅해 호출부에서 Ref<T | undefined> 가 아닌 Ref<T> 가 되도록 함.
vi.stubGlobal('useState', <T>(_key: string, init?: () => T) =>
    ref(init ? (init() as T) : (undefined as unknown as T))
)
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
vi.stubGlobal(
    'getRequestURL',
    (event: any) => new URL(event?.path ?? event?.url ?? '/', 'http://localhost')
)
vi.stubGlobal('useRuntimeConfig', () => ({ public: {} }))

// h3 모듈을 직접 import 하는 server/utils/error.ts 등에 동일 stub 적용.
vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return {
        ...actual,
        createError: (opts: { statusCode: number; message?: string; statusMessage?: string }) =>
            new H3Error(opts),
        getRouterParam: (event: any, name: string) => event?.context?.params?.[name],
        getQuery: (event: any) => event?.query ?? {},
        readBody: async (event: any) => event?.body,
        defineEventHandler: <T>(fn: T) => fn,
        getRequestURL: (event: any) => new URL(event?.path ?? event?.url ?? '/', 'http://localhost')
    }
})
