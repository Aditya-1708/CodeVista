import express from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/prisma";
import { generateToken } from "../utils/generateToken";
import jwt from "jsonwebtoken";

const authRouter = express.Router();

// ---------- COOKIE OPTIONS ----------
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // 'none' if cross-site frontend (use HTTPS)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ---------- VERIFY TOKEN ----------
authRouter.get("/verify", async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      valid: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        valid: false,
        message: "User not found",
      });
    }

    const { password, ...safeUser } = user;

    return res.status(200).json({
      valid: true,
      user: safeUser,
    });
  } catch (err) {
    return res.status(401).json({
      valid: false,
      message: "Invalid token",
    });
  }
});

// ---------- SIGNUP ----------
authRouter.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
      },
    });

    const token = generateToken(user.id);

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Signup Failed",
    });
  }
});

// ---------- LOGIN ----------
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, cookieOptions);

    const { password: _, ...safeUser } = user;

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Login Failed",
    });
  }
});

// ---------- LOGOUT ----------
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ message: "Logged out successfully" });
});

export default authRouter;
