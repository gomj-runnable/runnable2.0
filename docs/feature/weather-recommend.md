# 날씨 기반 경로 추천

현재 날씨를 자동으로 분석해 러닝에 적합한 공개 경로를 최대 5개 추천하는 기능이다.
기온·강수·바람 세 가지 기상 지표를 가중 합산해 0–100점의 적합도 점수를 산출하고,
경로별 고저차·거리를 보정한 뒤 상위 경로를 카드 목록으로 제공한다.

---

## 사용 방법 (고객 관점)

### 추천 카드 확인

지도 화면 진입 시 날씨 기반 추천이 자동으로 실행된다.
패널 상단에 "오늘의 추천 경로 · AI 추천" 배지가 표시되고, 데이터를 불러오는 동안
스피너("추천 경로를 불러오는 중...")가 나타난다.

로딩이 끝나면 적합도 점수 순으로 정렬된 경로 카드가 최대 5개 표시된다.
각 카드에는 다음 정보가 포함된다.

- 경로 제목
- 거리 및 고저차 정보
- 적합도 점수 (0–100)
- 날씨 상황을 설명하는 자동 생성 태그 (예: `#달리기좋은날`, `#더위주의`)

### 경로 지도 보기

카드를 클릭하면 해당 경로가 지도 위에 표시되고 구간 상세 패널이 함께 열린다.

### 빈 상태

현재 날씨 조건에 어울리는 공개 경로가 없을 경우 다음 메시지가 표시된다.

> 현재 날씨에 맞는 공개 경로가 없습니다.

---

## 기술 구현 (개발 관점)

### 아키텍처

```
페이지 마운트
    │
    ▼
useWeatherRecommendSideeffect.fetchRecommendedRoutes()
    │  GET /api/routes/recommend?limit=5
    ▼
recommend.get.ts (Nitro 핸들러)
    ├─ weatherService.requestByDate()   ← 현재 날씨 조회
    └─ routeRepository.searchPublicRoutes()   ← 공개 경로 목록 조회
         │ (Promise.all 병렬 실행)
         ▼
    resolveCurrentWeather()   ← KST 기준 현재 시각 슬롯 추출, 서울 전체 평균
         ▼
    calculateSuitability()   ← 경로별 점수·태그 계산
         ▼
    score 내림차순 정렬 → 상위 N개 반환
    │
    ▼
useWeatherRecommendStore.setRoutes()   ← 전역 상태 반영
    │
    ▼
WeatherRecommendPanel   ← 카드 목록 렌더링
```

날씨 데이터 조회와 공개 경로 조회는 `Promise.all`로 병렬 실행된다.
어느 한 쪽이 실패해도 `catch`로 graceful fallback 처리되므로 빈 목록 또는 기본 날씨값으로 계속 동작한다.

### 주요 파일

| 파일 | 역할 |
|---|---|
| `app/composables/store/useWeatherRecommendStore.ts` | `useState` 기반 추천 경로 목록·로딩 상태 전역 관리 |
| `app/composables/sideeffect/useWeatherRecommendSideeffect.ts` | `/api/routes/recommend` 호출, store 반영 |
| `app/components/map/templates/WeatherRecommendPanel.vue` | 추천 패널 템플릿 (로딩 / 목록 / 빈 상태 분기) |
| `app/components/map/molecules/WeatherRecommendCard.vue` | 경로 카드 단위 컴포넌트 |
| `server/api/routes/recommend.get.ts` | 날씨 조회, 경로 조회, 점수 계산, 정렬 후 반환 |
| `shared/types/weather-recommend.ts` | `RecommendedRoute`, `WeatherMetrics` 공용 타입 |

### 추천 점수 알고리즘

점수는 0–100 범위의 정수로, 기상 3종 지표의 가중 합산 기본 점수에 경로 속성 보정치를 더해 산출한다.

#### 기본 점수 (base)

```
base = scoreTemperate(temperature) × 0.40
     + scoreRain(precipitation)    × 0.35
     + scoreWind(windSpeed)        × 0.25
```

**기온 점수 (weight 40%)**

| 기온 범위 | 점수 |
|---|---|
| 15°C 이상 25°C 이하 | 100 |
| 10°C 이상 15°C 미만 | 80 |
| 25°C 초과 30°C 이하 | 75 |
| 5°C 이상 10°C 미만 | 55 |
| 30°C 초과 35°C 이하 | 40 |
| 0°C 이상 5°C 미만 | 30 |
| 35°C 초과 | 15 |
| 0°C 미만 | 10 |

**강수 점수 (weight 35%)**

| 강수량 (mm/h) | 점수 |
|---|---|
| 0 (없음) | 100 |
| 0 초과 1 미만 | 60 |
| 1 이상 5 미만 | 30 |
| 5 이상 | 5 |

**바람 점수 (weight 25%)**

| 풍속 (m/s) | 점수 |
|---|---|
| 5 미만 | 100 |
| 5 이상 10 미만 | 70 |
| 10 이상 15 미만 | 40 |
| 15 이상 | 15 |

#### 경로 속성 보정 (bonus)

다음 조건에 따라 기본 점수에 보정치를 더하거나 뺀다.

| 조건 | 보정 |
|---|---|
| 완벽한 날씨 (15–25°C, 강수 없음, 풍속 5 미만) + 고저차 100m 초과 | +5 |
| 혹한·혹서·강수 + 고저차 200m 초과 | -10 |
| 혹한·혹서·강수 + 고저차 50m 이하 (평탄 경로) | +5 |
| 혹한·혹서·강수 + 거리 5km 이하 (단거리) | +8 |
| 혹한·혹서·강수 + 거리 10km 초과 (장거리) | -8 |

> 혹서: 기온 30°C 초과 / 혹한: 기온 0°C 미만 / 강수: 강수량 0 초과

최종 점수는 `Math.max(0, Math.min(100, Math.round(base + bonus)))`로 0–100 범위에 고정된다.

#### 자동 태그 생성 규칙

| 조건 | 생성 태그 |
|---|---|
| 완벽한 날씨 | `#달리기좋은날` |
| 완벽한 날씨 + 고저차 100m 초과 | `#전망맛집` |
| 강수 + 거리 5km 이하 | `#비올때도OK` |
| 풍속 10m/s 이상 | `#바람주의` |
| 혹서 | `#더위주의` |
| 혹서 + 거리 5km 이하 | `#단거리추천` |
| 혹한 | `#추위주의` |
| 혹한 + 거리 5km 이하 | `#단거리추천` |
| 고저차 200m 초과 + 완벽한 날씨 (미태그 시) | `#전망맛집` |

### API

#### `GET /api/routes/recommend`

날씨 적합도 기준으로 정렬된 공개 경로 목록을 반환한다.

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `limit` | `number` | `5` | 반환할 경로 최대 수 (상한 20) |

**Response** `RecommendedRoute[]`

```ts
interface RecommendedRoute {
    routeId: string
    title: string
    distance?: number      // 미터 단위
    highHeight?: number    // 최고 고도 (m)
    lowHeight?: number     // 최저 고도 (m)
    score: number          // 적합도 점수 0–100
    tags: string[]         // 자동 생성 태그 목록
}
```

**날씨 데이터 소스**

현재 날씨는 `weatherService.requestByDate()`를 통해 공공 날씨 API에서 조회한다.
서울 각 동(洞)의 시간별 슬롯 중 KST 현재 시각에 가장 가까운 값을 추출해 전체 평균을 낸다.
날씨 API 조회 실패 시 기본값(기온 20°C, 강수 0, 풍속 3m/s, 습도 60%)으로 대체된다.
