/** 사용자별 플러그인 활성 상태 한 건. */
export interface FeaturePref {
    pluginId: string
    enabled: boolean
}

/**
 * 사용자 플러그인 선호 저장소 어댑터 인터페이스.
 * 구현체만 교체하면 저장 방식을 변경할 수 있다.
 */
export interface IUserFeaturePrefRepository {
    /** 해당 유저의 모든 플러그인 선호를 반환한다. */
    findByUserId(userId: string): Promise<FeaturePref[]>
    /** (userId, pluginId) 기준으로 활성 상태를 upsert 한다. */
    upsert(userId: string, pluginId: string, enabled: boolean): Promise<FeaturePref>
}
