/**
 * 모바일 브레이크포인트(max-width: 1023px) 감지 composable.
 * MediaQueryList 리스너를 onMounted/onBeforeUnmount에서 자동으로 관리한다.
 */
export const useMobileDetect = () => {
    const isMobile = ref(false)
    let mobileMediaQuery: MediaQueryList | null = null

    const onMediaChange = (e: MediaQueryListEvent) => {
        isMobile.value = e.matches
    }

    onMounted(() => {
        mobileMediaQuery = window.matchMedia('(max-width: 1023px)')
        isMobile.value = mobileMediaQuery.matches
        mobileMediaQuery.addEventListener('change', onMediaChange)
    })

    onBeforeUnmount(() => {
        mobileMediaQuery?.removeEventListener('change', onMediaChange)
    })

    return { isMobile }
}
