import { PlayerRole, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const profileRouter = Router();

const profileSchema = z.object({
  nickname: z.string().min(2),
  faceitNickname: z.string().optional().nullable(),
  role: z.nativeEnum(PlayerRole),
  rank: z.string().min(2),
  faceitLevel: z.number().int().min(1).max(10).optional().nullable(),
  hours: z.number().int().min(0),
  maps: z.string().min(2),
  languages: z.string().min(2),
  primeTime: z.string().min(2),
  hasMicrophone: z.boolean(),
  description: z.string().min(10)
});

profileRouter.get("/", async (req, res) => {
  const { role, q, minLevel, map, language } = req.query;

  const where: Prisma.ProfileWhereInput = {};

  if (typeof role === "string" && role in PlayerRole) {
    where.role = role as PlayerRole;
  }

  if (typeof q === "string" && q.trim()) {
    where.nickname = { contains: q.trim() };
  }

  if (typeof minLevel === "string" && Number(minLevel) > 0) {
    where.faceitLevel = { gte: Number(minLevel) };
  }

  if (typeof map === "string" && map.trim()) {
    where.maps = { contains: map.trim() };
  }

  if (typeof language === "string" && language.trim()) {
    where.languages = { contains: language.trim() };
  }

  const profiles = await prisma.profile.findMany({
    where,
    include: { faceitStats: true, user: { select: { id: true, email: true } } },
    orderBy: [{ faceitLevel: "desc" }, { updatedAt: "desc" }]
  });

  res.json({ profiles });
});

profileRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user!.id },
    include: { faceitStats: true }
  });

  res.json({ profile });
});

profileRouter.get("/:id", async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { id: req.params.id },
    include: { faceitStats: true, user: { select: { id: true, email: true } } }
  });

  if (!profile) {
    res.status(404).json({ message: "Profile not found" });
    return;
  }

  res.json({ profile });
});

profileRouter.put("/me", requireAuth, async (req: AuthRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid profile data", issues: parsed.error.flatten() });
    return;
  }

  const profile = await prisma.profile.upsert({
    where: { userId: req.user!.id },
    update: parsed.data,
    create: {
      ...parsed.data,
      userId: req.user!.id
    },
    include: { faceitStats: true }
  });

  res.json({ profile });
});
