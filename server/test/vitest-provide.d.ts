// vitest 의 provide/inject 키 타입 보강.
// globalSetup 이 제공하는 databaseUrl 을 각 테스트의 inject('databaseUrl') 에서
// 타입 안전하게 사용하기 위한 모듈 보강이다.
import 'vitest'

declare module 'vitest' {
    interface ProvidedContext {
        databaseUrl: string
    }
}
