pipeline {
    agent any

    environment {
        REPO_URL      = "https://github.com/G0kul17/Department-Record-Management-System.git"
        BRANCH        = "main"
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
        // 0. SET VERSION — YYYY.M.D.BUILD
        // ----------------------------------------------------------------
        stage('Set Version') {
            steps {
                script {
                    env.BUILD_VERSION = sh(
                        script: "echo \$(date +%Y.%-m.%-d).${env.BUILD_NUMBER}",
                        returnStdout: true
                    ).trim()
                    echo "Release version: ${env.BUILD_VERSION}"
                }
            }
        }

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
        // ----------------------------------------------------------------
        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh 'npm run test:coverage'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-results/junit.xml'

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
        //    Includes: SCP, npm ci, database migrations, health check,
        //    and automatic rollback on failure.
        // ----------------------------------------------------------------
        stage('Deploy Backend') {
            steps {
                sshagent(['drms-ssh']) {

                    // ── 6a. Upload release to server ──────────────────
                    sh """
                        ssh ${REMOTE_USER}@${APP_HOST} '
                            set -euo pipefail
                            mkdir -p /opt/drms/backend/releases/${env.BUILD_VERSION}
                        '
                        scp -r backend_release/. \
                            ${REMOTE_USER}@${APP_HOST}:/opt/drms/backend/releases/${env.BUILD_VERSION}/
                    """

                    // ── 6b. Install production dependencies ───────────
                    sh """
                        ssh ${REMOTE_USER}@${APP_HOST} '
                            set -euo pipefail
                            cd /opt/drms/backend/releases/${env.BUILD_VERSION}
                            ln -sfn /opt/drms/backend/.env .env
                            npm ci --omit=dev
                            echo "Dependencies installed."
                        '
                    """

                    // ── 6c. Run database migrations ──────────────────
                    //      Sources .env for DB credentials; -x disabled
                    //      in this block to avoid leaking secrets.
                    sh """
                        ssh ${REMOTE_USER}@${APP_HOST} 'bash -s' << 'MIGRATIONS'
                            set -eo pipefail
                            echo "============================================"
                            echo " Running database migrations"
                            echo "============================================"

                            cd /opt/drms/backend
                            set -a; . .env; set +a

                            # Export PGPASSWORD so psql never prompts on stdin.
                            # Without this, psql reads the password from stdin —
                            # i.e. the REST of this heredoc script — consumes the
                            # migration loop below, and the step silently exits 0
                            # having applied NOTHING. This is how migrations
                            # 006/010/011 were missed in production.
                            export PGPASSWORD="\$DB_PASS"

                            if [ -z "\${DB_HOST:-}" ] || [ -z "\${DB_USER:-}" ] || [ -z "\${DB_NAME:-}" ]; then
                                echo "ERROR: Missing DB credentials in /opt/drms/backend/.env"
                                exit 1
                            fi
                            echo "DB target: \$DB_USER@\$DB_HOST/\$DB_NAME"

                            CURRENT=\$(psql -h "\$DB_HOST" -U "\$DB_USER" -d "\$DB_NAME" -t \\
                                -c "SELECT COALESCE(MAX(version), 0) FROM schema_version;" \\
                                </dev/null 2>/dev/null || echo "0")
                            CURRENT=\$(echo "\$CURRENT" | tr -d "[:space:]")
                            echo "Current schema version: \$CURRENT"

                            # Never proceed silently: if the version lookup failed,
                            # abort the deploy instead of skipping every migration.
                            if [ -z "\$CURRENT" ]; then
                                echo "ERROR: could not determine current schema version"
                                exit 1
                            fi

                            MIGRATIONS_DIR="/opt/drms/backend/releases/${env.BUILD_VERSION}/migrations"
                            if [ ! -d "\$MIGRATIONS_DIR" ]; then
                                echo "ERROR: Migrations directory not found: \$MIGRATIONS_DIR"
                                exit 1
                            fi
                            APPLIED=0

                            for f in "\$MIGRATIONS_DIR"/*.sql; do
                                [ -f "\$f" ] || continue
                                filename=\$(basename "\$f")
                                version=\$(echo "\$filename" | sed -n 's/^0*\\([0-9][0-9]*\\)_.*/\\1/p')
                                [ -z "\$version" ] && continue

                                if [ "\$version" -gt "\$CURRENT" ]; then
                                    echo "--> Applying: \$filename (version \$version)"
                                    PGPASSWORD="\$DB_PASS" psql -h "\$DB_HOST" -U "\$DB_USER" \\
                                        -d "\$DB_NAME" -f "\$f"
                                    APPLIED=\$((APPLIED + 1))
                                else
                                    echo "    Skip (already applied): \$filename"
                                fi
                            done

                            echo "============================================"
                            echo " Migrations complete. Newly applied: \$APPLIED"
                            echo "============================================"
MIGRATIONS
                    """

                    // ── 6d. Activate release + health check + rollback ─
                    sh """
                        ssh ${REMOTE_USER}@${APP_HOST} 'bash -s' << 'ACTIVATE'
                            set -euo pipefail
                            echo "============================================"
                            echo " Activating release ${env.BUILD_VERSION}"
                            echo "============================================"

                            PREVIOUS=\$(readlink -f /opt/drms/backend/current 2>/dev/null || echo "")
                            echo "Previous release: \${PREVIOUS:-(none — first deploy)}"

                            ln -sfn /opt/drms/backend/releases/${env.BUILD_VERSION} /opt/drms/backend/current
                            cd /opt/drms/backend/current
                            pm2 reload drms --update-env

                            echo ""
                            echo "Waiting for health check (up to 30s)..."

                            HEALTHY=false
                            for i in \$(seq 1 15); do
                                sleep 2
                                if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
                                    HEALTHY=true
                                    echo "  Health check PASSED (attempt \$i)"
                                    break
                                fi
                                echo "  attempt \$i/15..."
                            done

                            if [ "\$HEALTHY" = "false" ]; then
                                echo ""
                                echo "============================================"
                                echo " FATAL: Backend health check FAILED after 30s"
                                echo "============================================"

                                if [ -n "\$PREVIOUS" ] && [ -d "\$PREVIOUS" ]; then
                                    echo "Rolling back to \$PREVIOUS ..."
                                    ln -sfn "\$PREVIOUS" /opt/drms/backend/current
                                    cd /opt/drms/backend/current
                                    pm2 reload drms --update-env
                                    echo "Rollback complete. Previous release restored."
                                else
                                    echo "No previous release available to roll back to!"
                                fi
                                exit 1
                            fi

                            pm2 save
                            cd /opt/drms/backend/releases
                            ls -1dt */ | tail -n +6 | xargs -r rm -rf
                            echo "Activation complete. Release ${env.BUILD_VERSION} is now live."
ACTIVATE
                    """
                }
            }
        }

        // ----------------------------------------------------------------
        // 7. DEPLOY FRONTEND (with backup for rollback)
        // ----------------------------------------------------------------
        stage('Deploy Frontend') {
            steps {
                sshagent(['drms-ssh']) {
                    sh """
                        ssh ${REMOTE_USER}@${GATEWAY_HOST} 'bash -s' << 'FRONTEND_DEPLOY'
                            set -euo pipefail
                            if [ -d /var/www/drms ]; then
                                rm -rf /var/www/drms-backup
                                cp -r /var/www/drms /var/www/drms-backup 2>/dev/null || true
                                echo "Frontend backup saved to /var/www/drms-backup"
                            fi
                            mkdir -p /var/www/drms
                            rm -rf /var/www/drms/*
FRONTEND_DEPLOY
                        scp -r frontend/dist/. \
                            ${REMOTE_USER}@${GATEWAY_HOST}:/var/www/drms/
                    """
                }
            }
        }

        // ----------------------------------------------------------------
        // 8. SMOKE TEST (with frontend rollback on failure)
        // ----------------------------------------------------------------
        stage('Smoke Test') {
            steps {
                sshagent(['drms-ssh']) {
                    sh """
                        sleep 5

                        echo "Testing backend health..."
                        if ! curl -sf http://${APP_HOST}:5000/health > /dev/null 2>&1; then
                            echo "ERROR: Backend health check failed!"
                            exit 1
                        fi
                        echo "Backend: OK"

                        echo "Testing frontend..."
                        if ! curl -skf https://${GATEWAY_HOST}/ > /dev/null 2>&1; then
                            echo "ERROR: Frontend check failed!"

                            ssh ${REMOTE_USER}@${GATEWAY_HOST} 'bash -s' << 'FRONTEND_ROLLBACK'
                                set -euo pipefail
                                if [ -d /var/www/drms-backup ] && ls -A /var/www/drms-backup > /dev/null 2>&1; then
                                    echo "Rolling frontend back to backup..."
                                    rm -rf /var/www/drms/*
                                    cp -r /var/www/drms-backup/. /var/www/drms/
                                    echo "Frontend restored from backup."
                                else
                                    echo "No frontend backup found to restore."
                                fi
FRONTEND_ROLLBACK
                            exit 1
                        fi
                        echo "Frontend: OK"

                        echo "All smoke tests passed."
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Deployment successful. Release ${env.BUILD_VERSION} active."
        }
        failure {
            echo "Deployment failed. Investigate logs immediately."
        }
    }
}
