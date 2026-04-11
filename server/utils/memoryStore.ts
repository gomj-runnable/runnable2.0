/** MEMORY 모드 전용 인메모리 사용자 저장소. auth 핸들러와 session 유틸이 공유한다. */
export const memoryUsers = new Map<
    string,
    { id: string; name: string; email: string; password: string }
>()

// 기본 DEV_USER 등록
memoryUsers.set('dev@localhost', {
    id: 'dev-user',
    name: 'Dev User',
    email: 'dev@localhost',
    password: '!runnable2242'
})
