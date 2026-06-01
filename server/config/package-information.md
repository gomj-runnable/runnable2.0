# `server/config` 패키지 안내

서버 측 환경 변수를 **읽고 검증하는** 설정 모듈을 모아 둔 패키지입니다.
`dbMode.ts`, `envMode.ts`, `authMode.ts`, `authEnv.ts` 로 구성됩니다.

## 왜 Nuxt `runtimeConfig` 를 쓰지 않는가

Nuxt 에는 이미 `nuxt.config.ts` 의 `runtimeConfig` 가 있고, 외부 API 키 등은
실제로 거기서 관리됩니다(`weatherKor`, `openData`, `airKoreaKey`, `tmapApi`,
`routeMode`). 그런데도 DB/환경/인증 설정은 별도 패키지로 둡니다. 이유는 세 가지입니다.

### 1. `useRuntimeConfig()` 를 쓸 수 없는 곳에서 읽힌다 (결정적)

`useRuntimeConfig()` 는 Nitro 런타임 컨텍스트(이벤트 핸들러, 플러그인 setup 내부)
에서만 안전하게 동작합니다. 그러나 이 패키지의 값들은 다음처럼 그 밖에서 읽힙니다.

- **모듈 top-level 평가** — 예: `server/plugins/request-logging.ts` 가 모듈 로드
  시점에 `getEnvMode()` 를 즉시 평가
- **Nuxt 런타임 밖 standalone 스크립트** — 예: `server/database/seed.ts`
- **DB 연결 초기화 시점** — 예: `server/database/client.ts`

이런 위치에서는 `useRuntimeConfig()` 가 동작하지 않거나 불안정합니다.
`process.env` 는 어디서든 읽을 수 있습니다.

### 2. fail-fast 검증과 타입 안정성

`runtimeConfig` 값은 단순 `string` 입니다. 반면 이 패키지의 함수들은
허용값을 검증하고, 어긋나면 즉시 `throw` 하며, 좁은 유니온 타입을 반환합니다.

```ts
// runtimeConfig: 검증 없는 string
const rawMode = useRuntimeConfig().databaseMode // string

// config 패키지: 검증 + 'POSTGRES' | 'PGLITE' 유니온
const dbMode = getDbMode() // DbMode, 미설정/오타면 throw
```

부팅 시점에 잘못된 설정을 빠르게 드러내는 것이 목표입니다
(`server/plugins/00-boot-check.ts` 의 `assertProductionAuthEnv()` 참고).

### 3. 서버 전용 — 클라이언트 노출이 불필요

API 키 일부는 `runtimeConfig.public` 을 통해 클라이언트로 노출되어야 하지만,
DB/환경/인증 모드는 순수 서버 부팅 설정이라 노출 메커니즘이 필요 없습니다.

## `runtimeConfig` vs `server/config` 역할 구분

| 구분            | `runtimeConfig`                      | `server/config`                                      |
| --------------- | ------------------------------------ | ---------------------------------------------------- |
| 대상            | 외부 API 키·기능 플래그              | DB/환경/인증 모드                                    |
| 읽는 위치       | API 핸들러 안 (`useRuntimeConfig()`) | 플러그인·미들웨어·모듈 top-level·standalone 스크립트 |
| 검증            | 없음 (string)                        | 허용값 검증 + `throw`                                |
| 타입            | `string`                             | 좁은 유니온 타입                                     |
| 클라이언트 노출 | 가능 (`public`)                      | 없음 (서버 전용)                                     |

## 모듈

| 모듈          | 환경 변수                                                                      | 제공                                                                                          |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `dbMode.ts`   | `DATABASE_MODE`, `DATABASE_URL`                                                | `getDbMode()`, `getDatabaseUrl()`, `DATABASE_MODE`                                            |
| `envMode.ts`  | `ENVIRONMENT_MODE`                                                             | `getEnvMode()`, `ENVIRONMENT_MODE`                                                            |
| `authMode.ts` | (better-auth 인스턴스 팩토리)                                                  | `getAuthMode()`                                                                               |
| `authEnv.ts`  | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `PORT` | `getAuthSecret()`, `getAuthBaseURL()`, `getAuthTrustedOrigins()`, `assertProductionAuthEnv()` |

## 새 설정을 어디에 둘지 판단하는 기준

다음 세 조건을 **모두** 만족하면 이 패키지로, 아니면 `runtimeConfig` 로 둡니다.

1. 여러 곳에서 읽히거나 검증 로직이 분산될 수 있다
2. 부팅/평가 시점에 fail-fast 검증이 필요하다
3. 서버 전용이며 클라이언트 노출이 불필요하다

> 예시로, `LOG_LEVEL`(단일 사용처·단순 fallback)이나 seed 전용 변수
> (`ADMIN_SEED_*`, `DEVELOPER_SEED_*`)는 기준을 만족하지 않으므로
> 사용처에 그대로 둡니다.
