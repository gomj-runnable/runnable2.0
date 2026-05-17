/**
 * 사용자 권한 코드 단일 진실 공급원.
 * DB users.role 컬럼에 저장되는 정수 값과 일치한다.
 *
 * 위계: USER(1) ≤ SUPPORT(10) ≤ MODERATOR(25) ≤ QA(35) ≤ ANALYST(40) ≤ ADMIN(50) ≤ DEVELOPER(99).
 * 위 비교(`role >= ROLES.ADMIN`)로 상위 권한이 하위 페이지에 자동 접근하도록 설계.
 *
 * NOTE. DEVELOPER 권한은 다이어그램 스튜디오 등 dev 백도어 용도. seed 단계에서 prod 포함 모든 환경에
 *       시드되며, 자격증명 노출에 주의해 `DEVELOPER_SEED_PASSWORD` env 를 안전하게 관리한다.
 * TODO. 정식 admin/role 체계 정립 시 ROLES.DEVELOPER 자체 제거 검토.
 */
export const ROLES = {
    USER: 1,
    SUPPORT: 10,
    MODERATOR: 25,
    QA: 35,
    ANALYST: 40,
    ADMIN: 50,
    DEVELOPER: 99
} as const

export type RoleCode = (typeof ROLES)[keyof typeof ROLES]

/** 역할 코드 → 표시 이름 매핑. */
const ROLE_NAMES: Record<number, string> = {
    [ROLES.USER]: '사용자',
    [ROLES.SUPPORT]: '지원',
    [ROLES.MODERATOR]: '모더레이터',
    [ROLES.QA]: 'QA',
    [ROLES.ANALYST]: '분석가',
    [ROLES.ADMIN]: '관리자',
    [ROLES.DEVELOPER]: '개발자'
}

/** 역할 코드에 해당하는 표시 이름을 반환한다. 알 수 없는 값은 '알 수 없음' 반환. */
export function getRoleName(role: number): string {
    return ROLE_NAMES[role] ?? '알 수 없음'
}

/** 모든 역할 목록 (역할 코드 오름차순). */
export const ALL_ROLES = Object.values(ROLES) as RoleCode[]
