import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, signToken, type AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(5)
});

function publicUser(user: { id: string; email: string; isAdmin: boolean }) {
  return { id: user.id, email: user.email, isAdmin: user.isAdmin };
}

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid registration data", issues: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    res.status(409).json({ message: "User with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      isAdmin: false
    }
  });

  const token = signToken(publicUser(user));
  res.status(201).json({ token, user: publicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid login data", issues: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = signToken(publicUser(user));
  res.json({ token, user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      profile: {
        include: {
          faceitStats: true
        }
      }
    }
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ user: publicUser(user), profile: user.profile });
});
