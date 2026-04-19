/**
 * 경로정보 관련 순수 계산 유틸리티.
 * 공유 링크 생성, 경로정보 표시 포맷팅 등을 담당한다.
 */
export const useRouteInfoAction = () => {
    /** 경로 공유 링크를 생성한다 */
    const generateShareLink = (routeId: string): string => {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        return `${origin}/share/${routeId}`
    }

    /** 경로정보 생성 시각을 상대적 텍스트로 포맷한다 */
    const formatRelativeTime = (dateStr: string): string => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMin = Math.floor(diffMs / 60_000)
        const diffHour = Math.floor(diffMs / 3_600_000)
        const diffDay = Math.floor(diffMs / 86_400_000)

        if (diffMin < 1) return '방금 전'
        if (diffMin < 60) return `${diffMin}분 전`
        if (diffHour < 24) return `${diffHour}시간 전`
        if (diffDay < 30) return `${diffDay}일 전`
        return date.toLocaleDateString('ko-KR')
    }

    return {
        generateShareLink,
        formatRelativeTime
    }
}
