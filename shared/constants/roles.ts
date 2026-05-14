/**
 * 사용자 권한 코드 단일 진실 공급원.
 * DB users.role 컬럼에 저장되는 정수 값과 일치한다.
 *
 * 위계: USER(1) ≤ SUPPORT/QA/MODERATOR/ANALYST(10/20/30/40) ≤ ADMIN(50) ≤ DEVELOPER(99).
 * 위 비교(`role >= ROLES.ADMIN`)로 상위 권한이 하위 페이지에 자동 접근하도록 설계되어 있지만,
 * SUPPORT/QA/MODERATOR/ANALYST의 실제 권한 분기는 별도 Role × Permission 매트릭스로 관리한다
 * (#129 결정 후 #130에서 도입 예정).
 *
 * NOTE. DEVELOPER 권한은 다이어그램 스튜디오 등 dev 백도어 용도. seed 단계에서 prod 포함 모든 환경에
 *       시드되며, 자격증명 노출에 주의해 `DEVELOPER_SEED_PASSWORD` env 를 안전하게 관리한다.
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
