/**
 * z-index 티어 시스템
 * ─────────────────────────────────────
 * z-0  : 오버레이 내부 기본 (범례, 바텀바)
 * z-5  : POI 마커 레이어 (inline)
 * z-10 : 오버레이 컨테이너 / 지도 컨트롤 (날씨, 시설)
 * z-20 : FAB 플로팅 버튼
 * z-30 : Slideover, 네비게이션 토글
 * z-40 : Drawer
 * z-50 : Modal, 팝업, 확인 가이드
 */
export default defineAppConfig({
    ui: {
        colors: {
            primary: 'green',
            neutral: 'slate'
        },
        slideover: {
            slots: {
                overlay: 'z-30',
                content: 'z-30'
            }
        },
        drawer: {
            slots: {
                overlay: 'z-40',
                content: 'z-40'
            }
        },
        modal: {
            slots: {
                overlay: 'z-50',
                content: 'z-50'
            }
        }
    }
})
