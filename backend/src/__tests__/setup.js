// Global test environment setup
// Must run before any module imports that check env vars at module load time
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-unit-tests-32chars!";
process.env.FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH || "/tmp/test-uploads";
process.env.DB_USER = process.env.DB_USER || "postgres";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_NAME = process.env.DB_NAME || "drms_test_db";
process.env.DB_PASS = process.env.DB_PASS || "postgres_test_password";
process.env.DB_PORT = process.env.DB_PORT || "5432";
