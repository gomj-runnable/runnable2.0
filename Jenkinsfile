// =============================================================================
// Jenkinsfile — Runnable CI/CD Pipeline
//
// 트리거:
//   - GitHub Pull Request  → 코드 품질 검사만 (lint, typecheck, test)
//   - master 브랜치 push   → 품질 검사 + Docker Push + 원격 서버 배포
//   - 수동 (Build Now)     → 품질 검사 + Docker Push + 원격 서버 배포
//
// 사전 준비 (Jenkins 관리):
//   1. Credentials:
//      - 'dockerhub-credentials'  : Docker Hub 계정 (Username with password)
//      - 'deploy-ssh-key'         : 원격 서버 SSH 키 (SSH Username with private key)
//   2. Tools:
//      - NodeJS 설치 (이름: 'NodeJS-20')  — Jenkins Global Tool Configuration
//   3. Plugins:
//      - NodeJS Plugin, Docker Pipeline, SSH Agent, GitHub Integration
// =============================================================================

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        DOCKER_REPO    = 'myeongjunkim0615/runnable'
        DEPLOY_HOST    = credentials('deploy-host')       // 원격 서버 주소
        DEPLOY_PATH    = credentials('deploy-path')       // 원격 서버 프로젝트 경로
        BUILD_TAG      = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'manual'}"
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
        // 2. 코드 품질 검사 (병렬)
        // =====================================================================
        stage('Quality Gate') {
            parallel {
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
            }
        }

        // =====================================================================
        // 3. Nuxt 빌드
        // =====================================================================
        stage('Build') {
            when {
                anyOf {
                    branch 'master'
                    triggeredBy 'UserIdCause'   // 수동 트리거
                }
            }
            steps {
                sh 'pnpm build'
            }
        }

        // =====================================================================
        // 4. Docker 이미지 빌드 & Push
        // =====================================================================
        stage('Docker Push') {
            when {
                anyOf {
                    branch 'master'
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        // App 이미지
                        def appImage = docker.build("${DOCKER_REPO}:${BUILD_TAG}", '.')
                        appImage.push()
                        appImage.push('latest')

                        // Migrate 이미지
                        def migrateImage = docker.build(
                            "${DOCKER_REPO}:migrate-${BUILD_TAG}",
                            '-f Dockerfile.migrate .'
                        )
                        migrateImage.push()
                        migrateImage.push('migrate')
                    }
                }
            }
        }

        // =====================================================================
        // 5. 원격 서버 롤링 업데이트
        // =====================================================================
        stage('Deploy') {
            when {
                anyOf {
                    branch 'master'
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                sshagent(credentials: ['deploy-ssh-key']) {
                    sh """
                        scp -o StrictHostKeyChecking=no \
                            jenkins/scripts/remote-deploy.sh \
                            ${DEPLOY_HOST}:/tmp/runnable-deploy.sh

                        ssh -o StrictHostKeyChecking=no ${DEPLOY_HOST} \
                            "chmod +x /tmp/runnable-deploy.sh && \
                             /tmp/runnable-deploy.sh \
                                '${DOCKER_REPO}' \
                                '${BUILD_TAG}' \
                                '${DEPLOY_PATH}'"
                    """
                }
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
