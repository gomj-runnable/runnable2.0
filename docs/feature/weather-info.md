# 날씨 정보

서울시 25개 구의 날씨·온도·미세먼지(PM10) 데이터를 Cesium 3D 지도 위에 행정구역별 색상 폴리곤으로 시각화하는 기능이다.
기상청 관측·예보 API와 에어코리아 실시간 대기 API를 병합해 과거 30일~미래 31일 범위의 시간별 데이터를 제공한다.

---

## 사용 방법 (고객 관점)

### 레이어 선택

지도 상단 오버레이 바에 세 개의 칩 버튼이 나타난다.

| 버튼 | 표시 내용 |
|------|-----------|
| 날씨 | 맑음 / 구름많음 / 흐림 / 비 / 눈을 색상으로 구분 |
| 온도 | -10 °C ~ 40 °C 그라디언트 스케일 |
| 미세먼지 | PM10 농도(좋음 ≤30 / 보통 ≤80 / 나쁨 ≤150 / 매우나쁨 >150) |

- 같은 버튼을 다시 누르면 레이어가 해제된다.
- "지역 고도" 버튼을 누르면 날씨 레이어가 꺼지고 서울 지형 고도(5m ~ 836m) 그라디언트가 표시된다. 날씨 레이어를 다시 선택하면 고도 표시가 해제된다.
- 활성 레이어에 맞는 범례가 하단 바에 자동으로 표시된다.

### 날짜 선택

1. 날짜 칩 버튼(예: `04.17`)을 누르면 캘린더 팝업이 열린다.
2. 데이터가 없는 날짜는 흐리게 표시(`is-no-data` 클래스)되어 구분할 수 있다.
3. 날짜를 선택하면 팝업이 자동으로 닫히고, 해당 날짜의 데이터가 지도에 반영된다.
4. 좌우 화살표로 월을 이동할 수 있으며, 이동 범위는 데이터 `rangeStart`~`rangeEnd` 및 다음 달까지로 제한된다.

### 시간 선택

날짜 우측의 시계 아이콘 버튼을 누르면 해당 날짜에 데이터가 존재하는 시간 목록이 드롭다운으로 표시된다. 시간을 선택하면 지도 색상이 즉시 갱신된다.

- 날짜를 변경했을 때 이전에 선택된 시간에 데이터가 없으면 자동으로 가장 이른 유효 시간으로 초기화된다.
- 데이터 로딩 중에는 스피너(`i-lucide-loader-2`)가 표시된다.

---

## 기술 구현 (개발 관점)

### 아키텍처

```
[브라우저]
  WeatherOverlay.vue          ← 오버레이 UI (레이어 토글, 날짜/시간 선택, 범례)
  useWeatherStore             ← 날짜·시간·레이어·월별 데이터 공유 상태
  useWeatherSideeffect        ← 서버 fetch + Cesium 레이어 렌더링

[서버]
  GET /api/weather/:date
    weatherService.requestByDate()
      ├── fetchObservedWeatherSlots()   ← 기상청 ASOS 관측 (과거)
      ├── fetchForecastWeatherSlots()   ← 기상청 단기예보 (현재·미래)
      ├── fetchSeoulAirQuality()        ← 에어코리아 실시간 PM10
      └── mergeWeatherSlots()          ← 우선순위 병합 → SeoulMonthlyWeather 반환
```

### 주요 파일

| 경로 | 역할 |
|------|------|
| `app/components/map/templates/WeatherOverlay.vue` | 날씨 오버레이 전체 UI 조합 |
| `app/components/map/molecules/weather/WeatherLayerToggle.vue` | 날씨·온도·미세먼지 레이어 칩 토글 |
| `app/components/map/molecules/weather/WeatherDatePicker.vue` | 월별 캘린더, 데이터 유무 표시 |
| `app/components/map/molecules/weather/WeatherLegend.vue` | 레이어별 색상 범례 |
| `app/components/map/molecules/weather/ElevationLegend.vue` | 고도 그라디언트 범례 (5m~836m 고정) |
| `app/composables/store/useWeatherStore.ts` | `useState` 기반 공유 상태 + `dailySnapshot` computed |
| `app/composables/sideeffect/useWeatherSideeffect.ts` | 날씨 fetch, GeoJSON DataSource 로드, Cesium 폴리곤·외곽선 렌더링 |
| `server/api/weather/[date].get.ts` | `GET /api/weather/:date` 진입점 |
| `server/utils/weather/weather.service.ts` | 전체 파이프라인 조율 |
| `server/utils/weather/observed.adapter.ts` | 기상청 ASOS 관측 데이터 정규화 |
| `server/utils/weather/forecast.adapter.ts` | 기상청 단기예보 데이터 정규화 |
| `server/utils/weather/airquality.adapter.ts` | 에어코리아 PM10 실시간 데이터 정규화 + 1시간 캐싱 |
| `server/utils/weather/merge.service.ts` | 관측·예보 슬롯 우선순위 병합 |
| `server/utils/weather/common.ts` | KST 변환, 날짜 유틸, 서울 25구 격자 좌표(`SEOUL_GU_GRID`), fallback 슬롯 생성 |

### 데이터 파이프라인

#### 1. 요청 범위 계산

`requestByDate(date)`를 호출하면 서버는 다음 범위를 결정한다.

- **관측(observed)**: `baseDate - 30일` ~ 현재 KST 시각 (과거 날짜면 해당 날짜 23시까지)
- **예보(forecast)**: `baseDate` 기준 최신 예보 발표 회차(02·05·08·11·14·17·20·23시) 선택
- **반환 범위**: `baseDate - 30일` ~ `baseDate + 31일`

#### 2. 병렬 API 호출

세 소스를 `Promise.all`로 병렬 호출하며, 각 소스 실패 시 빈 배열/맵으로 폴백한다.

| 소스 | 외부 API | 인증 키 |
|------|----------|---------|
| 관측 | 기상청 KMA typ01 (`kma_sfctm5.php`, `dst_pm10_tm.php`) | `weatherKor` |
| 예보 | 공공데이터포털 단기예보 (`VilageFcstInfoService_2.0`) | `openData` |
| 대기질 | 에어코리아 실시간 측정소 (`ArpltnInforInqireSvc`) | `airKoreaKey` |

#### 3. 병합 우선순위

`mergeWeatherSlots()`는 시간 슬롯 단위로 세 소스를 우선순위 맵으로 합친다.

```
observed(3) > forecast(2) > fallback(1)
```

동일 시간 슬롯에 여러 소스가 있으면 높은 우선순위 데이터만 남긴다.
데이터가 없는 시간 슬롯은 `buildFallbackSlot()`이 계절·시간대 기반 추정값(기온, 날씨 상태)을 채운다.

#### 4. PM10 보완

`mergeWeatherSlots()` 결과에서 `pm10`이 `null`인 슬롯은 에어코리아 데이터로 보완한다.
에어코리아는 구 단위 스테이션 기준이므로 `guCode` → `AirQualitySlot[]` 맵으로 매칭한다.

**에어코리아 캐싱**: 서버 모듈 수준에서 결과를 1시간(`CACHE_TTL_MS = 3_600_000`) 동안 메모리에 캐싱하며, 25개 구에 대한 API 호출은 동시 5개(`MAX_CONCURRENT`)로 제한한다.

#### 5. Cesium 렌더링

`useWeatherSideeffect.init()`이 호출되면:

1. 서울 구 행정경계 GeoJSON을 Cesium `GeoJsonDataSource`로 로드한다.
2. 각 폴리곤 엔티티의 `SIG_CD`(구 코드) 또는 `EMD_CD`(동 코드)로 `dailySnapshot` 맵에서 해당 데이터를 조회한다.
3. `resolvePolygonColor()`로 레이어 타입별 색상을 결정해 `ColorMaterialProperty`를 설정한다.
4. 행정경계 외곽선은 `GroundPolylinePrimitive`(per-instance color)로 별도 렌더링한다.
5. `selectedDate`, `selectedHour`, `activeLayer` 중 하나라도 변경되면 `updateCesiumPolygons()`가 트리거되어 전체 폴리곤·외곽선 색상을 갱신한다.
6. `isVisible`이 `false`이거나 활성 레이어가 없으면 DataSource와 Primitive 모두 숨긴다.

#### 6. 프론트엔드 상태 흐름

```
useWeatherStore (useState)
  selectedDate / selectedHour / selectedMonth
  monthlyData (SeoulMonthlyWeather)
  activeLayer ('weather' | 'temperature' | 'pm10' | null)
  isVisible
  dailySnapshot (computed: dongCode → HourlyWeather)
        │
        ▼
useWeatherSideeffect (options DI 방식)
  fetchMonthlyWeather() → $fetch('/api/weather/:date') → monthlyData
  loadBoundaryDataSource() → Cesium DataSource 초기화
  updateCesiumPolygons()  → watch([selectedDate, selectedHour, activeLayer])
```

### API

#### `GET /api/weather/:date`

| 항목 | 값 |
|------|----|
| 경로 | `/api/weather/YYYY-MM-DD` |
| 파라미터 | `date` — 조회 기준 날짜 (YYYY-MM-DD, 필수) |
| 응답 타입 | `SeoulMonthlyWeather` |
| 오류 | `400` — date 형식이 올바르지 않을 때 |

**응답 구조 (`SeoulMonthlyWeather`)**

```ts
{
  baseDate: string            // 조회 기준 날짜 (YYYY-MM-DD)
  rangeStart: string          // 데이터 범위 시작 (baseDate - 30일)
  rangeEnd: string            // 데이터 범위 끝 (baseDate + 31일)
  dongs: DongWeather[]        // 서울 25개 구별 시간별 날씨 배열
}

DongWeather {
  dongCode: string            // 구 코드 (예: '11680')
  dongName: string            // 구 이름 (예: '강남구')
  nx: number                  // 기상청 격자 X
  ny: number                  // 기상청 격자 Y
  hourly: HourlyWeather[]
}

HourlyWeather {
  date: string                // YYYY-MM-DD
  time: string                // HH:00
  condition: WeatherCondition // 'clear' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy'
  temperature: number         // 섭씨 (°C)
  pm10: number | null         // PM10 농도 (µg/m³)
  pm10Grade: Pm10Grade | null // 'good' | 'normal' | 'bad' | 'very-bad'
  source: 'observed' | 'forecast' | 'fallback'
}
```

#### 런타임 환경 변수

| 키 | 설명 |
|----|------|
| `weatherKor` | 기상청 KMA Open API Hub 인증 키 (관측 데이터) |
| `openData` | 공공데이터포털 서비스 키 (단기예보) |
| `airKoreaKey` | 에어코리아 API 서비스 키 (실시간 PM10) |
