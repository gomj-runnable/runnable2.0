# 3.3 Weather

기상 정보 — 예보 · 관측 · 대기질 통합. `shared/types/weather.ts` + `shared/types/weather-recommend.ts`.

## DTO 계층

```mermaid
classDiagram
    class HourlyWeather {
        +date: string
        +time: string
        +condition: WeatherCondition
        +temperature: number
        +pm10: number
        +pm10Grade: Pm10Grade
        +pm25: number
        +pm25Grade: Pm10Grade
        +source: WeatherSlotSource
    }
    class DongWeather {
        +dongCode: string
        +dongName: string
        +nx: number
        +ny: number
        +hourly: HourlyWeather[]
    }
    class SeoulMonthlyWeather {
        +baseDate: string
        +rangeStart: string
        +rangeEnd: string
        +dongs: DongWeather[]
        +sourceErrors?: WeatherSourceError[]
        +activeSources?: WeatherSourceKey[]
    }
    class MonthAvailability {
        +month: string
        +availableDates: string[]
        +sourceAvailability
    }
    class WeatherMetrics {
        +temperature: number
        +precipitation: number
        +windSpeed: number
        +humidity: number
    }
    class SuitabilityResult {
        +score: number
        +tags: string[]
    }
    class RecommendedRoute {
        +routeId: string
        +title: string
        +score: number
        +tags: string[]
    }

    SeoulMonthlyWeather "1" --> "*" DongWeather
    DongWeather "1" --> "*" HourlyWeather
    WeatherMetrics ..> SuitabilityResult : compute()
    SuitabilityResult ..> RecommendedRoute
```

## 원본 응답 클래스 (adapter 입력)

외부 API의 원본 응답을 그대로 받는 클래스도 정의되어 있습니다. adapter 가 원본 → 도메인 객체로 변환.

| Class                         | 출처                       | adapter                 |
| ----------------------------- | -------------------------- | ----------------------- |
| `KmaObservedOriginalResponse` | 기상청 TYP01 관측 텍스트   | `observed.adapter.ts`   |
| `VilageFcstOriginalResponse`  | 기상청 동네예보 API        | `forecast.adapter.ts`   |
| `AirKoreaOriginalResponse`    | 에어코리아 실시간 대기오염 | `airquality.adapter.ts` |

## 통합 흐름

```mermaid
flowchart LR
    F["forecast<br/>(VilageFcst)"] -.adapt.-> H1["HourlyWeather[]"]
    O["observed<br/>(KMA TYP01)"] -.adapt.-> H2["HourlyWeather[]"]
    A["airquality<br/>(AirKorea)"] -.adapt.-> H3["pm10/pm25"]
    H1 --> M["merge.service<br/>(시간대 정합)"]
    H2 --> M
    H3 --> M
    M --> R["SeoulMonthlyWeather"]
```

## 관련 API

| Method | Path                               | 용도              |
| ------ | ---------------------------------- | ----------------- |
| GET    | `/api/weather/:date`               | 특정 날짜 시간별  |
| GET    | `/api/weather/monthly/:month`      | 월별              |
| GET    | `/api/weather/availability/:month` | 가용일 (캘린더용) |
| GET    | `/api/routes/recommend`            | 날씨 기반 추천    |

## 관련 코드

- 타입 — `shared/types/weather.ts`, `shared/types/weather-recommend.ts`
- 스키마 — `shared/schemas/weather.schema.ts`
- 서비스 — `server/services/weather/*` (forecast, observed, airquality, merge, weather)
- 프론트 — `app/entities/weather/`, `app/features/weather-overlay/`
