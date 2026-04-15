import express from "express";
import { codeExecutor } from "../helper/codeExecuter";
import { protect } from "../middlewares/authMiddleware";
import prisma from "../prisma/prisma";

const execRouter = express.Router();

const languageMap: Record<string, string> = {
  JAVA: "java",
  JAVASCRIPT: "js",
  PYTHON: "py",
  C: "c",
  CPP: "cpp",
};

execRouter.post("/executeCode", protect, async (req, res) => {
  const { codeBookId } = req.body;

  try {
    const codeBook = await prisma.codeBook.findFirst({
      where: {
        id: parseInt(codeBookId),
        userId: (req as any).user.id,
      },
    });

    if (!codeBook) {
      return res.status(404).json({
        error: "Notebook not found",
      });
    }

    const username = (req as any).user?.name ?? "";

    const executorLanguage = languageMap[codeBook.language];

    if (!executorLanguage) {
      return res.status(400).json({
        error: "Unsupported language",
      });
    }

    const result = await codeExecutor(
      executorLanguage,
      codeBook.code,
      username,
    );

    await prisma.codeBook.update({
      where: {
        id: parseInt(codeBookId),
      },
      data: {
        stdout: "error" in result ? "" : result.stdout,

        stderr: "error" in result ? String(result.error) : result.stderr,
      },
    });

    return res.status(200).json({
      stdout: "error" in result ? "" : result.stdout,

      stderr: "error" in result ? String(result.error) : result.stderr,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(400).json({
      error: err.message,
    });
  }
});

export default execRouter;
