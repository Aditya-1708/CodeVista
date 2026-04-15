import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { reviewCodeWithAI, correctCodeWithAI } from "../helper/geminiHelper";
import prisma from "../prisma/prisma";

const aiRouter = express.Router();

// DEBUG CODEBOOK
aiRouter.post("/debug", protect, async (req, res) => {
  try {
    const { codeBookId } = req.body;

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

    const reviewedCode = await reviewCodeWithAI(
      codeBook.code,
      codeBook.language,
      codeBook.stderr || "",
      codeBook.stdout || "",
    );

    return res.status(200).json({
      message: "AI review complete",
      reviewedCode,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: "AI Debug Failed",
    });
  }
});

// CORRECT CODEBOOK
aiRouter.post("/correctCode", protect, async (req, res) => {
  try {
    const { codeBookId } = req.body;

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

    const correctedCode = await correctCodeWithAI(
      codeBook.code,
      codeBook.language,
    );

    await prisma.codeBook.update({
      where: {
        id: parseInt(codeBookId),
      },
      data: {
        code: correctedCode,
      },
    });

    return res.status(200).json({
      message: "AI correction complete",
      correctedCode,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: "AI Correction Failed",
    });
  }
});

export default aiRouter;
