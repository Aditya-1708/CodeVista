import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { getFreeRunner, releaseRunner } from "../config/runnerPool";

const execFileAsync = promisify(execFile);

const MAX_EXECUTIONS = 10;
const EXECUTION_TIMEOUT_MS = 5000;

export const codeExecutor = async (
  language: string,
  code: string,
  username: string,
) => {
  const timestamp = Date.now();
  const baseDir = path.resolve(__dirname, "../data/code");
  // Sanitize username to prevent weird file paths (though execFile prevents shell injections anyway)
  const safeUsername = username.replace(/[^a-zA-Z0-9]/g, "") || "guest";
  const filename = `${safeUsername}${timestamp}`;
  const filepath = path.join(baseDir, `${filename}.${language}`);

  await mkdir(baseDir, { recursive: true });

  // For Java, ensuring the main class matches the filename if they provide a class
  if (language === "java") {
    code = code.replace(/class\s+\w+/, `class ${filename}`);
  }

  await writeFile(filepath, code);

  // Await finding a free runner (will wait in queue if all runners are busy)
  const runner = await getFreeRunner(language);

  try {
    // 1. Copy file into container using execFile (safe against shell injection)
    await execFileAsync("docker", [
      "cp",
      filepath,
      `${runner.name}:/workspace/${filename}.${language}`,
    ]);

    // 2. Prepare execution arguments
    let execArgs: string[] = [];

    switch (language) {
      case "java":
        execArgs = [
          "exec",
          runner.name,
          "sh",
          "-c",
          `javac /workspace/${filename}.java && java -cp /workspace ${filename}`,
        ];
        break;

      case "py":
        execArgs = [
          "exec",
          runner.name,
          "python3",
          `/workspace/${filename}.py`,
        ];
        break;

      case "cpp":
        execArgs = [
          "exec",
          runner.name,
          "sh",
          "-c",
          `g++ /workspace/${filename}.cpp -o /workspace/${filename}.out && /workspace/${filename}.out`,
        ];
        break;

      case "c":
        execArgs = [
          "exec",
          runner.name,
          "sh",
          "-c",
          `gcc /workspace/${filename}.c -o /workspace/${filename}.out && /workspace/${filename}.out`,
        ];
        break;

      case "js":
        execArgs = ["exec", runner.name, "node", `/workspace/${filename}.js`];
        break;

      default:
        throw new Error("Unsupported language");
    }

    // 3. Execute inside container with strict timeout
    const { stdout, stderr } = await execFileAsync("docker", execArgs, {
      timeout: EXECUTION_TIMEOUT_MS,
      killSignal: "SIGKILL", // Ensure docker exec is killed forcefully if it hangs
    });

    runner.executions += 1;
    return { stdout, stderr };
  } catch (err: any) {
    // Handle node child_process timeout property specifically
    const isTimeout = err.killed && err.signal === "SIGKILL";
    const errorMsg = isTimeout
      ? `Execution timed out after ${EXECUTION_TIMEOUT_MS / 1000} seconds.`
      : err.stderr || err.message;

    // We increment executions even on failure because a crashed process dirties the container
    runner.executions += 1;
    return { error: errorMsg };
  } finally {
    try {
      // Delete local temp file
      await unlink(filepath);

      if (runner.executions >= MAX_EXECUTIONS) {
        await execFileAsync("docker", ["restart", runner.name]);
        runner.executions = 0;
      } else {
        await execFileAsync("docker", [
          "exec",
          runner.name,
          "sh",
          "-c",
          "rm -rf /workspace/*",
        ]);
      }
    } catch (cleanupError) {
      console.error(
        `Standard cleanup failed for ${runner.name}, forcing restart...`,
        cleanupError,
      );

      try {
        await execFileAsync("docker", ["restart", runner.name]);
        runner.executions = 0;
      } catch (restartError) {
        console.error(
          `CRITICAL: Failed to restart container ${runner.name}.`,
          restartError,
        );
      }
    }

    releaseRunner(runner);
  }
};
