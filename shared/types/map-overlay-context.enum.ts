import { EnumBase } from './enum-base'

/**
 * 지도 오버레이 UI의 가시성 컨텍스트.
 *
 * 경로 카드가 활성화된 상태에서만 표시되어야 하는 오버레이 UI 그룹
 * (시뮬레이션·경로정보·고도·경사도 등)의 표출 조건을 결정한다.
 *
 * - `hasActiveRoute`: 현재 컨텍스트에서 경로가 선택/활성 상태인지 여부
 * - `showDrawingTools`: 그리기 전용 도구(경로 닫기 등) 표시 여부
 */
export class MapOverlayContextEnum extends EnumBase {
    /** 활성 경로 없음 — 오버레이 UI 비표시 */
    static readonly NONE = new MapOverlayContextEnum('none', '없음', false, false)
    /** 그리기 탭에서 경로 그리는 중 */
    static readonly DRAWING = new MapOverlayContextEnum('drawing', '그리기', true, true)
    /** 목록 탭에서 경로 선택 */
    static readonly LIST_SELECTED = new MapOverlayContextEnum('list_selected', '목록 선택', true, false)
    /** 탐색 탭에서 경로 선택 */
    static readonly EXPLORE_SELECTED = new MapOverlayContextEnum('explore_selected', '탐색 선택', true, false)
    /** 탐색 탭에서 추천 모드 활성 — 선택된 경로 카드가 가려짐 */
    static readonly RECOMMEND = new MapOverlayContextEnum('recommend', '추천', false, false)

    private constructor(
        key: string,
        label: string,
        /** 경로 의존 오버레이(시뮬레이션·경로정보·고도·경사도)를 표시할 수 있는 컨텍스트인지 */
        public readonly hasActiveRoute: boolean,
        /** 그리기 전용 도구(경로 닫기 칩 등)를 표시할 수 있는 컨텍스트인지 */
        public readonly showDrawingTools: boolean
    ) {
        super(key, label)
    }

    get isNone(): boolean { return this.key === 'none' }
    get isDrawing(): boolean { return this.key === 'drawing' }
    get isListSelected(): boolean { return this.key === 'list_selected' }
    get isExploreSelected(): boolean { return this.key === 'explore_selected' }
    get isRecommend(): boolean { return this.key === 'recommend' }

    static from(key: string): MapOverlayContextEnum {
        return EnumBase.fromKey<MapOverlayContextEnum>(MapOverlayContextEnum, key) ?? MapOverlayContextEnum.NONE
    }
}
