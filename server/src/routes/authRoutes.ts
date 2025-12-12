import express from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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
authRouter.get("/verify", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log(jwt.verify(token, process.env.JWT_SECRET!));
    res.json({ valid: true, userId: (decoded as any).id });
  } catch (err) {
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
});

// ---------- SIGNUP ----------
authRouter.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup Failed" });
  }
});

// ---------- LOGIN ----------
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid credentials" });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login Failed" });
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

// ---------- GOOGLE AUTH ----------
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      let user = await prisma.user.findUnique({
        where: { googleid: profile.id },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            googleid: profile.id,
            email: profile.emails?.[0].value!,
            name: profile.displayName,
          },
        });
      }
      return done(null, user);
    }
  )
);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req: any, res) => {
    const token = generateToken(req.user.id);
    res.cookie("token", token, cookieOptions);
    res.redirect(`${process.env.FRONTEND_URL}/home`);
  }
);

export default authRouter;
