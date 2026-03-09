// Global test environment setup
// Must run before any module imports that check env vars at module load time
process.env.JWT_SECRET = "test-secret-for-unit-tests-32chars!";
process.env.FILE_STORAGE_PATH = "/tmp/test-uploads";
process.env.NODE_ENV = "test";
