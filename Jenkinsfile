pipeline {
    agent any

    environment {
        REPO_URL      = "https://github.com/G0kul17/Department-Record-Management-System.git"
        BRANCH        = "main"
        BUILD_VERSION = "${env.BUILD_NUMBER}"
        APP_HOST      = "drms-app-01"
        GATEWAY_HOST  = "prod-gateway-01"
        REMOTE_USER   = "deploy"

        // Required by backend unit tests (no real DB/email needed)
        JWT_SECRET        = credentials('drms-jwt-secret')
        FILE_STORAGE_PATH = '/tmp/jenkins-drms-uploads'
        NODE_ENV          = 'test'
        CI                = 'true'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {

        // ----------------------------------------------------------------
        // 1. SOURCE
        // ----------------------------------------------------------------
        stage('Checkout') {
            steps {
                git branch: "${BRANCH}", url: "${REPO_URL}"
            }
        }

        // ----------------------------------------------------------------
        // 2. DEPENDENCIES
        // ----------------------------------------------------------------
        stage('Install Dependencies') {
            parallel {
                stage('Backend deps') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend deps') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        // ----------------------------------------------------------------
        // 3. BACKEND — UNIT TESTS + COVERAGE
        //    Runs before build/deploy so a failing test aborts the pipeline
        //    early. JUnit results and the HTML coverage report are always
        //    published so failures are visible in the Jenkins UI.
        // ----------------------------------------------------------------
        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh 'npm run test:coverage'
                }
            }
            post {
                always {
                    // Test result trend graph (requires JUnit plugin)
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-results/junit.xml'

                    // HTML coverage report (requires HTML Publisher plugin)
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'backend/coverage',
                        reportFiles          : 'index.html',
                        reportName           : 'Vitest Coverage'
                    ])
                }
            }
        }

        // ----------------------------------------------------------------
        // 4. FRONTEND — PRODUCTION BUILD
        // ----------------------------------------------------------------
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "VITE_API_BASE_URL=/api" > .env.production
                        npm run build
                        ls -la dist
                    '''
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
                }
            }
        }

        // ----------------------------------------------------------------
        // 5. PACKAGE BACKEND
        //    Strip dev files before shipping to the server.
        // ----------------------------------------------------------------
        stage('Prepare Backend Artifact') {
            steps {
                sh '''
                    rm -rf backend_release
                    mkdir backend_release
                    cp -r backend/. backend_release/
                    rm -rf backend_release/node_modules \
                           backend_release/coverage \
                           backend_release/test-results
                    echo "Backend artifact prepared:"
                    ls -la backend_release
                '''
            }
        }

        // ----------------------------------------------------------------
        // 6. DEPLOY BACKEND
        // ----------------------------------------------------------------
        stage('Deploy Backend') {
            steps {
                sshagent(['drms-ssh']) {
                    sh """
                        ssh ${REMOTE_USER}@${APP_HOST} '
                            set -euxo pipefail
                            mkdir -p /opt/drms/backend/releases/${BUILD_VERSION}
                        '
                        scp -r backend_release/. \
                            ${REMOTE_USER}@${APP_HOST}:/opt/drms/backend/releases/${BUILD_VERSION}/
                        ssh ${REMOTE_USER}@${APP_HOST} '
                            set -euxo pipefail
                            cd /opt/drms/backend/releases/${BUILD_VERSION}
                            ln -sfn /opt/drms/backend/.env .env
                            npm ci --omit=dev
                            ln -sfn /opt/drms/backend/releases/${BUILD_VERSION} /opt/drms/backend/current
                            cd /opt/drms/backend/current
                            pm2 reload drms --update-env
                            pm2 save
                            cd /opt/drms/backend/releases
                            ls -1dt */ | tail -n +6 | xargs -r rm -rf
                        '
                    """
                }
            }
        }

        // ----------------------------------------------------------------
        // 7. DEPLOY FRONTEND
        // ----------------------------------------------------------------
        stage('Deploy Frontend') {
            steps {
                sshagent(['drms-ssh']) {
                    sh """
                        ssh ${REMOTE_USER}@${GATEWAY_HOST} '
                            set -euxo pipefail
                            rm -rf /var/www/drms/*
                        '
                        scp -r frontend/dist/. \
                            ${REMOTE_USER}@${GATEWAY_HOST}:/var/www/drms/
                    """
                }
            }
        }

        // ----------------------------------------------------------------
        // 8. SMOKE TEST
        // ----------------------------------------------------------------
        stage('Basic Validation') {
            steps {
                sh '''
                    sleep 5
                    curl -k -f https://prod-gateway-01/ > /dev/null
                    sleep 5
                    curl -k -f http://drms-app-01:5000/health > /dev/null
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Deployment successful. Release ${BUILD_VERSION} active."
        }
        failure {
            echo "Deployment failed. Investigate logs immediately."
        }
    }
}
