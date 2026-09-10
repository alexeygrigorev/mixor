// WebKit can reject excessive History API writes. Keep the URL and the
// rendered route at the last successful commit, then commit the latest request.
export const historyCommitIntervalMs = 150;
const initialRetryMs = 250;
const maximumRetryMs = 2000;

type Clock = {
  now: () => number;
  setTimeout: (run: () => void, delay: number) => number;
  clearTimeout: (timer: number) => void;
};
type Commit = { write: () => void; published: () => void };

export function createHistoryCommitter(clock: Clock = {
  now: () => performance.now(),
  setTimeout: (run, delay) => window.setTimeout(run, delay),
  clearTimeout: (timer) => window.clearTimeout(timer),
}) {
  let pending: Commit | undefined;
  let timer: number | undefined;
  let lastAttempt = -Infinity;
  let nextAttempt = -Infinity;
  let retryMs = initialRetryMs;

  function arm() {
    if (!pending || timer !== undefined) return;
    const delay = nextAttempt - clock.now();
    if (delay > 0) timer = clock.setTimeout(run, delay);
    else run();
  }

  function run() {
    timer = undefined;
    if (!pending) return;
    // A timer may fire slightly early; never spend the next write slot early.
    if (clock.now() < nextAttempt) { arm(); return; }
    const commit = pending;
    pending = undefined;
    lastAttempt = clock.now();
    nextAttempt = lastAttempt + historyCommitIntervalMs;
    try {
      commit.write();
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "SecurityError") throw error;
      pending = commit;
      // Start the quiet interval after the actual API attempt, not before
      // entering it (instrumentation or a busy browser can take milliseconds).
      lastAttempt = clock.now();
      nextAttempt = lastAttempt + retryMs;
      retryMs = Math.min(maximumRetryMs, retryMs * 2);
      arm();
      return;
    }
    lastAttempt = clock.now();
    nextAttempt = lastAttempt + historyCommitIntervalMs;
    retryMs = initialRetryMs;
    // Do not catch application/render failures as if they were quota errors.
    commit.published();
  }

  return {
    request(write: () => void, published: () => void) {
      pending = { write, published };
      arm();
    },
    cancel() {
      if (timer !== undefined) clock.clearTimeout(timer);
      timer = undefined;
      pending = undefined;
      retryMs = initialRetryMs;
      // Navigation cancellation drops error backoff, not the write-rate guard.
      nextAttempt = lastAttempt + historyCommitIntervalMs;
    },
  };
}
