/**
 * 매트릭스 기반 권한 시스템.
 *
 * 역할(ROLES)과 권한(Permission)을 분리하여 각 역할이 보유하는 권한을 명시적으로 정의한다.
 * 상위 역할이 하위 역할의 권한을 자동 상속하지 않는다 — 각 역할에 필요한 권한만 명시.
 *
 * 사용 예:
 *   hasPermission(user.role, Permission.VIEW_ADMIN_PAGE) // → true/false
 *   can(user.role, Permission.VIEW_DEV_PAGE)             // 동일 (단축)
 *
 * 의도된 행동 변화 (#129/#130 결정):
 *   - DEVELOPER 는 /admin 진입 가능 (VIEW_ADMIN_PAGE 있음)
 */

import { ROLES } from './roles'

export enum Permission {
    /** /admin 페이지 접근 */
    VIEW_ADMIN_PAGE = 'VIEW_ADMIN_PAGE',
    /** 개발 도구 접근 */
    VIEW_DEV_PAGE = 'VIEW_DEV_PAGE',
    /** 통계 대시보드 조회 — PII 미포함 */
    VIEW_STATS_DASHBOARD = 'VIEW_STATS_DASHBOARD',
    /** 사용자 데이터 읽기 (PII 포함) */
    READ_USER_DATA = 'READ_USER_DATA',
    /** 사용자 데이터 읽기 (익명화) */
    READ_USER_DATA_ANON = 'READ_USER_DATA_ANON',
    /** 사용자 데이터 쓰기 (생성·수정·삭제) */
    WRITE_USER_DATA = 'WRITE_USER_DATA',
    /** 공개 라우트 모더레이션 */
    MODERATE_PUBLIC_ROUTE = 'MODERATE_PUBLIC_ROUTE',
    /** 시드 재실행 */
    RESEED_DATABASE = 'RESEED_DATABASE',
    /** 역할 관리 (부여·변경) */
    MANAGE_ROLES = 'MANAGE_ROLES'
}

/**
 * 역할별 보유 권한 목록.
 * 매트릭스 방식: 각 역할에 필요한 권한만 명시적으로 나열.
 */
export const ROLE_PERMISSIONS: Record<number, Permission[]> = {
    [ROLES.USER]: [],

    [ROLES.SUPPORT]: [Permission.READ_USER_DATA_ANON],

    [ROLES.MODERATOR]: [Permission.READ_USER_DATA_ANON, Permission.MODERATE_PUBLIC_ROUTE],

    [ROLES.QA]: [
        Permission.READ_USER_DATA_ANON,
        Permission.MODERATE_PUBLIC_ROUTE,
        Permission.RESEED_DATABASE,
        Permission.VIEW_DEV_PAGE
    ],

    [ROLES.ANALYST]: [Permission.READ_USER_DATA_ANON, Permission.VIEW_STATS_DASHBOARD],

    [ROLES.ADMIN]: [
        Permission.VIEW_ADMIN_PAGE,
        Permission.VIEW_STATS_DASHBOARD,
        Permission.READ_USER_DATA,
        Permission.READ_USER_DATA_ANON,
        Permission.WRITE_USER_DATA,
        Permission.MODERATE_PUBLIC_ROUTE,
        Permission.RESEED_DATABASE,
        Permission.MANAGE_ROLES
    ],

    [ROLES.DEVELOPER]: [
        Permission.VIEW_ADMIN_PAGE,
        Permission.VIEW_DEV_PAGE,
        Permission.VIEW_STATS_DASHBOARD,
        Permission.READ_USER_DATA_ANON,
        Permission.RESEED_DATABASE
    ]
}

/** 주어진 역할이 특정 권한을 보유하고 있는지 확인한다. */
export function hasPermission(role: number | null | undefined, permission: Permission): boolean {
    if (role === undefined || role === null) return false
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/** hasPermission 단축 함수. */
export function can(role: number | null | undefined, permission: Permission): boolean {
    return hasPermission(role, permission)
}
