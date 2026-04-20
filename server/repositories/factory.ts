import { isMemoryMode } from '../utils/config'

/**
 * 실행 환경에 따라 메모리 또는 DB 구현체를 선택하는 제네릭 리포지토리 팩토리.
 * 새로운 도메인 리포지토리가 추가될 때 동일한 분기 로직을 반복하지 않도록 한다.
 *
 * @param memoryImpl - 인메모리 구현체 (테스트·프로토타입용)
 * @param drizzleImpl - Drizzle DB 구현체 (프로덕션용)
 * @returns 환경 설정에 따라 선택된 구현체
 */
export function createRepository<T>(memoryImpl: T, drizzleImpl: T): T {
    return isMemoryMode ? memoryImpl : drizzleImpl
}
