import { ref, computed as vueComputed } from 'vue'
import { vi } from 'vitest'

// Nuxt auto-import인 useState를 Vue의 ref로 대체한다.
// 각 테스트 파일에서 store composable을 직접 호출할 수 있게 해준다.
vi.stubGlobal('useState', (_key: string, init?: () => any) => ref(init?.()))
vi.stubGlobal('computed', vueComputed)
