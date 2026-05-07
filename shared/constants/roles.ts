/**
 * 사용자 권한 코드 단일 진실 공급원.
 * DB users.role 컬럼에 저장되는 정수 값과 일치한다.
 *
 * 위계: USER(1) ≤ ADMIN(50) ≤ DEVELOPER(99).
 * 위 비교(`role >= ROLES.ADMIN`)로 상위 권한이 하위 페이지에 자동 접근하도록 설계.
 *
 * TODO. DEVELOPER 권한은 다이어그램 스튜디오 dev 백도어 용도로 prod에도 살아 있다.
 *       정식 admin/role 체계 정립 시 재검토 필요.
 */
export const ROLES = {
    USER: 1,
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
