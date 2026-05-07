/**
 * 사용자 권한 코드 단일 진실 공급원.
 * DB users.role 컬럼에 저장되는 정수 값과 일치한다.
 *
 * TODO. DEVELOPER 권한은 다이어그램 스튜디오 dev 백도어 용도로 prod에도 살아 있다.
 *       정식 admin/role 체계 정립 시 재검토 필요.
 */
export const ROLES = {
    USER: 1,
    DEVELOPER: 99
} as const

export type RoleCode = (typeof ROLES)[keyof typeof ROLES]
