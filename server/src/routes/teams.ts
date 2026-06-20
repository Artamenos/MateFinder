import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const teamRouter = Router();

const listSchema = z.array(z.string());

const teamPayloadSchema = z.object({
  name: z.string().min(2),
  level: z.string().min(2),
  region: z.string().min(2),
  captain: z.string().min(2),
  members: listSchema,
  players: listSchema.length(5),
  coach: z.string(),
  substitutes: listSchema.length(2),
  goals: z.string().min(5)
});

function parseList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function serializeList(value: string[]) {
  return JSON.stringify(value);
}

function uniqueList(value: string[]) {
  return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
}

function toDto(team: Awaited<ReturnType<typeof prisma.team.findFirst>> extends infer T ? NonNullable<T> : never) {
  return {
    id: team.id,
    name: team.name,
    level: team.level,
    region: team.region,
    captain: team.captain,
    members: parseList(team.membersJson),
    players: parseList(team.playersJson),
    coach: team.coach,
    substitutes: parseList(team.substitutesJson),
    goals: team.goals,
    pendingInvites: parseList(team.pendingInvitesJson),
    pendingRequests: parseList(team.pendingRequestsJson)
  };
}

teamRouter.get("/", requireAuth, async (_req, res) => {
  const teams = await prisma.team.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ teams: teams.map(toDto) });
});

teamRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = teamPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid team data", issues: parsed.error.flatten() });
    return;
  }

  const members = uniqueList([parsed.data.captain, ...parsed.data.members]);
  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      level: parsed.data.level,
      region: parsed.data.region,
      captain: parsed.data.captain,
      membersJson: serializeList(members),
      playersJson: serializeList(parsed.data.players),
      coach: parsed.data.coach,
      substitutesJson: serializeList(parsed.data.substitutes),
      goals: parsed.data.goals,
      pendingInvitesJson: "[]",
      pendingRequestsJson: "[]"
    }
  });

  res.status(201).json({ team: toDto(team) });
});

teamRouter.put("/:id", requireAuth, async (req: AuthRequest, res) => {
  const teamId = String(req.params.id);
  const parsed = teamPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid team data", issues: parsed.error.flatten() });
    return;
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    res.status(404).json({ message: "Team not found" });
    return;
  }

  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!profile || profile.nickname !== team.captain) {
    res.status(403).json({ message: "Only team captain can edit this team" });
    return;
  }

  const members = uniqueList([parsed.data.captain, ...parsed.data.members]);
  const updated = await prisma.team.update({
    where: { id: team.id },
    data: {
      name: parsed.data.name,
      level: parsed.data.level,
      region: parsed.data.region,
      captain: parsed.data.captain,
      membersJson: serializeList(members),
      playersJson: serializeList(parsed.data.players),
      coach: parsed.data.coach,
      substitutesJson: serializeList(parsed.data.substitutes),
      goals: parsed.data.goals
    }
  });

  res.json({ team: toDto(updated) });
});

teamRouter.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const teamId = String(req.params.id);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });

  if (!team) {
    res.status(404).json({ message: "Team not found" });
    return;
  }

  if (!profile || profile.nickname !== team.captain) {
    res.status(403).json({ message: "Only team captain can delete this team" });
    return;
  }

  await prisma.team.delete({ where: { id: team.id } });
  res.status(204).send();
});

teamRouter.post("/:id/requests", requireAuth, async (req: AuthRequest, res) => {
  const teamId = String(req.params.id);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!team || !profile) {
    res.status(404).json({ message: "Team or profile not found" });
    return;
  }

  const requests = uniqueList([...parseList(team.pendingRequestsJson), profile.nickname]);
  const updated = await prisma.team.update({
    where: { id: team.id },
    data: { pendingRequestsJson: serializeList(requests) }
  });

  res.json({ team: toDto(updated) });
});

teamRouter.post("/:id/invites", requireAuth, async (req: AuthRequest, res) => {
  const teamId = String(req.params.id);
  const parsed = z.object({ nickname: z.string().min(2) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid invite data" });
    return;
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!team || !profile) {
    res.status(404).json({ message: "Team or profile not found" });
    return;
  }

  if (profile.nickname !== team.captain) {
    res.status(403).json({ message: "Only team captain can invite players" });
    return;
  }

  const invites = uniqueList([...parseList(team.pendingInvitesJson), parsed.data.nickname]);
  const updated = await prisma.team.update({
    where: { id: team.id },
    data: { pendingInvitesJson: serializeList(invites) }
  });

  res.json({ team: toDto(updated) });
});

teamRouter.delete("/:id/invites/:nickname", requireAuth, async (req: AuthRequest, res) => {
  const teamId = String(req.params.id);
  const nickname = String(req.params.nickname);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!team || !profile || profile.nickname !== team.captain) {
    res.status(403).json({ message: "Only team captain can cancel invites" });
    return;
  }

  const updated = await prisma.team.update({
    where: { id: team.id },
    data: {
      pendingInvitesJson: serializeList(parseList(team.pendingInvitesJson).filter((item) => item !== nickname))
    }
  });

  res.json({ team: toDto(updated) });
});

teamRouter.post("/:id/requests/:nickname/accept", requireAuth, async (req: AuthRequest, res) => {
  const teamId = String(req.params.id);
  const nickname = String(req.params.nickname);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!team || !profile || profile.nickname !== team.captain) {
    res.status(403).json({ message: "Only team captain can accept requests" });
    return;
  }

  const players = parseList(team.playersJson);
  const emptyIndex = players.findIndex((player) => !player);
  if (emptyIndex === -1) {
    res.status(400).json({ message: "No free player slots" });
    return;
  }

  players[emptyIndex] = nickname;
  const updated = await prisma.team.update({
    where: { id: team.id },
    data: {
      membersJson: serializeList(uniqueList([...parseList(team.membersJson), nickname])),
      playersJson: serializeList(players),
      pendingRequestsJson: serializeList(parseList(team.pendingRequestsJson).filter((item) => item !== nickname))
    }
  });

  res.json({ team: toDto(updated) });
});

teamRouter.delete("/:id/requests/:nickname", requireAuth, async (req: AuthRequest, res) => {
  const teamId = String(req.params.id);
  const nickname = String(req.params.nickname);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!team || !profile) {
    res.status(404).json({ message: "Team or profile not found" });
    return;
  }

  const canCancel = profile.nickname === team.captain || profile.nickname === nickname;
  if (!canCancel) {
    res.status(403).json({ message: "You cannot cancel this request" });
    return;
  }

  const updated = await prisma.team.update({
    where: { id: team.id },
    data: {
      pendingRequestsJson: serializeList(parseList(team.pendingRequestsJson).filter((item) => item !== nickname))
    }
  });

  res.json({ team: toDto(updated) });
});
