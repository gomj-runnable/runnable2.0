// =============================================================================
// Jenkinsfile — Runnable CI/CD (docker-compose 운영)
//
// 트리거: master push / 수동
// 흐름: 품질검사 → TDD 게이트(테스트 실패 시 abort) → 빌드 → 이미지 → compose up
//
// 운영 형상은 compose/ 패키지 참조. minikube/k8s 의존성 없음.
// =============================================================================

pipeline {
    agent any

    environment {
        BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'manual'}"
        PATH      = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        COMPOSE   = "docker compose -f compose/docker-compose.yml --env-file compose/.env.prod"
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
        stage('Build') {
            steps { sh 'pnpm build' }
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
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail
                    echo "==> db 서비스 기동 (이미 떠있으면 noop)"
                    ${COMPOSE} up -d db

                    echo "==> migrate 일회성 실행 (drizzle push + seed)"
                    ${COMPOSE} --profile migrate run --rm --build migrate
                '''
            }
        }

        // ── 6. App 이미지 빌드 + 컨테이너 교체 ──
        stage('Deploy') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail
                    echo "==> app 이미지 재빌드 + 컨테이너 교체"
                    ${COMPOSE} build app
                    ${COMPOSE} up -d --no-deps app

                    echo "==> dangling 이미지 정리"
                    docker image prune -f
                '''
            }
        }

        // ── 7. Smoke ──
        stage('Smoke') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    echo "==> 헬스체크 대기 (최대 60초)"
                    for i in $(seq 1 12); do
                        STATUS=$(docker inspect -f '{{.State.Health.Status}}' runnable_app_prod 2>/dev/null || echo "starting")
                        echo "    [$i/12] app health: $STATUS"
                        if [ "$STATUS" = "healthy" ]; then break; fi
                        sleep 5
                    done

                    echo "==> HTTP 200 확인 (외부 3333)"
                    HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3333 --max-time 10 || echo "000")
                    if [ "$HTTP" != "200" ]; then
                        echo "ERROR: smoke 실패 (HTTP $HTTP)"
                        ${COMPOSE} logs --tail=50 app
                        exit 1
                    fi
                    echo "    OK (HTTP $HTTP)"
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
