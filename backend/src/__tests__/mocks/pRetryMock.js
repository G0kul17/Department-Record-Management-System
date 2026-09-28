// Mock implementation of p-retry for tests running from backend environment
export default async function pRetry(fn) {
  return await fn();
}
