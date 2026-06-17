import { Router } from "express";
import bcrypt from "bcryptjs";
import { PlayerRole } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin, requireAuth, type AuthRequest } from "../middleware/auth.js";
import { extractFaceitNickname, loadFaceitStats, loadOfficialFaceitProfile } from "../services/faceit.js";

export const faceitRouter = Router();

const syncSchema = z.object({
  nickname: z.string().min(2)
});

const importSchema = z.object({
  profiles: z.array(z.string().min(2)).min(1).max(20)
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

faceitRouter.post("/import-profiles", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid Faceit profile list", issues: parsed.error.flatten() });
    return;
  }

  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  const results = [];

  for (const input of parsed.data.profiles) {
    const requestedNickname = extractFaceitNickname(input);

    try {
      const imported = await loadOfficialFaceitProfile(input);
      const email = `${imported.nickname.toLowerCase()}@faceit.local`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash
        }
      });

      const profile = await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          nickname: imported.nickname,
          faceitNickname: imported.nickname,
          role: PlayerRole.RIFLER,
          rank: `Faceit Level ${imported.stats.level}`,
          faceitLevel: imported.stats.level,
          hours: 0,
          maps: "Не указано",
          languages: imported.country?.toUpperCase() ?? "Не указано",
          primeTime: "Не указано",
          hasMicrophone: true,
          description: `Профиль импортирован с Faceit. Регион: ${imported.region ?? "не указан"}.`
        },
        create: {
          userId: user.id,
          nickname: imported.nickname,
          faceitNickname: imported.nickname,
          role: PlayerRole.RIFLER,
          rank: `Faceit Level ${imported.stats.level}`,
          faceitLevel: imported.stats.level,
          hours: 0,
          maps: "Не указано",
          languages: imported.country?.toUpperCase() ?? "Не указано",
          primeTime: "Не указано",
          hasMicrophone: true,
          description: `Профиль импортирован с Faceit. Регион: ${imported.region ?? "не указан"}.`
        }
      });

      await prisma.faceitStats.upsert({
        where: { profileId: profile.id },
        update: imported.stats,
        create: {
          ...imported.stats,
          profileId: profile.id
        }
      });

      results.push({
        input,
        nickname: imported.nickname,
        status: "imported",
        profileId: profile.id
      });
    } catch (error) {
      results.push({
        input,
        nickname: requestedNickname,
        status: "failed",
        message: error instanceof Error ? error.message : "Unknown import error"
      });
    }
  }

  res.json({ results });
});
