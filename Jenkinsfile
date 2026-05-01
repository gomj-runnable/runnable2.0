// =============================================================================
// Jenkinsfile — Runnable CI/CD Pipeline
//
// 트리거:
//   - GitHub Pull Request  → 코드 품질 검사만 (lint, typecheck, test)
//   - master 브랜치 push   → 품질 검사 + Nuxt 빌드 + Minikube 배포
//   - 수동 (Build Now)     → 품질 검사 + Nuxt 빌드 + Minikube 배포
//
// 사전 준비 (Jenkins 관리):
//   1. Tools:
//      - NodeJS 설치 (이름: 'NodeJS-20')  — Jenkins Global Tool Configuration
//   2. Plugins:
//      - NodeJS Plugin, GitHub Integration
//   3. 로컬 환경:
//      - minikube, kubectl, docker 설치 (brew)
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
        // 3. Nuxt 빌드
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
        // 4. Minikube Docker 이미지 빌드 + 배포
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

                    echo "==> App 이미지 빌드 (minikube 내부)"
                    docker build -t runnable-app:latest -f minikube/Dockerfile .

                    echo "==> Migrate 이미지 빌드 (minikube 내부)"
                    docker build -t runnable-migrate:latest -f minikube/Dockerfile.migrate .

                    echo "==> DB 마이그레이션 실행"
                    kubectl delete job runnable-migrate -n runnable --ignore-not-found
                    kubectl apply -f minikube/k8s/migration-job.yaml
                    kubectl wait --for=condition=complete job/runnable-migrate -n runnable --timeout=120s

                    echo "==> App 롤링 재시작"
                    kubectl rollout restart deployment/runnable-app -n runnable
                    kubectl rollout status deployment/runnable-app -n runnable --timeout=180s

                    echo "==> 배포 완료: $(date)"
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
