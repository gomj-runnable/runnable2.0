// vitest globalSetup — 테스트 전체에서 공유하는 단일 PostGIS 컨테이너를 기동한다.
// 연결 URI 는 provide/inject 로 각 테스트에 전달된다.
// (ProvidedContext 타입 보강은 vitest-provide.d.ts 참조)
import { startPostgisContainer, stopPostgisContainer } from './pgContainer'

interface GlobalSetupProvide {
    // eslint-disable-next-line no-unused-vars -- 함수 타입 시그니처의 파라미터 이름
    provide: (key: 'databaseUrl', value: string) => void
}

export default async function ({ provide }: GlobalSetupProvide) {
    const databaseUrl = await startPostgisContainer()
    provide('databaseUrl', databaseUrl)

    return async () => {
        await stopPostgisContainer()
    }
}
