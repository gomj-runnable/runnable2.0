// SSR 안전: 모듈 스코프 변수이므로 서버/클라이언트 각 컨텍스트에서 독립적으로 초기화된다.
// 실제 gate 등록은 client-only plugin(diagram-studio.client.ts)에서 수행해야 한다.
type DeveloperGate = () => Promise<boolean> | boolean

let _gate: DeveloperGate | null = null

export function defineDeveloperGate(fn: DeveloperGate) {
    _gate = fn
}

export async function isDeveloper(): Promise<boolean> {
    return _gate ? !!(await _gate()) : false
}
