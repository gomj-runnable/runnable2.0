import type { ThemeMap } from '#shared/types/theme-map'

export const themeMapSample: ThemeMap = {
  id: 'is01',
  name: '인천1호선',
  description: '인천1호선 설명',
  attribute: {
    comment: '인천1호선 요약',
    file_id: '참고 파일 아이디',
    file_nm: '파일 명',
    fly_dir: '화면 이동 방향 정보',
    fly_pos: '화면 이동 위치 정보',
    addr_road: '도로명 주소',
    addr_jibun: '지번 주소',
    description: '하위 정보 설명',
    geom: '공간 정보'
  },
  relativeMaps: [],
  createdAt: '',
  updatedAt: '',
  data: {
    children: [
      {
        id: 'is01_gyul',
        name: '귤현역',
        type: 'station',
        cameras: [
          {
            id: 'is01_gyul_cam01',
            name: '귤현역 전체보기',
            position: [126.74029, 37.56528, 142.37],
            direction: [54, -28, 0]
          }
        ],
        position: [-1, -1, -1],
        template: undefined,
        attribute: {
          comment: '',
          file_id: undefined,
          file_nm: undefined,
          fly_dir: undefined,
          fly_pos: undefined,
          addr_road: '인천광역시 계양구 장제로 1136',
          addr_jibun: '인천광역시 계양구 귤현동 334-1 귤현역',
          description: '귤현역 설명',
          geom: undefined
        },
        resources: {
          img: '/static/images/gyulhyeon_station.png',
          icon: undefined,
          url: undefined
        },
        children: [
          {
            id: 'SEC_001',
            name: '구역1',
            type: 'sector',
            cameras: [
              {
                id: 'is01_gyul_f01_cam01',
                name: '귤현역 1층 전체보기',
                position: [126.74015126846217, 37.56529914237459, 162.57530813463782],
                direction: [53.998592316256065, -30.00226406884513, 0]
              }
            ],
            position: [-1, -1, -1],
            template: undefined,
            attribute: {
              comment: '귤현역 지하1층 요약',
              file_id: undefined,
              file_nm: undefined,
              fly_dir: undefined,
              fly_pos: undefined,
              addr_road: undefined,
              addr_jibun: undefined,
              description: undefined,
              geom: undefined
            },
            resources: { img: undefined, icon: undefined, url: undefined },
            children: [
              {
                id: 'A-001',
                name: '차량검수고',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74352, 37.57011, 22.23],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '1층 시설물1',
                  featureAttribute: { 부재종류: '슬래브', 부재형식: 'RC 슬래브', 점검연도: 2023, 상태등급: 'C등급', 제원정보: 'T=200mm, 스팬 8m' },
                  damagedFacilities: [
                    { 순번: 'A-001-01', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '균열', 손상명: '표면균열', 손상수량: 12, 추출연도: 2023, 부재상태: 'C등급', 보수방법설명: '균열보수(에폭시 주입)', GIS정보: '126.74352, 37.57011', image: '/static/sample/sample.png' },
                    { 순번: 'A-001-02', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '균열', 손상명: '관통균열', 손상수량: 3, 추출연도: 2023, 부재상태: 'D등급', 보수방법설명: 'U컷 실링처리', GIS정보: '126.74361, 37.57015', image: '/static/sample/sample.png' },
                    { 순번: 'A-001-03', 기준연도: 2022, 점검종류: '정밀점검', 손상종류: '박리', 손상명: '콘크리트 박리', 손상수량: 5, 추출연도: 2022, 부재상태: 'C등급', 보수방법설명: '표면처리 후 방수도막', GIS정보: '126.74370, 37.57020', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74393, 37.57101, 12.23], [126.74296, 37.57098, 12.17], [126.74306, 37.56910, 12.36], [126.74419, 37.56914, 12.38], [126.74417, 37.56946, 12.35], [126.74402, 37.56946, 12.73], [126.74393, 37.57101, 12.23]]] }
                },
                resources: { img: ['/static/sample/sample.png', '/static/sample/sample.png', '/static/sample/sample.png'], icon: undefined, url: undefined }
              },
              {
                id: 'A-002',
                name: '전동차 유치선',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74251, 37.5702, 16.03],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '1층 시설물2',
                  featureAttribute: { 부재종류: '기둥', 부재형식: 'RC 원형기둥', 점검연도: 2023, 상태등급: 'B등급', 제원정보: 'D=600mm, H=5.5m' },
                  damagedFacilities: [
                    { 순번: 'A-002-01', 기준연도: 2023, 점검종류: '정밀점검', 손상종류: '부식', 손상명: '철근부식', 손상수량: 3, 추출연도: 2023, 부재상태: 'B등급', 보수방법설명: '단면복구 후 방청처리', GIS정보: '126.74251, 37.57020', image: '/static/sample/sample.png' },
                    { 순번: 'A-002-02', 기준연도: 2023, 점검종류: '정밀점검', 손상종류: '부식', 손상명: '강재부식', 손상수량: 7, 추출연도: 2023, 부재상태: 'C등급', 보수방법설명: '도막방청 및 방수코팅', GIS정보: '126.74255, 37.57025', image: '/static/sample/sample.png' },
                    { 순번: 'A-002-03', 기준연도: 2022, 점검종류: '정기점검', 손상종류: '부식', 손상명: '표면부식', 손상수량: 15, 추출연도: 2022, 부재상태: 'B등급', 보수방법설명: '녹 제거 후 방청도료 도포', GIS정보: '126.74260, 37.57030', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74235, 37.56952, 12.36], [126.74275, 37.56953, 13.17], [126.74277, 37.57090, 12.83], [126.74227, 37.57088, 12.39], [126.74235, 37.56952, 12.36]]] }
                },
                resources: { img: ['/static/sample/sample.png', '/static/sample/sample.png'], icon: undefined, url: undefined }
              },
              {
                id: 'A-003',
                name: '조명등',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74311, 37.56874, 26.94],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '1층 시설물3',
                  featureAttribute: { 부재종류: '천장', 부재형식: 'PC 패널', 점검연도: 2022, 상태등급: 'B등급', 제원정보: '600×600mm' },
                  damagedFacilities: [
                    { 순번: 'A-003-01', 기준연도: 2022, 점검종류: '일상점검', 손상종류: '박리', 손상명: '콘크리트 박리', 손상수량: 7, 추출연도: 2022, 부재상태: 'B등급', 보수방법설명: '표면처리 후 도막방수', GIS정보: '126.74311, 37.56874', image: '/static/sample/sample.png' },
                    { 순번: 'A-003-02', 기준연도: 2022, 점검종류: '일상점검', 손상종류: '박리', 손상명: '도장 박리', 손상수량: 12, 추출연도: 2022, 부재상태: 'B등급', 보수방법설명: '재도장', GIS정보: '126.74315, 37.56877', image: '/static/sample/sample.png' },
                    { 순번: 'A-003-03', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '박리', 손상명: '타일 박리', 손상수량: 4, 추출연도: 2023, 부재상태: 'C등급', 보수방법설명: '타일 재시공', GIS정보: '126.74308, 37.56870', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74311, 37.56871, 12.33], [126.74313, 37.56871, 12.28], [126.74315, 37.56873, 26.84], [126.74315, 37.56875, 26.84], [126.74313, 37.56878, 26.84], [126.74311, 37.56878, 26.84], [126.74309, 37.56875, 12.32], [126.74309, 37.56873, 12.24]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              },
              {
                id: 'A-004',
                name: '변압기',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74309, 37.56896, 15.02],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '1층 시설물4',
                  featureAttribute: { 부재종류: '벽체', 부재형식: 'RC 벽체', 점검연도: 2024, 상태등급: 'D등급', 제원정보: 'T=300mm, H=4.0m' },
                  damagedFacilities: [
                    { 순번: 'A-004-01', 기준연도: 2024, 점검종류: '정기점검', 손상종류: '누수', 손상명: '천장 누수', 손상수량: 2, 추출연도: 2024, 부재상태: 'D등급', 보수방법설명: '방수층 재시공', GIS정보: '126.74309, 37.56896', image: '/static/sample/sample.png' },
                    { 순번: 'A-004-02', 기준연도: 2024, 점검종류: '정기점검', 손상종류: '누수', 손상명: '벽체 누수', 손상수량: 5, 추출연도: 2024, 부재상태: 'C등급', 보수방법설명: '주입식 방수처리', GIS정보: '126.74311, 37.56899', image: '/static/sample/sample.png' },
                    { 순번: 'A-004-03', 기준연도: 2023, 점검종류: '정밀점검', 손상종류: '누수', 손상명: '바닥 누수', 손상수량: 1, 추출연도: 2023, 부재상태: 'D등급', 보수방법설명: '바닥 방수공사', GIS정보: '126.74306, 37.56893', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74307, 37.56899, 12.20], [126.74308, 37.56893, 12.24], [126.74312, 37.56893, 12.35], [126.74311, 37.56899, 12.37], [126.74307, 37.56899, 12.20]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              },
              {
                id: 'A-005',
                name: '선로(SAM-001)',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74297, 37.56885, 12.34],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '1층 시설물5',
                  featureAttribute: { 부재종류: '레일', 부재형식: '60kg/m 레일', 점검연도: 2024, 상태등급: 'A등급', 제원정보: '길이 25m, 중량 60kg/m' },
                  damagedFacilities: [
                    { 순번: 'A-005-01', 기준연도: 2024, 점검종류: '정밀안전진단', 손상종류: '변형', 손상명: '레일 마모', 손상수량: 1, 추출연도: 2024, 부재상태: 'A등급', 보수방법설명: '레일 연마 및 교체 검토', GIS정보: '126.74297, 37.56885', image: '/static/sample/sample.png' },
                    { 순번: 'A-005-02', 기준연도: 2024, 점검종류: '정밀안전진단', 손상종류: '변형', 손상명: '레일 파상마모', 손상수량: 2, 추출연도: 2024, 부재상태: 'B등급', 보수방법설명: '레일 연마처리', GIS정보: '126.74299, 37.56887', image: '/static/sample/sample.png' },
                    { 순번: 'A-005-03', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '파손', 손상명: '침목 파손', 손상수량: 3, 추출연도: 2023, 부재상태: 'C등급', 보수방법설명: '침목 교체', GIS정보: '126.74295, 37.56882', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74295, 37.56890, 12.35], [126.74296, 37.56881, 12.34], [126.74299, 37.56881, 12.34], [126.74298, 37.56890, 12.36], [126.74295, 37.56890, 12.35]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              }
            ]
          },
          {
            id: 'SEC_002',
            name: '구역2',
            type: 'sector',
            cameras: [
              {
                id: 'is01_gyul_f02_cam01',
                name: '귤현역 2층 전체보기',
                position: [126.74198, 37.56593, 67.75],
                direction: [43, -30, 0]
              }
            ],
            position: [-1, -1, -1],
            template: undefined,
            attribute: {
              comment: '귤현역 지하2층 요약',
              file_id: undefined,
              file_nm: undefined,
              fly_dir: undefined,
              fly_pos: undefined,
              addr_road: undefined,
              addr_jibun: undefined,
              description: undefined,
              geom: undefined
            },
            resources: { img: undefined, icon: undefined, url: undefined },
            children: [
              {
                id: 'B-001',
                name: '탑라이트',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74263, 37.5664, 28.3],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '2층 시설물1',
                  featureAttribute: { 부재종류: '지붕', 부재형식: '강화유리 패널', 점검연도: 2023, 상태등급: 'C등급', 제원정보: '1200×1200mm, T=10mm' },
                  damagedFacilities: [
                    { 순번: 'B-001-01', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '파손', 손상명: '유리 파손', 손상수량: 4, 추출연도: 2023, 부재상태: 'C등급', 보수방법설명: '강화유리 교체', GIS정보: '126.74263, 37.56640', image: '/static/sample/sample.png' },
                    { 순번: 'B-001-02', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '변형', 손상명: '프레임 변형', 손상수량: 2, 추출연도: 2023, 부재상태: 'B등급', 보수방법설명: '프레임 교정 및 보강', GIS정보: '126.74265, 37.56643', image: '/static/sample/sample.png' },
                    { 순번: 'B-001-03', 기준연도: 2022, 점검종류: '일상점검', 손상종류: '파손', 손상명: '실런트 파손', 손상수량: 6, 추출연도: 2022, 부재상태: 'B등급', 보수방법설명: '실런트 재시공', GIS정보: '126.74260, 37.56637', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74259, 37.56655, 24.98], [126.74254, 37.56638, 25.09], [126.74268, 37.56625, 24.98], [126.74273, 37.56642, 25.18]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              },
              {
                id: 'B-002',
                name: '선로(SAM-002)',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74282, 37.56565, 12.44],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '2층 시설물2',
                  featureAttribute: { 부재종류: '레일', 부재형식: '60kg/m 레일', 점검연도: 2022, 상태등급: 'B등급', 제원정보: '길이 25m, 중량 60kg/m' },
                  damagedFacilities: [
                    { 순번: 'B-002-01', 기준연도: 2022, 점검종류: '정밀점검', 손상종류: '변형', 손상명: '레일 틀어짐', 손상수량: 1, 추출연도: 2022, 부재상태: 'B등급', 보수방법설명: '레일 정렬 및 고정볼트 교체', GIS정보: '126.74282, 37.56565', image: '/static/sample/sample.png' },
                    { 순번: 'B-002-02', 기준연도: 2022, 점검종류: '정밀점검', 손상종류: '변형', 손상명: '레일 파상마모', 손상수량: 3, 추출연도: 2022, 부재상태: 'B등급', 보수방법설명: '레일 연마처리', GIS정보: '126.74284, 37.56567', image: '/static/sample/sample.png' },
                    { 순번: 'B-002-03', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '균열', 손상명: '레일 균열', 손상수량: 1, 추출연도: 2023, 부재상태: 'D등급', 보수방법설명: '레일 교체', GIS정보: '126.74280, 37.56563', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74280, 37.56569, 12.48], [126.74284, 37.56569, 12.55], [126.74285, 37.56561, 12.50], [126.74281, 37.56561, 12.47]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              },
              {
                id: 'B-003',
                name: '전차선',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74203, 37.56751, 21.56],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '2층 시설물3',
                  featureAttribute: { 부재종류: '전차선', 부재형식: 'Cu 150mm²', 점검연도: 2024, 상태등급: 'C등급', 제원정보: '150mm², 장력 10kN' },
                  damagedFacilities: [
                    { 순번: 'B-003-01', 기준연도: 2024, 점검종류: '정기점검', 손상종류: '마모', 손상명: '전차선 마모', 손상수량: 5, 추출연도: 2024, 부재상태: 'C등급', 보수방법설명: '전차선 교체', GIS정보: '126.74203, 37.56751', image: '/static/sample/sample.png' },
                    { 순번: 'B-003-02', 기준연도: 2024, 점검종류: '정기점검', 손상종류: '부식', 손상명: '조가선 부식', 손상수량: 2, 추출연도: 2024, 부재상태: 'C등급', 보수방법설명: '조가선 교체', GIS정보: '126.74205, 37.56753', image: '/static/sample/sample.png' },
                    { 순번: 'B-003-03', 기준연도: 2023, 점검종류: '정밀점검', 손상종류: '파손', 손상명: '드로퍼 파손', 손상수량: 8, 추출연도: 2023, 부재상태: 'B등급', 보수방법설명: '드로퍼 교체', GIS정보: '126.74200, 37.56749', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74201514244591, 37.56751795944596, 13.17], [126.74201911012017, 37.5675080700786, 21.57], [126.7420329071662, 37.56750971976702, 21.57], [126.7420273684661, 37.56752511264562, 13.35]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              },
              {
                id: 'B-004',
                name: '트롤리선',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74209394382208, 37.56753567994026, 20.28],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '2층 시설물4',
                  featureAttribute: { 부재종류: '트롤리선', 부재형식: 'Cu 85mm²', 점검연도: 2023, 상태등급: 'E등급', 제원정보: '85mm², 장력 8kN' },
                  damagedFacilities: [
                    { 순번: 'B-004-01', 기준연도: 2023, 점검종류: '정밀안전진단', 손상종류: '단선', 손상명: '트롤리선 단선', 손상수량: 1, 추출연도: 2023, 부재상태: 'E등급', 보수방법설명: '즉시 교체 필요', GIS정보: '126.74209, 37.56753', image: '/static/sample/sample.png' },
                    { 순번: 'B-004-02', 기준연도: 2023, 점검종류: '정기점검', 손상종류: '마모', 손상명: '집전슈 마모', 손상수량: 3, 추출연도: 2023, 부재상태: 'C등급', 보수방법설명: '집전슈 교체', GIS정보: '126.74211, 37.56755', image: '/static/sample/sample.png' },
                    { 순번: 'B-004-03', 기준연도: 2022, 점검종류: '정밀점검', 손상종류: '파손', 손상명: '절연자 파손', 손상수량: 2, 추출연도: 2022, 부재상태: 'D등급', 보수방법설명: '절연자 교체', GIS정보: '126.74207, 37.56751', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.7421068805485, 37.56752875103037, 19.28], [126.74210085640395, 37.567540030719975, 19.28], [126.74208974644374, 37.567536179483554, 19.28], [126.74209646769197, 37.56752441243261, 19.28]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              },
              {
                id: 'B-005',
                name: '분기기',
                type: 'facility',
                cameras: [],
                children: [],
                position: [126.74311152056903, 37.5663365858586, 12.42],
                template: undefined,
                attribute: {
                  comment: '',
                  file_id: undefined,
                  file_nm: undefined,
                  fly_dir: undefined,
                  fly_pos: undefined,
                  addr_road: undefined,
                  addr_jibun: undefined,
                  description: '2층 시설물5',
                  featureAttribute: { 부재종류: '분기기', 부재형식: '8번 분기기', 점검연도: 2022, 상태등급: 'B등급', 제원정보: '8번, 허용속도 45km/h' },
                  damagedFacilities: [
                    { 순번: 'B-005-01', 기준연도: 2022, 점검종류: '정기점검', 손상종류: '이완', 손상명: '분기기 볼트 이완', 손상수량: 8, 추출연도: 2022, 부재상태: 'B등급', 보수방법설명: '볼트 재체결 및 토크 관리', GIS정보: '126.74311, 37.56633', image: '/static/sample/sample.png' },
                    { 순번: 'B-005-02', 기준연도: 2022, 점검종류: '정기점검', 손상종류: '변형', 손상명: '레일 간격 불량', 손상수량: 2, 추출연도: 2022, 부재상태: 'C등급', 보수방법설명: '레일 간격 조정', GIS정보: '126.74313, 37.56636', image: '/static/sample/sample.png' },
                    { 순번: 'B-005-03', 기준연도: 2023, 점검종류: '정밀점검', 손상종류: '파손', 손상명: '스프링 파손', 손상수량: 4, 추출연도: 2023, 부재상태: 'C등급', 보수방법설명: '스프링 교체', GIS정보: '126.74309, 37.56630', image: '/static/sample/sample.png' }
                  ],
                  geom: { type: 'Polygon', coordinates: [[[126.74314616513811, 37.566463889501556, 12.49], [126.7430818400484, 37.56646171185455, 12.45], [126.74308289863114, 37.56623775523698, 12.43], [126.74312167451293, 37.56623504927767, 12.41]]] }
                },
                resources: { img: undefined, icon: undefined, url: undefined }
              }
            ]
          }
        ]
      }
    ]
  }
}
