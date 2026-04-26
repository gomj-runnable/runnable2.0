# Minikube 로컬 배포

Runnable 앱을 minikube 클러스터에 배포하는 스크립트와 매니페스트 모음.

## 사전 요구사항

- [Colima](https://github.com/abiosoft/colima) (Docker 런타임, **메모리 8GB 이상** 필요)
- [minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

### Colima 설정

Nuxt 빌드에 메모리가 많이 필요하므로 Colima를 충분한 리소스로 시작해야 한다.

```bash
# 최초 시작 또는 리소스 변경 시
colima stop
colima start --memory 8 --cpu 4
```

Colima가 실행 중이면 minikube가 자동으로 docker 드라이버를 감지한다.

## 구조

```
minikube/
├── deploy.sh          # 원클릭 배포 스크립트
├── Dockerfile         # 멀티스테이지 빌드 (node:20-slim)
├── webhook/
│   ├── server.mjs     # ghcr.io 이미지 polling + 자동 배포
│   └── Dockerfile     # image-watcher 컨테이너 이미지
└── k8s/
    ├── namespace.yaml # runnable 네임스페이스
    ├── secret.yaml    # DB 자격증명, API 키
    ├── configmap.yaml # 앱 환경변수
    ├── postgres.yaml  # PostgreSQL + PVC + Service
    ├── app.yaml       # Nuxt 앱 Deployment + NodePort Service
    └── webhook.yaml   # Image Watcher (ServiceAccount, RBAC, Deployment, Service)
```

## 배포

```bash
cd minikube
bash deploy.sh
```

이 스크립트가 수행하는 작업:

1. minikube 상태 확인 (꺼져 있으면 자동 시작)
2. minikube Docker 환경으로 전환 (`eval $(minikube docker-env)`)
3. 프로젝트 루트에서 Docker 이미지 빌드 (`runnable-app:latest`)
4. k8s 리소스 순서대로 적용 (namespace → secret → configmap → postgres → app)
5. PostgreSQL, App 롤아웃 완료 대기

## 접속

배포 완료 후:

```bash
# 방법 1: minikube service 명령 (터미널이 열려 있는 동안만 유지)
minikube service runnable-app -n runnable

# 방법 2: port-forward (백그라운드, localhost + 외부 접속 가능)
kubectl -n runnable port-forward --address 0.0.0.0 svc/runnable-app 3000:3000 &
```

방법 2를 사용하면:
- `http://localhost:3000` 으로 로컬 접속
- Tailscale 등 외부 네트워크에서 `http://<IP>:3000` 으로 원격 접속

## 환경변수 수정

- **DB 자격증명, API 키**: `k8s/secret.yaml`의 `stringData` 수정
- **앱 설정** (DB 모드, 라우트 모드 등): `k8s/configmap.yaml`의 `data` 수정

수정 후 재적용:

```bash
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl -n runnable rollout restart deployment/runnable-app
```

## 자동 배포 (Image Watcher)

`image-watcher`는 ghcr.io의 이미지 digest를 60초 간격으로 polling하여 변경을 감지하면 자동으로 deployment를 업데이트한다.

### 동작 흐름

```
GitHub push (master)
  → GitHub Actions (deploy.yml)
    → ghcr.io/all4land-runnable/runnable2.0:latest push
      → image-watcher Pod가 digest 변경 감지
        → K8s API로 runnable-app deployment 자동 롤링 업데이트
```

### 요구사항

- ghcr.io 패키지가 **public**이어야 anonymous polling 가능
- private인 경우 ghcr.io 인증 토큰을 K8s Secret으로 추가 필요

### 설정 변경

`k8s/webhook.yaml`의 환경변수를 수정:

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `GHCR_IMAGE` | `ghcr.io/all4land-runnable/runnable2.0` | 감시할 이미지 |
| `IMAGE_TAG` | `latest` | 감시할 태그 |
| `POLL_INTERVAL` | `60` | polling 주기 (초) |

### 로그 확인

```bash
kubectl -n runnable logs -f deployment/image-watcher
```

## 유용한 명령어

```bash
# 파드 상태 확인
kubectl get pods -n runnable

# 앱 로그 확인
kubectl logs -n runnable -l app=runnable-app -f

# PostgreSQL 로그 확인
kubectl logs -n runnable -l app=postgres -f

# 전체 리소스 삭제
kubectl delete namespace runnable

# minikube 중지
minikube stop
```

## 트러블슈팅

### Docker 빌드 중 OOM (exit code 137)

Colima 메모리가 부족하면 `pnpm build` 단계에서 프로세스가 죽는다.

```bash
colima stop
colima start --memory 8 --cpu 4
```

### minikube 시작 실패 (K8S_APISERVER_MISSING)

기존 클러스터가 깨진 상태일 때 발생한다. 삭제 후 재시작:

```bash
minikube delete
minikube start
```

### 좀비 zsh 프로세스로 CPU 과부하

minikube/Docker 작업 후 zsh 프로세스가 CPU를 과도하게 점유할 수 있다.

```bash
# CPU 10% 이상인 zsh 확인
ps aux | grep zsh | awk '$3 > 10 {print $2, $3"%"}'

# 해당 PID 제거
kill <PID>
```
