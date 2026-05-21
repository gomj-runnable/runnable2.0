# minikube 자원 사용 진단 (#249)

조사 시점: 2026-05-21 (KST). prod 컨테이너가 502 떨어지면서 `minikube status` 가 `InsufficientStorage` 경고. 사용자 코멘트 — "어디선가 메모리 누수나 불필요한 메모리 사용". 데이터 기반 진단 + 해결 방안.

## TL;DR

- **디스크**: minikube 노드 overlay 파일시스템 **98GB 중 92GB 점유 (99%)**, free 1019MB.
- **원인**: Docker 이미지 **53.73GB / 99% (53.22GB) 가 reclaimable**. **132개 dangling image** 누적.
- **누적 패턴**: Jenkins `pnpm build` 마다 `docker build --no-cache -t runnable-app:latest` + `runnable-migrate:latest` 가 새 layer 생성 → 직전 layer 가 untagged 로 남음. 정리 단계 없음.
- **메모리(RAM)**: `kubectl top` 호출이 `Metrics API not available` 로 실패. metrics-server addon 미설치 → 정량 측정 불가.

본질은 메모리 누수가 아니라 **빌드 산출물(이미지 layer) 누수**. RAM 사용량은 측정조차 안 되는 상태로, 우선 metrics-server 부터 활성화 후 별도 진단 권장.

## 데이터

### 1. 디스크 점유

```
overlay  98G  92G  1019M  99% /
```

### 2. Docker 자원 분포

```
TYPE       TOTAL  ACTIVE  SIZE      RECLAIMABLE
Images     151    13      53.73GB   53.22GB (99%)
Containers 40     21      35.9MB    35.9MB (99%)
Volumes    0      0       0B        0B
Build Cache 0     0       0B        0B
```

- **151 이미지 중 138개가 사용 안 됨** (active 13 = 실행 중인 컨테이너가 참조하는 layer 만 살아있음).
- Volume / Build Cache 는 0 — 정리 대상 아님.

### 3. Dangling 이미지

```
docker images --filter dangling=true | wc -l   → 132
```

크기 샘플 (반복 패턴):

```
175MB, 363MB, 917MB, 363MB, 917MB, 363MB, 917MB, ...
```

- `runnable-app:latest`: 363MB (현재 tagged) — 이전 빌드 363MB 가 untagged 로 잔존.
- `runnable-migrate:latest`: 917MB (현재 tagged) — 같은 패턴.
- 보수적 추정: stale `runnable-app` × N + stale `runnable-migrate` × N ≈ 약 **38GB 이상이 두 이미지의 옛 layer**.

### 4. 누적 메커니즘

`Jenkinsfile` 의 빌드 단계:

```bash
docker build --no-cache -t runnable-migrate:latest -f minikube/Dockerfile.migrate .
docker build --no-cache -t runnable-app:latest     -f minikube/Dockerfile .
```

- `--no-cache` → 매 빌드 layer cache 무시 + 새 layer 생성.
- `-t name:latest` → 새 layer 가 `:latest` 태그 가져가고 직전 layer 는 untagged.
- **빌드 후 정리(`docker image prune` 등) 단계 부재**.

`docker system prune` 같은 정리는 Jenkins 가 명시적으로 실행하지 않으면 영원히 안 됨. minikube node 의 자동 GC 도 dangling 까지는 안 건드림.

### 5. 메모리(RAM) 측정 시도

```
kubectl top node → error: Metrics API not available
kubectl top pod  → error: Metrics API not available
```

metrics-server addon 미설치. minikube 의 기본 addon 이지만 활성화는 별도. 정량 측정 불가.

## 해결 방안

### 즉시 (one-shot, destructive — 사용자 승인 필요)

dangling 이미지만 안전하게 제거:

```bash
minikube ssh -- 'docker image prune -f'
```

- 효과: 약 **35~50GB 회수** 예상.
- 위험: 사용 중인 layer 는 보존 (active 컨테이너가 참조하면 prune 대상에서 제외).

전체 stale 컨테이너까지:

```bash
minikube ssh -- 'docker container prune -f && docker image prune -f'
```

### 자동화 (PR)

`Jenkinsfile` 의 Deploy stage 끝에 정리 추가:

```bash
docker image prune -f
```

이러면 매 빌드 후 stale layer 가 자동으로 회수돼 누적이 안 됨.

### 빌드 최적화 (별도 작업)

- `--no-cache` 가 정말 필요한지 재검토. dev 운영용 minikube 라면 layer cache 활용 → 빌드 빠르고 layer 적게.
- `runnable-migrate:latest` 가 917MB 인데 실제 코드 부피는 작음 — multi-stage build 또는 `pnpm install --prod` 만 별도 layer 분리로 사이즈 축소 가능. 별도 이슈 권장.

### 메모리(RAM) 진단

```bash
minikube addons enable metrics-server
```

활성화 후 `kubectl top node` / `kubectl top pod -n runnable` 으로 정량 측정 → 진짜 메모리 누수가 있다면 별도 이슈로 추적.

## 권장 진행 순서

1. **사용자 승인 후 즉시 prune**: `minikube ssh -- 'docker image prune -f'`. 약 35~50GB 회수 즉시 확보.
2. **본 PR (#249 후속)**: Jenkinsfile 에 빌드 후 prune 추가.
3. **별도 이슈**: `Dockerfile.migrate` 사이즈 축소, metrics-server 활성화 후 RAM 진단.

## 참고

- 관련 이슈: #249 (디스크 정리), #250 (portforward-watch storage bypass — PR #251 머지로 회복력 확보)
- 본 PR: Jenkinsfile 에 자동 prune 단계 추가.
