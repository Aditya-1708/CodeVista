import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import execRouter from "./routes/executionRoutes";
import aiRouter from "./routes/aiRoutes";
import codeBookRouter from "./routes/codeBookRoutes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/exec", execRouter);
app.use("/api/ai", aiRouter);
app.use("/api/codeBook", codeBookRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
