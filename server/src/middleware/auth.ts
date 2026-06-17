import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "../db.js";

export type AuthUser = {
  id: string;
  email: string;
  isAdmin?: boolean;
};

export type AuthRequest = Request & {
  user?: AuthUser;
};

export function signToken(user: AuthUser) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Authorization token is required" });
    return;
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthUser;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Authorization token is required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { isAdmin: true }
  });

  if (!user?.isAdmin) {
    res.status(403).json({ message: "Admin access is required" });
    return;
  }

  next();
}
