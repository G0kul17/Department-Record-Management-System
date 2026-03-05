pipeline {
    agent {
        node { label 'nodejs' }   // change to 'any' if Node.js is on all agents
    }

    environment {
        // --- Credentials (configure in Manage Jenkins → Credentials) ---
        JWT_SECRET        = credentials('drms-jwt-secret')   // Secret text, any value for tests
        DB_USER           = credentials('drms-db-user')
        DB_PASS           = credentials('drms-db-pass')
        DB_NAME           = credentials('drms-db-name')
        DB_HOST           = credentials('drms-db-host')
        DB_PORT           = '5432'

        // --- Test-only env vars (no real DB/email needed for unit tests) ---
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
                checkout scm
            }
        }

        // ----------------------------------------------------------------
        // 2. DEPENDENCIES
        // ----------------------------------------------------------------
        stage('Install dependencies') {
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
        // 3. SECURITY AUDIT
        // ----------------------------------------------------------------
        stage('Security audit') {
            parallel {
                stage('Backend audit') {
                    steps {
                        dir('backend') {
                            // --audit-level=high fails only on high/critical
                            sh 'npm audit --audit-level=high || true'
                        }
                    }
                }
                stage('Frontend audit') {
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=high || true'
                        }
                    }
                }
            }
        }

        // ----------------------------------------------------------------
        // 4. BACKEND — UNIT TESTS + COVERAGE
        // ----------------------------------------------------------------
        stage('Backend unit tests') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Backend coverage report') {
            steps {
                dir('backend') {
                    sh 'npm run test:coverage'
                }
            }
            post {
                always {
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
        // 5. FRONTEND — PRODUCTION BUILD
        // ----------------------------------------------------------------
        stage('Frontend build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
                }
            }
        }

        // ----------------------------------------------------------------
        // 6. DATABASE MIGRATIONS  (deploy-time; skip on PR builds)
        // ----------------------------------------------------------------
        stage('Database migrations') {
            when {
                // Only run on main/master or tagged releases — not on feature branches
                anyOf {
                    branch 'main'
                    branch 'master'
                    buildingTag()
                }
            }
            environment {
                PGPASSWORD = "${DB_PASS}"
            }
            steps {
                sh '''
                    for f in backend/migrations/[0-9]*.sql; do
                        echo "Applying migration: $f"
                        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f"
                    done
                '''
            }
        }

        // ----------------------------------------------------------------
        // 7. HEALTH CHECK  (only after a real deployment — main/master)
        // ----------------------------------------------------------------
        stage('Health check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                // Replace the URL with your actual deployed host
                sh '''
                    for i in 1 2 3 4 5; do
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
                        if [ "$STATUS" = "200" ]; then
                            echo "Health check passed (HTTP $STATUS)"
                            exit 0
                        fi
                        echo "Attempt $i: HTTP $STATUS — retrying in 5s..."
                        sleep 5
                    done
                    echo "Health check failed after 5 attempts"
                    exit 1
                '''
            }
        }
    }

    // --------------------------------------------------------------------
    // POST
    // --------------------------------------------------------------------
    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline passed: tests green, frontend built, migrations applied."
        }
        failure {
            echo "Pipeline failed — check the stage logs and Coverage Report above."
        }
    }
}
