import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/authRoutes";
import execRouter from "./routes/executionRoutes";

dotenv.config();
const app = express();
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/exec", execRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
