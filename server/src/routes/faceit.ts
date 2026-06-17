import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { loadFaceitStats } from "../services/faceit.js";

export const faceitRouter = Router();

const syncSchema = z.object({
  nickname: z.string().min(2)
});

faceitRouter.post("/sync", requireAuth, async (req: AuthRequest, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid Faceit nickname", issues: parsed.error.flatten() });
    return;
  }

  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) {
    res.status(400).json({ message: "Create player profile before syncing Faceit stats" });
    return;
  }

  const stats = await loadFaceitStats(parsed.data.nickname);

  const saved = await prisma.faceitStats.upsert({
    where: { profileId: profile.id },
    update: stats,
    create: {
      ...stats,
      profileId: profile.id
    }
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      faceitNickname: stats.nickname,
      faceitLevel: stats.level
    }
  });

  res.json({ stats: saved });
});
