import path from "path";
import { writeFile, mkdir } from "node:fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { User } from "@prisma/client";

const execAsync = promisify(exec);

export const codeExecutor = async (
  language: string,
  code: string,
  username: string
) => {
  const timeStamp = Date.now();
  const baseDir = path.resolve(__dirname, "../../../data/code"); // 👈 correct absolute path
  const filename = `${username}${timeStamp}`;
  const filepath = path.join(baseDir, `/${filename}.${language}`);
  code = code.replace(/class\s+\w+/, `class ${filename}`);

  await mkdir(baseDir, { recursive: true }); // ensure folder exists
  await writeFile(filepath, code);

  let command = "";

  switch (language) {
    case "java":
      command = `javac "${filepath}" && java -cp "${baseDir}" ${filename}`;
      break;

    case "cpp":
      command = `g++ "${filepath}" -o "${baseDir}/${filename}.out" && "${baseDir}/${filename}.out"`;
      break;
    case "c":
      command = `gcc "${filepath}" -o "${baseDir}/${filename}.out" && "${baseDir}/${filename}.out"`;
      break;
    case "py":
      command = `python3 "${filepath}"`;
      break;
    case "js":
      command = `node "${filepath}"`;
      break;
    default:
      throw new Error("Unsupported language");
  }

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 5000 });
    console.log("✅ stdout:", stdout);
    console.error("⚠️ stderr:", stderr);
    return { stdout, stderr };
  } catch (err: any) {
    console.error("❌ Execution error:", err);
    return { error: err.message };
  }
};
