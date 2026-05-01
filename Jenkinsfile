// =============================================================================
// Jenkinsfile — Runnable CI/CD Pipeline
//
// 트리거: master push / 수동
// 흐름: 품질검사 → 호스트 빌드 → Docker 이미지 → Docker Hub push
// 배포: Docker Hub webhook → macmini에서 rolling update (별도 스크립트)
// =============================================================================

pipeline {
    agent any

    environment {
        BUILD_TAG    = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'manual'}"
        PATH         = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        DOCKER_IMAGE = "myeongjunkim0615/runnable"
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

        stage('Build') {
            steps {
                sh 'pnpm build'
            }
        }

        stage('Docker Push') {
            steps {
                sh '''#!/bin/bash
                    set -euo pipefail

                    echo "==> Docker 이미지 빌드 (호스트 빌드 결과 복사)"
                    docker build -t ${DOCKER_IMAGE}:latest -t ${DOCKER_IMAGE}:${BUILD_TAG} -f minikube/Dockerfile .

                    echo "==> Docker Hub Push"
                    docker push ${DOCKER_IMAGE}:latest
                    docker push ${DOCKER_IMAGE}:${BUILD_TAG}

                    echo "==> 완료: ${DOCKER_IMAGE}:${BUILD_TAG}"
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
