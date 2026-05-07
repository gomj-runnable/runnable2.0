import type { SavedRouteInfo } from '../repositories/routeInfo.repository'
import { ROLES } from '../../shared/constants/roles'

/** MEMORY 모드 전용 인메모리 경로정보 저장소. GET/POST 핸들러가 공유한다. */
export const memoryRouteInfos: SavedRouteInfo[] = []

/** MEMORY 모드 전용 인메모리 사용자 저장소. auth 핸들러와 session 유틸이 공유한다. */
export const memoryUsers = new Map<
    string,
    { id: string; name: string; email: string; password: string; role?: number }
>()

/** MEMORY 모드 전용 세션 토큰 → userId 매핑. auth 핸들러와 session 유틸이 공유한다. */
export const memorySessions = new Map<string, string>()

// 기본 DEV_USER 등록
// NOTE: MEMORY 모드는 개발 전용이므로 평문 비밀번호를 사용한다.
// 프로덕션 모드에서는 better-auth + DB 기반 인증을 사용하며 이 저장소는 활성화되지 않는다.
const devPassword = process.env.ADMIN_SEED_PASSWORD
if (!devPassword) {
    console.error('ADMIN_SEED_PASSWORD env var is required.')
    process.exit(1)
}
memoryUsers.set('dev@localhost', {
    id: 'dev-user',
    name: 'Dev User',
    email: 'dev@localhost',
    password: devPassword
})

/** MEMORY 모드 자동 로그인 계정. /get-session 호출 시 쿠키가 없으면 이 계정으로 세션을 발급한다. */
export const MEMORY_AUTO_LOGIN_EMAIL = 'root@runnable.com'
memoryUsers.set(MEMORY_AUTO_LOGIN_EMAIL, {
    id: 'root-user',
    name: 'Root',
    email: MEMORY_AUTO_LOGIN_EMAIL,
    password: 'root1234'
})

// admin 시드 계정 (ROLES.ADMIN). MEMORY 모드 dev 환경에서 운영자 권한을 검증하기 위함.
memoryUsers.set('admin@runnable.com', {
    id: 'admin-role-user',
    name: 'admin',
    email: 'admin@runnable.com',
    password: devPassword,
    role: ROLES.ADMIN
})

// TODO. 다이어그램 스튜디오 dev 백도어 — prod에서도 살아 있다 (seed.ts와 동일 정책).
//       정식 권한 체계 정립 시 이 엔트리와 ROLES.DEVELOPER 자체 제거 검토.
const developerPassword = process.env.DEVELOPER_SEED_PASSWORD
if (!developerPassword) {
    console.error('DEVELOPER_SEED_PASSWORD env var is required.')
    process.exit(1)
}
memoryUsers.set('developer@runnable.com', {
    id: 'developer-user',
    name: 'developer',
    email: 'developer@runnable.com',
    password: developerPassword,
    role: ROLES.DEVELOPER
})
