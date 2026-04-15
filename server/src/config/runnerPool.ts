export interface Runner {
  name: string;
  busy: boolean;
  executions: number;
}

export const runners: Record<string, Runner[]> = {
  java: [{ name: "java1", busy: false, executions: 0 }],
  c: [{ name: "c1", busy: false, executions: 0 }],
  py: [{ name: "py1", busy: false, executions: 0 }],
  cpp: [{ name: "cpp1", busy: false, executions: 0 }],
  js: [{ name: "js1", busy: false, executions: 0 }],
};

// Queue to hold pending requests if all runners for a given language are busy
const queues: Record<string, ((runner: Runner) => void)[]> = {
  java: [],
  c: [],
  py: [],
  cpp: [],
  js: [],
};

/**
 * Gets a free runner. If none are available, it returns a Promise that 
 * resolves when a runner becomes available (prevents instant failures under load).
 */
export const getFreeRunner = (language: string): Promise<Runner> => {
  return new Promise((resolve, reject) => {
    const pool = runners[language];
    const queue = queues[language];

    if (!pool || !queue) {
      return reject(new Error("Unsupported language"));
    }

    const runner = pool.find((r) => !r.busy);

    if (runner) {
      runner.busy = true;
      resolve(runner);
    } else {
      // Add to queue to wait for a free runner
      queue.push((freedRunner: Runner) => {
        freedRunner.busy = true;
        resolve(freedRunner);
      });
    }
  });
};

/**
 * Releases a runner back to the pool and dequeues the next waiting task if any.
 */
export const releaseRunner = (runner: Runner) => {
  const language = Object.keys(runners).find((lang) =>
    runners[lang].some((r) => r.name === runner.name)
  );

  if (!language) return;

  runner.busy = false;

  const queue = queues[language];
  if (queue && queue.length > 0) {
    const nextResolve = queue.shift();
    if (nextResolve) {
      // Assign the newly freed runner to the next item in the queue
      nextResolve(runner);
    }
  }
};