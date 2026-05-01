import type { Facility } from '#shared/types/facility'

/**
 * 서울 주요 러닝 코스 주변 시설물 샘플 데이터.
 * 실제 서비스에서는 공공데이터 API로 교체한다.
 */
export const sampleFacilities: Facility[] = [
    // ── 횡단보도 (신호등 O) ──────────────────────────────────
    {
        id: 'cw-01',
        type: 'crosswalk',
        name: '여의나루역 앞 횡단보도',
        lng: 126.9325,
        lat: 37.527,
        hasSignal: true,
        polyline: [
            [126.9323, 37.52695],
            [126.9327, 37.52705]
        ]
    },
    {
        id: 'cw-02',
        type: 'crosswalk',
        name: '반포대로 횡단보도',
        lng: 126.996,
        lat: 37.5085,
        hasSignal: true,
        polyline: [
            [126.9958, 37.50845],
            [126.9962, 37.50855]
        ]
    },
    {
        id: 'cw-03',
        type: 'crosswalk',
        name: '잠실나루역 횡단보도',
        lng: 127.081,
        lat: 37.5178,
        hasSignal: true,
        polyline: [
            [127.0808, 37.51775],
            [127.0812, 37.51785]
        ]
    },
    {
        id: 'cw-04',
        type: 'crosswalk',
        name: '올림픽대로 횡단보도',
        lng: 127.02,
        lat: 37.5195,
        hasSignal: true,
        polyline: [
            [127.0198, 37.51945],
            [127.0202, 37.51955]
        ]
    },
    // ── 횡단보도 (신호등 X) ──────────────────────────────────
    {
        id: 'cw-05',
        type: 'crosswalk',
        name: '서울숲 입구 횡단보도',
        lng: 127.0378,
        lat: 37.544,
        hasSignal: false,
        polyline: [
            [127.0376, 37.54395],
            [127.038, 37.54405]
        ]
    },
    {
        id: 'cw-06',
        type: 'crosswalk',
        name: '뚝섬유원지 횡단보도',
        lng: 127.045,
        lat: 37.535,
        hasSignal: false,
        polyline: [
            [127.0448, 37.53495],
            [127.0452, 37.53505]
        ]
    },
    {
        id: 'cw-07',
        type: 'crosswalk',
        name: '이촌 한강공원 횡단보도',
        lng: 126.972,
        lat: 37.5175,
        hasSignal: false,
        polyline: [
            [126.9718, 37.51745],
            [126.9722, 37.51755]
        ]
    },
    // ── 음수대 ───────────────────────────────────────────────
    {
        id: 'ft-01',
        type: 'fountain',
        name: '여의도 한강공원 음수대',
        lng: 126.934,
        lat: 37.5265
    },
    {
        id: 'ft-02',
        type: 'fountain',
        name: '반포 한강공원 음수대',
        lng: 126.995,
        lat: 37.5078
    },
    {
        id: 'ft-03',
        type: 'fountain',
        name: '서울숲 중앙 음수대',
        lng: 127.038,
        lat: 37.5448
    },
    {
        id: 'ft-04',
        type: 'fountain',
        name: '잠실 한강공원 음수대',
        lng: 127.08,
        lat: 37.5168
    },
    {
        id: 'ft-05',
        type: 'fountain',
        name: '뚝섬 한강공원 음수대',
        lng: 127.046,
        lat: 37.534
    },
    // ── 물품보관함 ───────────────────────────────────────────
    {
        id: 'lk-01',
        type: 'locker',
        name: '여의도 한강공원 물품보관함',
        lng: 126.933,
        lat: 37.5275
    },
    {
        id: 'lk-02',
        type: 'locker',
        name: '반포 한강공원 물품보관함',
        lng: 126.9965,
        lat: 37.5075
    },
    {
        id: 'lk-03',
        type: 'locker',
        name: '잠실 한강공원 물품보관함',
        lng: 127.0815,
        lat: 37.5165
    },
    {
        id: 'lk-04',
        type: 'locker',
        name: '뚝섬 한강공원 물품보관함',
        lng: 127.0445,
        lat: 37.5345
    },
    // ── 병원 ─────────────────────────────────────────────────
    {
        id: 'hp-01',
        type: 'hospital',
        name: '여의도성모병원',
        lng: 126.9372,
        lat: 37.5185
    },
    {
        id: 'hp-02',
        type: 'hospital',
        name: '강남세브란스병원',
        lng: 127.0475,
        lat: 37.4972
    },
    {
        id: 'hp-03',
        type: 'hospital',
        name: '서울아산병원',
        lng: 127.108,
        lat: 37.5262
    },
    {
        id: 'hp-04',
        type: 'hospital',
        name: '건국대학교병원',
        lng: 127.0712,
        lat: 37.5405
    }
]
