// Minimal p-retry mock for frontend tests — just runs fn() once without retry
const pRetry = (fn) => fn();
export default pRetry;
