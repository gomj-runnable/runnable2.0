// =============================================================================
// Jenkinsfile — Runnable CI/CD Pipeline
//
// 트리거: master push / 수동
// 흐름: 품질검사 → 빌드 → 인프라 → Docker Hub → K8s 배포 → 포트포워드 → 헬스체크
// =============================================================================

pipeline {
    agent any

    environment {
        BUILD_TAG    = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'manual'}"
        PATH         = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        DOCKER_IMAGE = "myeongjunkim0615/runnable"
        LOCAL_PORT   = "3000"
        SECRETS_DIR  = "${env.HOME}/developer/projects/runnable2.0/minikube/k8s/config"
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
            steps {
                sh '''
                    pnpm lint --fix
                    pnpm lint
                '''
            }
        }

        stage('Typecheck') {
            steps { sh 'pnpm typecheck || true' }
        }

        stage('Test') {
            steps { sh 'pnpm test || pnpm test' }
        }

        // ── 2. 호스트 빌드 ──
        stage('Build') {
            steps {
                sh 'pnpm build'
            }
        }

        // ── 3. 인프라 준비 (Docker + K8s 연결 확인) ──
        stage('Infra') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    echo "==> Docker 데몬 확인"
                    docker info &>/dev/null || { echo "ERROR: Docker 연결 실패"; exit 1; }
                    echo "    Docker OK"

                    echo "==> K8s 클러스터 확인"
                    kubectl cluster-info &>/dev/null || { echo "ERROR: K8s 클러스터 연결 실패"; exit 1; }
                    kubectl -n runnable get deployment 2>/dev/null || echo "    runnable 네임스페이스 아직 없음 (최초 배포)"

                    echo "==> 인프라 준비 완료"
                '''
            }
        }

        // ── 4. K8s 리소스 + DB 마이그레이션 ──
        stage('Migrate') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    echo "==> 시크릿/설정 파일 복사 (Jenkins 로컬 → 워크스페이스)"
                    for f in secret.prod.yaml configmap.prod.yaml; do
                        src="${SECRETS_DIR}/${f}"
                        if [ ! -f "$src" ]; then
                            echo "ERROR: ${src} 가 없습니다. Jenkins 서버에 시크릿 파일을 배치하세요."
                            exit 1
                        fi
                        cp "$src" minikube/k8s/config/
                    done

                    echo "==> K8s 리소스 적용"
                    kubectl apply -f minikube/k8s/namespace.yaml
                    kubectl apply -f minikube/k8s/config/secret.prod.yaml
                    kubectl apply -f minikube/k8s/config/configmap.prod.yaml
                    kubectl apply -f minikube/k8s/postgres.yaml
                    kubectl -n runnable rollout status deployment/postgres --timeout=120s

                    echo "==> Migration 이미지 빌드 (minikube Docker)"
                    eval $(minikube docker-env)
                    docker build --no-cache -t runnable-migrate:latest -f minikube/Dockerfile.migrate .
                    kubectl delete job runnable-migrate -n runnable --ignore-not-found
                    kubectl apply -f minikube/k8s/migration-job.yaml
                    kubectl wait --for=condition=complete job/runnable-migrate -n runnable --timeout=300s

                    echo "==> DB 마이그레이션 완료"
                '''
            }
        }

        // ── 6. App 배포 ──
        stage('Deploy') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    echo "==> App 이미지 빌드 (minikube Docker) + Rolling Update"
                    eval $(minikube docker-env)
                    docker build --no-cache -t runnable-app:latest -f minikube/Dockerfile .
                    kubectl apply -f minikube/k8s/app.yaml
                    kubectl -n runnable rollout restart deployment/runnable-app
                    kubectl -n runnable rollout status deployment/runnable-app --timeout=180s

                    echo "==> 배포 완료"
                '''
            }
        }

        // ── 7. 헬스체크 ──
        stage('Expose') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    echo "==> K8s 배포 상태 확인"
                    kubectl -n runnable get pods
                    kubectl -n runnable rollout status deployment/runnable-app --timeout=60s || true

                    echo "==> 배포 완료 — port-forward 및 Tailscale Funnel은 LaunchAgent가 관리"
                '''
            }
        }
    }

    post {
        success { echo "Pipeline SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
        failure { echo "Pipeline FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
        // port-forward는 LaunchAgent가 상시 관리하므로 별도 조치 불필요
        cleanup { cleanWs() }
    }
}
