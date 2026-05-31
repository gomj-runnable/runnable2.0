// developer/admin 권한 게이트 함수를 등록·조회하는 모듈. 실제 등록은 client-only 플러그인에서 수행한다.
// SSR 안전: 모듈 스코프 변수이므로 서버/클라이언트 각 컨텍스트에서 독립적으로 초기화된다.
// 실제 gate 등록은 client-only plugin(app/plugins/developer-gate.client.ts)에서 수행한다.
type Gate = () => Promise<boolean> | boolean

let _developerGate: Gate | null = null
let _adminGate: Gate | null = null

export function defineDeveloperGate(fn: Gate) {
    _developerGate = fn
}

export function defineAdminGate(fn: Gate) {
    _adminGate = fn
}

export async function isDeveloper(): Promise<boolean> {
    return _developerGate ? !!(await _developerGate()) : false
}

export async function isAdmin(): Promise<boolean> {
    return _adminGate ? !!(await _adminGate()) : false
}
