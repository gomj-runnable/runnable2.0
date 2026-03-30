/**
 * 사용자 역할 레벨
 * - 숫자가 높을수록 상위 권한
 * - 중간 값 배정으로 새 역할 추가 가능 (DB 마이그레이션 불필요)
 * - 1  : 일반 회원
 * - 10 : 관리자
 */

export const ROLES = {
  MEMBER: 1,
  ADMIN: 10
} as const
