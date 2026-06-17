import { InviteStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const inviteRouter = Router();

const createInviteSchema = z.object({
  receiverId: z.string().min(1),
  message: z.string().min(3).max(300)
});

inviteRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const [incoming, outgoing] = await Promise.all([
    prisma.invite.findMany({
      where: { receiverId: req.user!.id },
      include: {
        sender: { include: { profile: { include: { faceitStats: true } } } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.invite.findMany({
      where: { senderId: req.user!.id },
      include: {
        receiver: { include: { profile: { include: { faceitStats: true } } } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  res.json({ incoming, outgoing });
});

inviteRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = createInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid invite data", issues: parsed.error.flatten() });
    return;
  }

  if (parsed.data.receiverId === req.user!.id) {
    res.status(400).json({ message: "You cannot invite yourself" });
    return;
  }

  const receiver = await prisma.user.findUnique({ where: { id: parsed.data.receiverId } });
  if (!receiver) {
    res.status(404).json({ message: "Receiver not found" });
    return;
  }

  const invite = await prisma.invite.upsert({
    where: {
      senderId_receiverId: {
        senderId: req.user!.id,
        receiverId: parsed.data.receiverId
      }
    },
    update: {
      message: parsed.data.message,
      status: InviteStatus.PENDING
    },
    create: {
      senderId: req.user!.id,
      receiverId: parsed.data.receiverId,
      message: parsed.data.message
    }
  });

  res.status(201).json({ invite });
});

inviteRouter.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  const inviteId = String(req.params.id);
  const parsed = z.object({ status: z.nativeEnum(InviteStatus) }).safeParse(req.body);
  if (!parsed.success || parsed.data.status === InviteStatus.PENDING) {
    res.status(400).json({ message: "Invite can only be accepted or declined" });
    return;
  }

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.receiverId !== req.user!.id) {
    res.status(404).json({ message: "Invite not found" });
    return;
  }

  const updated = await prisma.invite.update({
    where: { id: invite.id },
    data: { status: parsed.data.status }
  });

  res.json({ invite: updated });
});
