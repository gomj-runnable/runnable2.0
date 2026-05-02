// =============================================================================
// Jenkinsfile — Runnable CI/CD Pipeline
//
// 트리거: master push / 수동
// 흐름: 품질검사 → 빌드 → 인프라 → Docker Hub → DB 마이그레이션 → 배포 → 공개
// =============================================================================

pipeline {
    agent any

    environment {
        BUILD_TAG    = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'manual'}"
        PATH         = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        DOCKER_IMAGE = "myeongjunkim0615/runnable"
        LOCAL_PORT   = "31000"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    triggers {
        githubPush()
    }

    stages {
        // ── 1. 품질 검사 ──
        stage('Install') {
            steps {
                sh '''
                    corepack enable
                    corepack prepare pnpm@10.28.2 --activate
                    pnpm install --frozen-lockfile
                '''
            }
        }

        stage('Lint') {
            steps { sh 'pnpm lint' }
        }

        stage('Typecheck') {
            steps { sh 'pnpm typecheck' }
        }

        stage('Test') {
            steps { sh 'pnpm test' }
        }

        // ── 2. 호스트 빌드 ──
        stage('Build') {
            steps {
                sh 'pnpm build'
            }
        }

        // ── 3. 인프라 준비 (Colima + minikube) ──
        stage('Infra') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    echo "==> Docker 데몬 확인"
                    if ! docker info &>/dev/null; then
                        echo "    Docker 연결 실패 — Colima 재시작"
                        colima stop 2>/dev/null || true
                        colima start
                    fi

                    echo "==> minikube 확인"
                    if ! minikube status &>/dev/null; then
                        echo "    minikube 시작"
                        minikube start
                    fi

                    echo "==> PostGIS 이미지 준비"
                    eval $(minikube docker-env)
                    docker pull imresamu/postgis:17-3.5-alpine 2>/dev/null || true

                    echo "==> 인프라 준비 완료"
                '''
            }
        }

        // ── 4. Docker Hub Push ──
        stage('Docker Push') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    docker build -t ${DOCKER_IMAGE}:latest -t ${DOCKER_IMAGE}:${BUILD_TAG} -f minikube/Dockerfile .
                    docker push ${DOCKER_IMAGE}:latest
                    docker push ${DOCKER_IMAGE}:${BUILD_TAG}

                    echo "==> Docker Hub: ${DOCKER_IMAGE}:${BUILD_TAG}"
                '''
            }
        }

        // ── 5. K8s 리소스 + DB 마이그레이션 + Seed ──
        stage('Migrate') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail
                    eval $(minikube docker-env)

                    echo "==> K8s 리소스 적용"
                    kubectl apply -f minikube/k8s/namespace.yaml
                    kubectl apply -f minikube/k8s/config/secret.prod.yaml
                    kubectl apply -f minikube/k8s/config/configmap.prod.yaml
                    kubectl apply -f minikube/k8s/postgres.yaml
                    kubectl -n runnable rollout status deployment/postgres --timeout=120s

                    echo "==> Migration 이미지 빌드 + 실행"
                    docker build --no-cache -t runnable-migrate:latest -f minikube/Dockerfile.migrate .
                    kubectl delete job runnable-migrate -n runnable --ignore-not-found
                    kubectl apply -f minikube/k8s/migration-job.yaml
                    kubectl wait --for=condition=complete job/runnable-migrate -n runnable --timeout=300s

                    echo "==> DB 마이그레이션 + Seed 완료"
                '''
            }
        }

        // ── 6. App 배포 + 외부 공개 ──
        stage('Deploy') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail
                    eval $(minikube docker-env)

                    echo "==> App 이미지 빌드 + Rolling Update"
                    docker build --no-cache -t runnable-app:latest -f minikube/Dockerfile .
                    kubectl apply -f minikube/k8s/app.yaml
                    kubectl -n runnable rollout restart deployment/runnable-app
                    kubectl -n runnable rollout status deployment/runnable-app --timeout=180s

                    echo "==> 포트포워드 설정"
                    lsof -ti:${LOCAL_PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true
                    nohup kubectl port-forward -n runnable svc/runnable-app ${LOCAL_PORT}:3000 --address=127.0.0.1 > /tmp/runnable-portforward.log 2>&1 &
                    sleep 3

                    echo "==> 헬스체크"
                    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${LOCAL_PORT}" --max-time 10 2>/dev/null || echo "000")
                    if [ "$HTTP_CODE" != "200" ]; then
                        echo "    경고: HTTP ${HTTP_CODE}"
                        kubectl -n runnable logs deployment/runnable-app --tail=10
                    else
                        echo "    OK (HTTP ${HTTP_CODE})"
                    fi

                    echo "==> Tailscale Funnel 연결"
                    if command -v tailscale &>/dev/null; then
                        tailscale funnel --https=443 off 2>/dev/null || true
                        tailscale funnel --bg --https=443 "http://localhost:${LOCAL_PORT}" || echo "    Funnel 설정 실패 (sudo 필요할 수 있음)"
                        echo "    외부 URL:"
                        tailscale funnel status 2>/dev/null | grep "https://" | head -1 || true
                    fi

                    echo "==> 배포 완료"
                '''
            }
        }
    }

    post {
        success { echo "Pipeline SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
        failure { echo "Pipeline FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
        cleanup { cleanWs() }
    }
}
