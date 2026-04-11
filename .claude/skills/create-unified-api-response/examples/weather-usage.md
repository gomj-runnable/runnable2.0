# 실제 프로젝트 사례: Weather

날씨 기능에서 KMA 관측 + KMA 예보 + AirKorea 3개 API를 통합한 사례.

## 구성 요소 매핑

| 구성 요소 | 파일 | 설명 |
|-----------|------|------|
| 공통 Local Response | `shared/types/weather.ts` → `HourlyWeather` | 모든 API 결과가 변환되는 단일 인터페이스 |
| source 타입 | `shared/types/weather.ts` → `WeatherSlotSource` | `'observed' \| 'forecast' \| 'fallback'` |
| API-A 원본 | `shared/types/weather.ts` → `KmaObservedOriginalResponse` | KMA TYP01 텍스트 파싱 |
| API-B 원본 | `shared/types/weather.ts` → `VilageFcstOriginalResponse` | KMA 단기예보 JSON |
| API-C 원본 | `shared/types/weather.ts` → `AirKoreaOriginalResponse` | AirKorea 실시간 대기질 JSON |
| Adapter A | `server/utils/weather/observed.adapter.ts` | KMA 관측 → `HourlyWeather[]` |
| Adapter B | `server/utils/weather/forecast.adapter.ts` | KMA 예보 → `HourlyWeather[]` |
| Adapter C | `server/utils/weather/airquality.adapter.ts` | AirKorea → `AirQualitySlot[]` |
| Merge | `server/utils/weather/merge.service.ts` | source 우선순위: observed(3) > forecast(2) > fallback(1) |
| 오케스트레이터 | `server/utils/weather/weather.service.ts` | Promise.all + catch fallback |
| API 엔드포인트 | `server/api/weather/[date].get.ts` | `GET /api/weather/:date` |

## 프론트엔드 소비 구조

| composable | 역할 | 의존 타입 |
|------------|------|-----------|
| `app/composables/store/useWeatherStore.ts` | 상태 관리, `dailySnapshot` 파생 | `HourlyWeather`, `SeoulMonthlyWeather` |
| `app/composables/action/useWeatherDataTransform.ts` | condition/temp/pm10 → 색상, 아이콘, 라벨 | `HourlyWeather` |
| `app/composables/sideeffect/useWeatherSideeffect.ts` | Cesium 폴리곤 렌더링 | `HourlyWeather` |

→ 호출부(`weatherService.requestByDate()`) 이후 모든 프론트엔드 로직은 `HourlyWeather`만 소비한다.

## 데이터 흐름

```
GET /api/weather/2026-04-10
  → weatherService.requestByDate('2026-04-10')
    ├─ observedAdapter  → HourlyWeather[] (source: 'observed')
    ├─ forecastAdapter  → HourlyWeather[] (source: 'forecast')
    ├─ airQualityAdapter → AirQualitySlot[] (PM10 오버레이용)
    └─ mergeWeatherSlots()
         → observed 우선, 빈 시간대는 forecast, 둘 다 없으면 fallback
  → SeoulMonthlyWeather (25개 동 × 시간별 HourlyWeather[])

프론트엔드:
  useWeatherStore.monthlyData ← API 응답
  useWeatherStore.dailySnapshot ← Map<dongCode, HourlyWeather>
  useWeatherDataTransform ← HourlyWeather → 색상/아이콘
  useWeatherSideeffect ← dailySnapshot → Cesium 폴리곤
```