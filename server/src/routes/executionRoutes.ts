import express from "express";
import { codeExecutor } from "../helper/codeExecuter";

const execRouter = express.Router();

execRouter.post("/executeCode", async (req, res) => {
  const { language, code } = req.body;
  try {
let username = req.user?.toString() ?? "";
    const returned = await codeExecutor(language, code, username);
    res
      .status(200)
      .json({ message: "code executed successfully", output: returned });
  } catch (err: any) {
    res.status(400).json({ error: err });
  }
});

export default execRouter;
