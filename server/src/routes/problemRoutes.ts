import express from "express";
import { protect } from "../middlewares/authMiddleware";
import prisma from "../prisma/prisma";
const ProblemRouter = express.Router();

ProblemRouter.post("/create", protect, async (req, res) => {
  const {
    statement,
    descriptions,
    inputs,
    returns,
    testcases,
    startsWith,
    endsWith,
  } = req.body;

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    const problem = await prisma.problem.create({
      data: {
        ownerid: userId,
        statement,
        descriptions,
        inputs,
        returns,
        testcases,
        startsWith,
        endsWith,
      },
    });

    return res.status(201).json({
      message: "Problem created successfully",
      problem,
    });
  } catch (err: any) {
    console.error("Error creating problem:", err);
    return res.status(500).json({
      message: "Error creating your problem",
      error: err.message,
    });
  }
});

ProblemRouter.get("/", async (req, res) => {
  try {
    const problems = await prisma.problem.findMany();

    return res.status(200).json({ problems });
  } catch (err: any) {
    console.error("❌ Error fetching problems:", err);
    return res
      .status(500)
      .json({ message: "Error fetching problems", error: err.message });
  }
});

ProblemRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id: Number(id) },
    });

    if (!problem) return res.status(404).json({ message: "Problem not found" });

    return res.status(200).json({ problem });
  } catch (err: any) {
    console.error("❌ Error fetching problem:", err);
    return res
      .status(500)
      .json({ message: "Error fetching problem", error: err.message });
  }
});

ProblemRouter.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.problem.findUnique({
      where: { id: Number(id) },
    });

    if (!existing)
      return res.status(404).json({ message: "Problem not found" });

    if (existing.ownerid !== userId)
      return res.status(403).json({ message: "Forbidden: not the owner" });

    const updated = await prisma.problem.update({
      where: { id: Number(id) },
      data: req.body,
    });

    return res
      .status(200)
      .json({ message: "Problem updated successfully", problem: updated });
  } catch (err: any) {
    console.error("❌ Error updating problem:", err);
    return res
      .status(500)
      .json({ message: "Error updating problem", error: err.message });
  }
});

ProblemRouter.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.problem.findUnique({
      where: { id: Number(id) },
    });

    if (!existing)
      return res.status(404).json({ message: "Problem not found" });

    if (existing.ownerid !== userId)
      return res.status(403).json({ message: "Forbidden: not the owner" });

    await prisma.problem.delete({ where: { id: Number(id) } });

    return res.status(200).json({ message: "Problem deleted successfully" });
  } catch (err: any) {
    console.error("❌ Error deleting problem:", err);
    return res
      .status(500)
      .json({ message: "Error deleting problem", error: err.message });
  }
});
