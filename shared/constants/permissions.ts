/**
 * 세분화된 권한 매트릭스.
 *
 * 역할(ROLES)과 권한(Permission)을 분리하여 각 역할이 보유하는 권한을 명시적으로 정의한다.
 * 상위 역할은 하위 역할의 권한을 포함하도록 ROLE_PERMISSIONS에서 누적 정의한다.
 *
 * 사용 예:
 *   hasPermission(user.role, Permission.VIEW_STATISTICS) // → true/false
 */

import { ROLES } from './roles'

export enum Permission {
    /** 관리 대시보드 페이지 접근 */
    VIEW_ADMIN_DASHBOARD = 'VIEW_ADMIN_DASHBOARD',
    /** 사용자 관리 (생성·수정·삭제) */
    MANAGE_USERS = 'MANAGE_USERS',
    /** 사용자 데이터 읽기 전용 조회 (SUPPORT 이상) */
    VIEW_USER_DATA = 'VIEW_USER_DATA',
    /** 시드 재실행 (QA 이상) */
    RUN_SEEDS = 'RUN_SEEDS',
    /** 세션 강제 종료 (QA 이상) */
    TERMINATE_SESSIONS = 'TERMINATE_SESSIONS',
    /** 공개 라우트 모더레이션 (MODERATOR 이상) */
    MODERATE_ROUTES = 'MODERATE_ROUTES',
    /** 통계 대시보드 조회 — PII 미포함 (ANALYST 이상) */
    VIEW_STATISTICS = 'VIEW_STATISTICS',
    /** 개발자 도구 / UML 접근 (DEVELOPER 전용) */
    ACCESS_DEV_TOOLS = 'ACCESS_DEV_TOOLS'
}

/**
 * 역할별 보유 권한 목록.
 * 상위 역할은 하위 역할 권한을 모두 포함한다.
 */
export const ROLE_PERMISSIONS: Record<number, Permission[]> = {
    [ROLES.USER]: [],

    [ROLES.SUPPORT]: [Permission.VIEW_USER_DATA],

    [ROLES.MODERATOR]: [Permission.VIEW_USER_DATA, Permission.MODERATE_ROUTES],

    [ROLES.QA]: [
        Permission.VIEW_USER_DATA,
        Permission.MODERATE_ROUTES,
        Permission.RUN_SEEDS,
        Permission.TERMINATE_SESSIONS
    ],

    [ROLES.ANALYST]: [
        Permission.VIEW_USER_DATA,
        Permission.MODERATE_ROUTES,
        Permission.RUN_SEEDS,
        Permission.TERMINATE_SESSIONS,
        Permission.VIEW_STATISTICS
    ],

    [ROLES.ADMIN]: [
        Permission.VIEW_USER_DATA,
        Permission.MODERATE_ROUTES,
        Permission.RUN_SEEDS,
        Permission.TERMINATE_SESSIONS,
        Permission.VIEW_STATISTICS,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.MANAGE_USERS
    ],

    [ROLES.DEVELOPER]: [
        Permission.VIEW_USER_DATA,
        Permission.MODERATE_ROUTES,
        Permission.RUN_SEEDS,
        Permission.TERMINATE_SESSIONS,
        Permission.VIEW_STATISTICS,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.MANAGE_USERS,
        Permission.ACCESS_DEV_TOOLS
    ]
}

/** 주어진 역할이 특정 권한을 보유하고 있는지 확인한다. */
export function hasPermission(role: number | null | undefined, permission: Permission): boolean {
    if (role === undefined || role === null) return false
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
