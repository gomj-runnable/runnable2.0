/**
 * 서울시 행정경계 레이어의 표시 상태를 관리하는 store composable.
 * 시군구와 읍면동 레이어를 독립적으로 on/off할 수 있다.
 */
export const useBoundaryStore = () => {
    /** 시군구 경계 표시 여부 */
    const isGuActive = useState('boundary.gu', () => false)
    /** 읍면동 경계 표시 여부 */
    const isDongActive = useState('boundary.dong', () => false)

    const toggleGu = () => {
        isGuActive.value = !isGuActive.value
    }

    const toggleDong = () => {
        isDongActive.value = !isDongActive.value
    }

    return { isGuActive, isDongActive, toggleGu, toggleDong }
}
