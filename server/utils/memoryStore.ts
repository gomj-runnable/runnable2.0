/** MEMORY 모드 전용 인메모리 피드백 저장소. GET/POST 핸들러가 공유한다. */
export const memoryFeedbacks: Record<string, unknown>[] = []

/** MEMORY 모드 전용 인메모리 사용자 저장소. auth 핸들러와 session 유틸이 공유한다. */
export const memoryUsers = new Map<
    string,
    { id: string; name: string; email: string; password: string }
>()

// 기본 DEV_USER 등록
// NOTE: MEMORY 모드는 개발 전용이므로 평문 비밀번호를 사용한다.
// 프로덕션 모드에서는 better-auth + DB 기반 인증을 사용하며 이 저장소는 활성화되지 않는다.
memoryUsers.set('dev@localhost', {
    id: 'dev-user',
    name: 'Dev User',
    email: 'dev@localhost',
    password: '!runnable2242'
})
