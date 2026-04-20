# Design Patterns — 2026 Modern Reference

> 2026.04.20 기준, 실무에서 자주 사용되는 디자인 패턴을 계층별로 정리한다.
> 엄밀한 GoF 디자인 패턴만이 아니라, 현대 JS/TS 실무에서 사실상 함께 쓰이는 아키텍처·비동기·데이터 패턴까지 포함한다.

---

## 목차

1. [Creational Patterns](#1-creational-patterns)
2. [Structural Patterns](#2-structural-patterns)
3. [Behavioral Patterns](#3-behavioral-patterns)
4. [Architectural Patterns](#4-architectural-patterns)
5. [Frontend Patterns](#5-frontend-patterns)
6. [Backend / Server Patterns](#6-backend--server-patterns)
7. [Concurrency & Async Patterns](#7-concurrency--async-patterns)
8. [Data Patterns](#8-data-patterns)
9. [Anti-Patterns (피해야 할 것)](#9-anti-patterns)

---

## 1. Creational Patterns

### 1.1 Factory Method / Abstract Factory

객체 생성 로직을 호출부에서 분리한다. `new` 직접 호출 대신 팩토리 함수가 인스턴스를 반환한다.
현대 JS/TS에서는 고전적인 서브클래싱 기반 Factory Method보다 팩토리 함수나 provider 등록 방식이 더 흔하다.

```ts
// Factory Function (modern JS/TS 스타일)
function createRepository(type: 'memory' | 'drizzle'): RouteRepository {
  switch (type) {
    case 'memory': return new InMemoryRouteRepository()
    case 'drizzle': return new DrizzleRouteRepository()
  }
}
```

**언제 쓰나**: 런타임 조건에 따라 생성할 구현체가 달라질 때, DI 컨테이너 없이 의존성을 교체할 때.

### 1.2 Builder

복잡한 객체를 단계별로 조립한다. 선택적 필드가 많거나 생성 순서가 중요할 때 유용하다.

```ts
const query = new QueryBuilder()
  .select('id', 'name')
  .from('routes')
  .where('userId', '=', userId)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .build()
```

**언제 쓰나**: ORM 쿼리 빌더, HTTP 요청 구성, 복잡한 config 객체 조립.

### 1.3 Singleton

인스턴스를 하나만 유지한다. 모듈 스코프 변수로 자연스럽게 구현된다.
단, "애플리케이션 전체에서 절대 하나"를 뜻하지는 않는다. 서버리스 인스턴스, 워커, 테스트 프로세스, HMR 환경에서는 여러 개가 생길 수 있다.

```ts
// ES Module Singleton — export 자체가 singleton
let dbInstance: Database | null = null

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database(config)
  }
  return dbInstance
}
```

**언제 쓰나**: DB 커넥션 풀, 로거, 설정 객체. 남용하면 전역 상태 문제를 만든다. 프로세스/런타임 경계를 이해한 경우에만 제한적으로 사용한다.

---

## 2. Structural Patterns

### 2.1 Adapter

서로 다른 인터페이스를 통일한다. 외부 API 응답을 내부 도메인 모델로 변환할 때 핵심이다.

```ts
// 외부 API 응답 → 내부 도메인 모델
function adaptWeatherResponse(raw: OpenMeteoResponse): WeatherData {
  return {
    temperature: raw.current.temperature_2m,
    humidity: raw.current.relative_humidity_2m,
    description: mapWeatherCode(raw.current.weather_code),
  }
}
```

**언제 쓰나**: 외부 API 연동, 레거시 시스템 통합, 라이브러리 래핑.

### 2.2 Facade

복잡한 하위 시스템을 단순한 인터페이스 뒤에 숨긴다.

```ts
// 여러 composable을 조합한 Facade
function useRouteEditor() {
  const store = useRouteStore()
  const draw = useDrawPolyline()
  const optimize = useRouteOptimize()
  const elevation = useElevationProfile()

  return {
    startDrawing: () => draw.enable(),
    optimizeRoute: () => optimize.run(store.positions),
    getProfile: () => elevation.compute(store.positions),
  }
}
```

**언제 쓰나**: 여러 모듈을 조합해야 하는 진입점, 컴포넌트에서 복잡한 로직을 숨길 때.

### 2.3 Proxy

객체 접근을 가로채 추가 동작(캐싱, 로깅, 접근 제어)을 삽입한다.

```ts
// Vue 3의 reactivity 자체가 Proxy 패턴
const state = reactive({ count: 0 }) // 내부적으로 Proxy 사용

// API 캐싱 Proxy
function createCachedFetcher(fetcher: Fetcher): Fetcher {
  const cache = new Map()
  return {
    async fetch(url: string) {
      if (cache.has(url)) return cache.get(url)
      const result = await fetcher.fetch(url)
      cache.set(url, result)
      return result
    },
  }
}
```

**언제 쓰나**: 캐싱, 지연 로딩, 접근 제어, Vue/MobX 반응성 시스템.

### 2.4 Decorator

객체에 동적으로 책임을 추가한다. 함수 래퍼(HOF)나 TypeScript의 decorator 문법으로 구현한다.

```ts
// 함수 데코레이터 (HOF 스타일)
function withRetry<T>(fn: () => Promise<T>, retries = 3): () => Promise<T> {
  return async () => {
    for (let i = 0; i < retries; i++) {
      try { return await fn() }
      catch (e) { if (i === retries - 1) throw e }
    }
    throw new Error('unreachable')
  }
}

// TypeScript 5+ 표준 decorator 문법
class RouteService {
  @logged
  @cached(60_000)
  async findById(id: string) { /* ... */ }
}
```

**언제 쓰나**: 로깅, 캐싱, 인증 체크, 에러 재시도 등 횡단 관심사 부착.
참고: TypeScript의 표준 decorators와 legacy `experimentalDecorators`는 타입체크와 emit 동작이 다르다.

### 2.5 Composite

트리 구조를 단일 객체처럼 다룬다.

```ts
// 메뉴, 파일 트리, 경로 섹션 등
interface RouteNode {
  type: 'section' | 'waypoint'
  children?: RouteNode[]
  position?: GeoJsonPosition
}

function flattenRoute(node: RouteNode): GeoJsonPosition[] {
  if (node.type === 'waypoint') return [node.position!]
  return node.children?.flatMap(flattenRoute) ?? []
}
```

**언제 쓰나**: 트리 UI, 재귀 데이터 구조, 컴포넌트 트리 순회.

---

## 3. Behavioral Patterns

### 3.1 Strategy

알고리즘을 교체 가능한 객체로 캡슐화한다. 가장 자주 쓰이는 GoF 패턴 중 하나.

```ts
interface RouteOptimizer {
  optimize(positions: GeoJsonPosition[]): Promise<GeoJsonPosition[]>
}

class TMapOptimizer implements RouteOptimizer {
  async optimize(positions) { /* TMap API */ }
}

class OSRMOptimizer implements RouteOptimizer {
  async optimize(positions) { /* OSRM API */ }
}

// 사용부 — 전략만 교체하면 된다
function useRouteOptimize(strategy: RouteOptimizer) {
  return {
    run: (pos: GeoJsonPosition[]) => strategy.optimize(pos),
  }
}
```

**언제 쓰나**: 동일 인터페이스의 여러 구현(최적화 알고리즘, 인증 방식, 렌더러 등).

### 3.2 Observer / Pub-Sub

둘은 비슷하지만 동일한 패턴은 아니다.
Observer는 주체가 구독자를 직접 알고 알림을 보내고, Pub-Sub는 이벤트 버스/브로커를 사이에 둔다. 프론트엔드 반응성과 이벤트 시스템의 근간이다.

```ts
// Vue 3 — watch/watchEffect가 Observer 패턴
watch(drawnPositions, (newPos) => {
  updateElevationProfile(newPos)
  updateGradientOverlay(newPos)
})

// 커스텀 EventEmitter
class EventBus<T extends Record<string, unknown>> {
  private listeners = new Map<keyof T, Set<Function>>()

  on<K extends keyof T>(event: K, fn: (data: T[K]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(fn)
  }

  emit<K extends keyof T>(event: K, data: T[K]) {
    this.listeners.get(event)?.forEach(fn => fn(data))
  }
}
```

**언제 쓰나**: UI 반응성은 Observer에 가깝고, 이벤트 버스·메시지 브로커·WebSocket fan-out은 Pub-Sub에 가깝다.

### 3.3 Command

요청을 객체로 캡슐화해 실행·취소·대기열을 지원한다.

```ts
interface Command {
  execute(): void
  undo(): void
}

class AddWaypointCommand implements Command {
  constructor(private store: RouteStore, private position: GeoJsonPosition) {}
  execute() { this.store.addWaypoint(this.position) }
  undo() { this.store.removeLastWaypoint() }
}

// Undo/Redo 스택
class CommandHistory {
  private stack: Command[] = []
  private pointer = -1

  execute(cmd: Command) {
    cmd.execute()
    this.stack = this.stack.slice(0, this.pointer + 1)
    this.stack.push(cmd)
    this.pointer++
  }

  undo() {
    if (this.pointer >= 0) this.stack[this.pointer--].undo()
  }

  redo() {
    if (this.pointer < this.stack.length - 1) this.stack[++this.pointer].execute()
  }
}
```

**언제 쓰나**: Undo/Redo, 작업 큐, 트랜잭션, 매크로 기록.

### 3.4 State Machine

객체의 상태와 전이를 명시적으로 정의한다. 2024~2026 가장 부상한 패턴 중 하나.

```ts
type DrawState = 'idle' | 'drawing' | 'editing' | 'optimizing'

type DrawEvent =
  | { type: 'START_DRAW' }
  | { type: 'ADD_POINT'; position: GeoJsonPosition }
  | { type: 'FINISH' }
  | { type: 'OPTIMIZE' }
  | { type: 'RESET' }

function transition(state: DrawState, event: DrawEvent): DrawState {
  switch (state) {
    case 'idle':
      if (event.type === 'START_DRAW') return 'drawing'
      break
    case 'drawing':
      if (event.type === 'FINISH') return 'editing'
      if (event.type === 'RESET') return 'idle'
      break
    case 'editing':
      if (event.type === 'OPTIMIZE') return 'optimizing'
      if (event.type === 'RESET') return 'idle'
      break
    case 'optimizing':
      if (event.type === 'FINISH') return 'editing'
      break
  }
  return state
}
```

**언제 쓰나**: UI 흐름 제어, 폼 단계, 네트워크 요청 상태, 게임 로직, 워크플로우 엔진.

### 3.5 Chain of Responsibility

요청을 처리자 체인을 따라 전달한다. 미들웨어 패턴의 근간.

```ts
// Express/Nitro 미들웨어가 대표적인 예
type Middleware = (req: Request, res: Response, next: () => void) => void

const authMiddleware: Middleware = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).end()
  next()
}

const logMiddleware: Middleware = (req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
}
```

**언제 쓰나**: HTTP 미들웨어, 유효성 검증 체인, 로깅 파이프라인, 이벤트 필터.

---

## 4. Architectural Patterns

### 4.1 Dependency Injection (DI)

의존성을 외부에서 주입해 결합도를 낮춘다. 2026 현재 프레임워크 없이도 가장 널리 쓰이는 아키텍처 패턴.

```ts
// 생성자 주입
class RouteService {
  constructor(
    private repository: RouteRepository,
    private optimizer: RouteOptimizer,
  ) {}

  async createRoute(input: RouteInput) {
    const optimized = await this.optimizer.optimize(input.positions)
    return this.repository.save({ ...input, positions: optimized })
  }
}

// 함수형 DI (composable 스타일)
function useElevationLayer(options: {
  viewer: () => Cesium.Viewer
  positions: Ref<GeoJsonPosition[]>
}) {
  // options를 통해 의존성 주입
}
```

**언제 쓰나**: 거의 모든 곳. 테스트 용이성, 구현체 교체, 모듈 분리의 기본 수단.

### 4.2 Repository Pattern

데이터 접근 로직을 도메인 로직에서 분리한다.

```ts
// 인터페이스 (계약)
interface RouteRepository {
  findById(id: string): Promise<Route | null>
  findAll(): Promise<Route[]>
  save(route: RouteInput): Promise<Route>
  delete(id: string): Promise<void>
}

// 인메모리 구현체 (테스트·프로토타입)
class InMemoryRouteRepository implements RouteRepository {
  private routes = new Map<string, Route>()
  async findById(id: string) { return this.routes.get(id) ?? null }
  // ...
}

// Drizzle 구현체 (프로덕션)
class DrizzleRouteRepository implements RouteRepository {
  constructor(private db: DrizzleDatabase) {}
  async findById(id: string) {
    return this.db.query.routes.findFirst({ where: eq(routes.id, id) })
  }
  // ...
}
```

**언제 쓰나**: DB 접근 추상화, 테스트에서 인메모리 교체, 다중 데이터 소스 통합.

### 4.3 Layered Architecture

관심사를 계층으로 분리한다. 각 계층은 바로 아래 계층만 의존한다.

```
┌─────────────────┐
│   Presentation  │  pages, components, composables
├─────────────────┤
│   Application   │  use cases, facades, services
├─────────────────┤
│     Domain      │  types, schemas, business rules
├─────────────────┤
│ Infrastructure  │  repositories, API clients, DB
└─────────────────┘
```

**언제 쓰나**: 대부분의 웹 애플리케이션. 다만 실제 폴더 구조가 곧바로 계층 아키텍처와 일치하는 것은 아니며, 의존 방향을 명시적으로 관리해야 한다.

### 4.4 Modular Architecture (Feature-based)

기능 단위로 모듈을 구성한다. 2024~ 프론트엔드에서 가장 선호되는 구조.

```
features/
  route-editor/
    components/
    composables/
    types.ts
    index.ts        ← public API만 export
  weather/
    components/
    composables/
    types.ts
    index.ts
```

**언제 쓰나**: 중규모 이상 프로젝트, 팀 단위 소유권 분리, 마이크로프론트엔드 전환 대비.

### 4.5 Hexagonal Architecture (Ports & Adapters)

도메인 코어를 입력/출력 어댑터에서 완전히 분리한다.

```
              ┌─────────────┐
   Driving    │             │   Driven
   Adapters   │   Domain    │   Adapters
  (API, UI) → │   (Core)    │ → (DB, API)
              │             │
              └─────────────┘
      Ports ←─┘             └─→ Ports
```

```ts
// Port (인터페이스)
interface WeatherPort {
  getCurrentWeather(lat: number, lon: number): Promise<WeatherData>
}

// Adapter (구현체)
class OpenMeteoAdapter implements WeatherPort {
  async getCurrentWeather(lat: number, lon: number) {
    const raw = await fetch(`https://api.open-meteo.com/...`)
    return adaptWeatherResponse(await raw.json())
  }
}
```

**언제 쓰나**: 외부 의존성이 자주 바뀌는 시스템, 도메인 순수성이 중요한 프로젝트.

---

## 5. Frontend Patterns

### 5.1 Composable / Hook Pattern

상태 로직을 재사용 가능한 함수로 추출한다. Vue 3의 Composition API, React Hooks.

```ts
// 재사용 가능한 상태 로직 캡슐화
function useToggle(initial = false) {
  const value = ref(initial)
  const toggle = () => { value.value = !value.value }
  const setTrue = () => { value.value = true }
  const setFalse = () => { value.value = false }
  return { value: readonly(value), toggle, setTrue, setFalse }
}

// 도메인 로직 composable
function useRouteStore() {
  const routes = useState<Route[]>('routes', () => [])
  const selectedId = useState<string | null>('selectedRouteId', () => null)

  const selectedRoute = computed(() =>
    routes.value.find(r => r.id === selectedId.value) ?? null
  )

  function selectRoute(id: string) { selectedId.value = id }
  function clearSelection() { selectedId.value = null }

  return { routes, selectedRoute, selectRoute, clearSelection }
}
```

**언제 쓰나**: Vue 3 / React 프로젝트 전체. 로직 재사용의 1차 수단.

### 5.2 Compound Component

관련 컴포넌트를 하나의 네임스페이스로 묶어 유연한 조합을 제공한다.

```vue
<!-- 사용부 -->
<Drawer>
  <DrawerTrigger>열기</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>제목</DrawerHeader>
    <DrawerBody>내용</DrawerBody>
    <DrawerFooter>
      <DrawerClose>닫기</DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**언제 쓰나**: 모달, 드롭다운, 폼 그룹, 탭, 아코디언 등 구조적 UI.

### 5.3 Render Props / Scoped Slots

자식 컴포넌트가 부모에게 렌더링 제어권을 위임한다.
React에서는 custom hook과 headless component 조합에 밀려 비중이 줄었지만, Vue의 scoped slots와 headless UI에서는 여전히 핵심 패턴이다.

```vue
<!-- HoverTooltip.vue -->
<template>
  <div @mouseenter="show" @mouseleave="hide">
    <slot name="trigger" />
    <div v-if="visible" class="tooltip">
      <slot name="content" />
    </div>
  </div>
</template>
```

**언제 쓰나**: 유연한 UI 커스터마이징, headless 컴포넌트, 렌더링 위임.

### 5.4 Container / Presentational

데이터 로직(Container)과 순수 표현(Presentational)을 분리한다.
다만 2026 기준의 기본값은 "모든 컴포넌트를 기계적으로 둘로 나누기"가 아니라, 페이지/feature orchestration과 순수 UI를 필요한 곳만 분리하는 쪽에 가깝다.

```vue
<!-- Container: 데이터 처리 -->
<script setup>
const { routes, isLoading } = useRouteStore()
const { deleteRoute } = useRouteActions()
</script>
<template>
  <RouteList :routes="routes" :loading="isLoading" @delete="deleteRoute" />
</template>

<!-- Presentational: 순수 표현 -->
<script setup>
defineProps<{ routes: Route[]; loading: boolean }>()
defineEmits<{ delete: [id: string] }>()
</script>
<template>
  <ul>
    <li v-for="route in routes" :key="route.id">{{ route.name }}</li>
  </ul>
</template>
```

**언제 쓰나**: 컴포넌트 테스트 용이성, Storybook 호환, 디자이너·개발자 협업.

### 5.5 Optimistic Update

서버 응답 전에 UI를 먼저 갱신하고, 실패 시 롤백한다.

```ts
async function deleteRoute(id: string) {
  const backup = [...routes.value]
  routes.value = routes.value.filter(r => r.id !== id) // 즉시 반영

  try {
    await $fetch(`/api/routes/${id}`, { method: 'DELETE' })
  } catch {
    routes.value = backup // 롤백
    showError('삭제 실패')
  }
}
```

**언제 쓰나**: 좋아요, 삭제, 순서 변경 등 사용자 체감 속도가 중요한 인터랙션.

---

## 6. Backend / Server Patterns

### 6.1 Middleware Pipeline

요청·응답을 체인으로 가공한다. Nitro, Express, Koa의 핵심 구조.

```ts
// Nitro server middleware
export default defineEventHandler((event) => {
  // 요청 전처리
  event.context.startTime = Date.now()
})

// API handler (미들웨어 이후 실행)
export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readValidatedBody(event, routeSchema.parse)
  return routeRepository.save(body)
})
```

### 6.2 Service Layer

비즈니스 로직을 API 핸들러에서 분리한다.

```ts
// Service — 비즈니스 규칙 담당
class WeatherService {
  constructor(
    private observedAdapter: ObservedAdapter,
    private forecastAdapter: ForecastAdapter,
    private mergeService: MergeService,
  ) {}

  async getWeather(lat: number, lon: number): Promise<MergedWeather> {
    const [observed, forecast] = await Promise.all([
      this.observedAdapter.fetch(lat, lon),
      this.forecastAdapter.fetch(lat, lon),
    ])
    return this.mergeService.merge(observed, forecast)
  }
}

// API Handler — 얇게 유지
export default defineEventHandler(async (event) => {
  const { lat, lon } = getQuery(event)
  return weatherService.getWeather(Number(lat), Number(lon))
})
```

**언제 쓰나**: 비즈니스 로직이 복잡한 엔드포인트, 동일 로직을 여러 진입점에서 재사용할 때.

### 6.3 DTO (Data Transfer Object)

계층 간 데이터 전달 형태를 명시한다. Zod 스키마와 결합해 런타임 검증까지 수행.

```ts
// shared/schemas/route.schema.ts
const routeInputSchema = z.object({
  name: z.string().min(1).max(100),
  positions: z.array(geoJsonPositionSchema).min(2),
  description: z.string().optional(),
})

type RouteInput = z.infer<typeof routeInputSchema>

// API handler에서 검증
const body = await readValidatedBody(event, routeInputSchema.parse)
```

**언제 쓰나**: API 경계, 폼 입력 검증, 계층 간 데이터 계약 명시.

### 6.4 Circuit Breaker

외부 서비스 장애가 전파되지 않도록 차단한다.

```ts
class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 30_000,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (e) {
      this.onFailure()
      throw e
    }
  }

  private onSuccess() { this.failures = 0; this.state = 'closed' }
  private onFailure() {
    this.failures++
    this.lastFailure = Date.now()
    if (this.failures >= this.threshold) this.state = 'open'
  }
}
```

**언제 쓰나**: 외부 API 호출, 마이크로서비스 간 통신, 장애 격리.

### 6.5 Backend for Frontend (BFF)

클라이언트 종류별로 얇은 서버 계층을 둬 응답 형태와 인증·집계를 최적화한다.

```ts
// web 전용 BFF endpoint
export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const [routes, weather] = await Promise.all([
    routeService.findByUser(session.user.id),
    weatherService.getSummaryForUser(session.user.id),
  ])

  return {
    routes: routes.map(toRouteCardDto),
    weather,
  }
})
```

**언제 쓰나**: 웹/모바일/파트너 API마다 필요한 데이터 shape가 다를 때, 프론트엔드별 인증·캐싱·집계 로직을 분리하고 싶을 때.

### 6.6 Idempotency Key

같은 요청이 재시도되더라도 서버에서 한 번만 처리되도록 보장한다. 결제, 예약, webhook 처리에서 사실상 필수 패턴이다.

```ts
async function createOrder(event: H3Event) {
  const key = getHeader(event, 'idempotency-key')
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing idempotency key' })

  const cached = await idempotencyStore.find(key)
  if (cached) return cached.response

  const result = await orderService.create(await readBody(event))
  await idempotencyStore.save(key, { response: result })

  return result
}
```

**언제 쓰나**: 재시도가 가능한 쓰기 요청, 외부 결제/주문 API, 중복 webhook 수신 처리.

---

## 7. Concurrency & Async Patterns

### 7.1 Promise Pipeline / Async Composition

비동기 작업을 선언적으로 조합한다.

```ts
// 병렬 실행
const [weather, elevation, boundary] = await Promise.all([
  fetchWeather(lat, lon),
  fetchElevation(positions),
  fetchBoundary(regionCode),
])

// 순차 파이프라인
const result = await pipe(
  fetchRawData,
  validate,
  transform,
  persist,
)(input)

// Promise.allSettled — 일부 실패 허용
const results = await Promise.allSettled([
  fetchFromSourceA(),
  fetchFromSourceB(),
  fetchFromSourceC(),
])
const successes = results.filter(r => r.status === 'fulfilled')
```

### 7.2 Debounce / Throttle

고빈도 이벤트를 제어한다.

```ts
// Debounce — 마지막 호출 후 대기
function useDebouncedSearch(delay = 300) {
  const query = ref('')
  const results = ref([])

  const search = useDebounceFn(async (q: string) => {
    results.value = await $fetch(`/api/search?q=${q}`)
  }, delay)

  watch(query, (q) => search(q))

  return { query, results }
}

// Throttle — 일정 간격으로 실행
const handleScroll = useThrottleFn(() => {
  updateVisibleItems()
}, 100)
```

### 7.3 Queue / Worker Pattern

무거운 작업을 대기열로 관리한다.

```ts
class TaskQueue {
  private queue: (() => Promise<void>)[] = []
  private running = 0

  constructor(private concurrency = 3) {}

  async add(task: () => Promise<void>) {
    this.queue.push(task)
    this.drain()
  }

  private async drain() {
    while (this.queue.length > 0 && this.running < this.concurrency) {
      const task = this.queue.shift()!
      this.running++
      task().finally(() => { this.running--; this.drain() })
    }
  }
}
```

**언제 쓰나**: 이미지 처리, 대량 API 호출, 파일 업로드, 타일 로딩.

### 7.4 Retry with Exponential Backoff

일시적 장애에 대해 곧바로 포기하지 않고, 간격을 늘리며 재시도한다.
`Retry`는 `Circuit Breaker`와 자주 함께 쓰이며, 쓰기 작업에서는 `Idempotency`와 함께 설계해야 한다.

```ts
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 200,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === retries) break

      const delay = baseDelay * 2 ** attempt
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
```

**언제 쓰나**: 외부 API, 네트워크 IO, rate limit 복구, 일시적 DB/캐시 장애.

---

## 8. Data Patterns

### 8.1 Normalize / Denormalize

중첩 데이터를 ID 기반 평탄 구조로 정규화한다.

```ts
// 정규화
interface NormalizedState {
  routes: Record<string, Route>
  waypoints: Record<string, Waypoint>
  ids: string[]
}

function normalize(routes: Route[]): NormalizedState {
  const state: NormalizedState = { routes: {}, waypoints: {}, ids: [] }
  for (const route of routes) {
    state.routes[route.id] = { ...route, waypoints: undefined }
    state.ids.push(route.id)
    for (const wp of route.waypoints ?? []) {
      state.waypoints[wp.id] = wp
    }
  }
  return state
}
```

**언제 쓰나**: 복잡한 관계형 데이터의 클라이언트 캐싱, 상태 관리에서 중복 제거.

### 8.2 Immutable Update

상태를 직접 변경하지 않고 새 객체를 생성한다.

```ts
// Spread 기반
const updated = {
  ...route,
  name: newName,
  updatedAt: new Date(),
}

// Array 불변 갱신
const withoutDeleted = routes.filter(r => r.id !== deletedId)
const withAdded = [...routes, newRoute]
const withUpdated = routes.map(r => r.id === id ? { ...r, ...changes } : r)

// structuredClone (deep copy)
const deepCopy = structuredClone(complexObject)
```

**언제 쓰나**: Vue/React 반응성 감지, 상태 히스토리(Undo), 예측 가능한 상태 전이.

### 8.3 Schema-First Design

타입과 검증을 스키마에서 파생한다. Zod, Valibot 등.

```ts
// 스키마가 Single Source of Truth
const routeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  positions: z.array(geoJsonPositionSchema),
  createdAt: z.date(),
})

// 타입은 스키마에서 파생
type Route = z.infer<typeof routeSchema>

// 입력 스키마는 기본 스키마에서 파생
const routeInputSchema = routeSchema.omit({ id: true, createdAt: true })
type RouteInput = z.infer<typeof routeInputSchema>
```

**언제 쓰나**: API 계약, 폼 검증, DB 스키마 동기화, OpenAPI 생성.

### 8.4 Cache-Aside

읽기 요청 시 먼저 캐시를 조회하고, 미스가 나면 원본 저장소에서 읽은 뒤 캐시에 채운다.
2026 기준에도 가장 보편적인 캐싱 패턴이다.

```ts
async function getRouteById(id: string): Promise<Route | null> {
  const cacheKey = `route:${id}`

  const cached = await cache.get<Route>(cacheKey)
  if (cached) return cached

  const route = await repository.findById(id)
  if (route) {
    await cache.set(cacheKey, route, { ttl: 300 })
  }

  return route
}
```

**언제 쓰나**: 읽기 비중이 높은 API, 상세 조회, 설정값/참조 데이터, 느린 외부 조회 결과 캐싱.

---

## 9. Anti-Patterns

피해야 할 패턴과 대안.

| Anti-Pattern | 문제 | 대안 |
|---|---|---|
| **God Object** | 하나의 클래스/파일이 모든 책임을 가짐 | 단일 책임 원칙(SRP)으로 분리 |
| **Prop Drilling** | 깊은 컴포넌트 트리를 따라 props 전달 | provide/inject, composable store |
| **Premature Abstraction** | 사용처 1개인데 추상화 | 3번 반복될 때까지 인라인 유지 |
| **Spaghetti State** | 여러 곳에서 상태를 직접 변경 | 단방향 데이터 흐름, store 패턴 |
| **Callback Hell** | 중첩 콜백으로 가독성 저하 | async/await, Promise 조합 |
| **Magic Numbers/Strings** | 의미 없는 리터럴 산재 | 상수, enum, 설정 객체로 추출 |
| **Copy-Paste Programming** | 동일 로직 여러 곳에 복붙 | 공통 함수/composable 추출 (3회 반복 시) |
| **Leaky Abstraction** | 내부 구현이 인터페이스 밖으로 노출 | 경계를 명확히 하고 계약 준수 |
| **Over-Engineering** | 당장 필요 없는 확장성 설계 | YAGNI — 현재 요구사항에 집중 |
| **Barrel File Bloat** | index.ts가 모든 것을 re-export | 필요한 것만 직접 import |

---

## 패턴 선택 가이드

```
문제 식별 → 패턴 후보 선택 → 현재 복잡도에 맞는지 검증 → 적용

질문 체크리스트:
1. 이 패턴 없이 코드가 더 단순한가? → 패턴 불필요
2. 같은 구조가 3번 이상 반복되는가? → 패턴 적용 검토
3. 테스트가 어려운가? → DI, Strategy, Adapter 검토
4. 상태 전이가 복잡한가? → State Machine 검토
5. 외부 의존성이 자주 바뀌는가? → Adapter, Hexagonal 검토
6. 재시도 가능한 외부 호출인가? → Retry, Circuit Breaker, Idempotency 검토
7. 클라이언트마다 응답 형태가 크게 다른가? → BFF 검토
8. 읽기 요청이 압도적으로 많은가? → Cache-Aside 검토
```

> **원칙**: 패턴은 문제를 해결하기 위해 존재한다. 패턴을 적용하기 위해 문제를 찾지 않는다.
