// =============================================================================
// Jenkinsfile — Runnable CI/CD Pipeline
//
// 트리거:
//   - GitHub Pull Request  → 코드 품질 검사만 (lint, typecheck, test)
//   - master 브랜치 push   → 품질 검사 + 호스트 빌드 + Minikube 배포
//   - 수동 (Build Now)     → 품질 검사 + 호스트 빌드 + Minikube 배포
//
// 빌드 전략:
//   - pnpm build는 호스트(macOS)에서 실행 (Node 20 Docker 빌드 시 Vue 번들 깨짐 방지)
//   - Docker 이미지는 빌드 결과(.output)만 복사하는 런타임 전용
// =============================================================================

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        BUILD_TAG      = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'manual'}"
        PATH           = "/opt/homebrew/bin:${env.PATH}"
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
        // =====================================================================
        // 1. 의존성 설치
        // =====================================================================
        stage('Install') {
            steps {
                sh '''
                    corepack enable
                    corepack prepare pnpm@10.28.2 --activate
                    pnpm install --frozen-lockfile
                '''
            }
        }

        // =====================================================================
        // 2. 코드 품질 검사
        // =====================================================================
        stage('Lint') {
            steps {
                sh 'pnpm lint'
            }
        }

        stage('Typecheck') {
            steps {
                sh 'pnpm typecheck'
            }
        }

        stage('Test') {
            steps {
                sh 'pnpm test'
            }
        }

        // =====================================================================
        // 3. 호스트에서 Nuxt 빌드 (macOS Node 환경)
        // =====================================================================
        stage('Build') {
            when {
                anyOf {
                    branch 'master'
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                sh 'pnpm build'
            }
        }

        // =====================================================================
        // 4. Docker 이미지 + Minikube 배포
        // =====================================================================
        stage('Deploy') {
            when {
                anyOf {
                    branch 'master'
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    export PATH="/opt/homebrew/bin:$PATH"

                    echo "==> minikube Docker 환경 설정"
                    eval $(minikube docker-env)

                    echo "==> App 이미지 빌드 (호스트 빌드 결과 복사)"
                    docker build --no-cache -t runnable-app:latest -f minikube/Dockerfile .

                    echo "==> Migrate 이미지 빌드"
                    docker build -t runnable-migrate:latest -f minikube/Dockerfile.migrate .

                    echo "==> K8s 설정 적용 (prod)"
                    kubectl apply -f minikube/k8s/namespace.yaml
                    kubectl apply -f minikube/k8s/config/secret.prod.yaml
                    kubectl apply -f minikube/k8s/config/configmap.prod.yaml
                    kubectl apply -f minikube/k8s/postgres.yaml

                    echo "==> PostgreSQL 준비 대기"
                    kubectl -n runnable rollout status deployment/postgres --timeout=120s

                    echo "==> DB 마이그레이션 실행"
                    kubectl delete job runnable-migrate -n runnable --ignore-not-found
                    kubectl apply -f minikube/k8s/migration-job.yaml
                    kubectl wait --for=condition=complete job/runnable-migrate -n runnable --timeout=120s

                    echo "==> App 배포"
                    kubectl apply -f minikube/k8s/app.yaml
                    kubectl rollout restart deployment/runnable-app -n runnable
                    kubectl rollout status deployment/runnable-app -n runnable --timeout=180s

                    echo "==> port-forward 재시작 (3000)"
                    pkill -f "kubectl port-forward.*runnable" 2>/dev/null || true
                    sleep 1
                    nohup kubectl port-forward -n runnable svc/runnable-app 3000:3000 --address=0.0.0.0 > /tmp/port-forward.log 2>&1 &
                    sleep 3

                    echo "==> 배포 확인"
                    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 10 || echo "000")
                    if [ "$HTTP_CODE" != "200" ]; then
                        echo "배포 실패: HTTP $HTTP_CODE"
                        kubectl -n runnable logs deployment/runnable-app --tail=20
                        exit 1
                    fi
                    echo "==> 배포 완료: HTTP $HTTP_CODE ($(date))"
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        failure {
            echo "Pipeline FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        cleanup {
            cleanWs()
        }
    }
}
