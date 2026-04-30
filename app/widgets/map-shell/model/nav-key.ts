/** 사이드바 네비게이션 키 상수. Nav Rail과 SlideOver가 공유한다. */
export const NavKey = {
    LIST: '목록',
    DRAW: '그리기',
    EXPLORE: '탐색',
    AUTH: '로그인'
} as const

export type NavKeyValue = (typeof NavKey)[keyof typeof NavKey]
