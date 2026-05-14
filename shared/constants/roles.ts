/**
 * 사용자 권한 코드 단일 진실 공급원.
 * DB users.role 컬럼에 저장되는 정수 값과 일치한다.
 *
 * 위계: USER(1) ≤ SUPPORT(10) ≤ QA(20) ≤ MODERATOR(30) ≤ ANALYST(40) ≤ ADMIN(50) ≤ DEVELOPER(99).
 * SUPPORT~ANALYST 의 실질 권한은 별도 Permission 매트릭스로 관리 (#129, #130 예정).
 * numeric 값은 임시 배정이며 매트릭스 도입 후 재설계 가능.
 *
 * NOTE. DEVELOPER 권한은 다이어그램 스튜디오 dev 백도어 용도. seed 단계에서 prod 환경에는 시드되지
 *       않도록 차단되어 있다 (`server/database/seed.ts` 의 NODE_ENV 가드 참고).
 * TODO. 정식 admin/role 체계 정립 시 ROLES.DEVELOPER 자체 제거 검토.
 */
export const ROLES = {
    USER: 1,
    SUPPORT: 10,
    QA: 20,
    MODERATOR: 30,
    ANALYST: 40,
    ADMIN: 50,
    DEVELOPER: 99
} as const

export type RoleCode = (typeof ROLES)[keyof typeof ROLES]

/** 관리자 이상 권한 보유 여부 (ADMIN/DEVELOPER 모두 true). */
export function hasAdminAccess(role?: number | null): boolean {
    return role !== undefined && role !== null && role >= ROLES.ADMIN
}

/** 개발자 권한 보유 여부 (DEVELOPER 만 true). */
export function hasDeveloperAccess(role?: number | null): boolean {
    return role !== undefined && role !== null && role >= ROLES.DEVELOPER
}
