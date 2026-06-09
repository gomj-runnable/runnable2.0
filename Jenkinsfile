// =============================================================================
// Jenkinsfile — Runnable CI/CD (docker-compose 운영)
//
// 트리거: master push / 수동
// 흐름: 품질검사 → TDD 게이트(테스트 실패 시 abort) → 빌드 → 이미지 → compose up
//
// 운영 형상은 prod/compose/ 패키지, 배포 단계는 prod/deploy/*.sh 참조. minikube/k8s 의존성 없음.
// =============================================================================

pipeline {
    agent any

    environment {
        BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'manual'}"
        PATH      = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
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

        // ── 2. TDD 게이트 ──
        // 테스트 실패 시 배포 중단 — "성공 시 신규 이미지 컨테이너 교체" 원칙.
        stage('Test') {
            steps { sh 'pnpm test' }
        }

        // ── 3. 호스트 빌드 (.output 산출) ──
        // .env.prod 를 로드해 runtimeConfig 값을 .output 에 baking (런타임 NUXT_ 주입 대체)
        stage('Build') {
            steps { sh 'pnpm exec nuxt build --dotenv .env.prod' }
        }

        // ── 4. Docker 데몬 확인 ──
        stage('DockerCheck') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail
                    echo "==> Docker 데몬 확인"
                    docker info &>/dev/null || { echo "ERROR: Docker 연결 실패"; exit 1; }
                    docker compose version &>/dev/null || { echo "ERROR: docker compose v2 필요"; exit 1; }
                    echo "    Docker OK"
                '''
            }
        }

        // ── 5. DB 보장 + 마이그레이션 ──
        stage('Migrate') {
            steps { sh 'bash prod/deploy/migrate.sh' }
        }

        // ── 6. App 이미지 빌드 + 컨테이너 무중단 교체 ──
        stage('Deploy') {
            steps { sh 'bash prod/deploy/deploy.sh' }
        }

        // ── 7. Smoke ──
        stage('Smoke') {
            steps { sh 'bash prod/deploy/smoke.sh' }
        }
    }

    post {
        success { echo "Pipeline SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
        failure { echo "Pipeline FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
        cleanup { cleanWs() }
    }
}
