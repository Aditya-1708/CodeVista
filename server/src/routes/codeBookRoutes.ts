import express from "express";
import prisma from "../prisma/prisma";
import { protect } from "../middlewares/authMiddleware";

const codeBookRouter = express.Router();

// CREATE NOTEBOOK
codeBookRouter.post("/", protect, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const codeBook = await prisma.codeBook.create({
      data: {
        userId,
        name: "Untitled Book",
        code: "",
        language: "JAVASCRIPT",
      },
    });

    return res.status(201).json(codeBook);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to create notebook",
    });
  }
});

// GET ALL NOTEBOOKS
codeBookRouter.get("/", protect, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const codeBooks = await prisma.codeBook.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json(codeBooks);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch notebooks",
    });
  }
});

// GET SINGLE NOTEBOOK
codeBookRouter.get("/:id", protect, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const codeBook = await prisma.codeBook.findUnique({
      where: { id },
    });

    return res.status(200).json(codeBook);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch notebook",
    });
  }
});

// UPDATE NOTEBOOK
codeBookRouter.put("/:id", protect, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { name, code, language } = req.body;

    const updated = await prisma.codeBook.update({
      where: { id },
      data: {
        name,
        code,
        language,
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to update notebook",
    });
  }
});

// DELETE NOTEBOOK
codeBookRouter.delete("/:id", protect, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.codeBook.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Notebook deleted",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to delete notebook",
    });
  }
});

export default codeBookRouter;
