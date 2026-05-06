import { Request, Response, NextFunction } from "express";
import prisma from "../services/prisma";
import logger from "../services/logger";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip auth for health check
  if (req.path === "/health") {
    return next();
  }

  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    logger.warn(`[Auth] Missing API key from ${req.ip}`);
    return res.status(401).json({ error: "Missing x-api-key header" });
  }

  try {
    const client = await prisma.apiClient.findUnique({
      where: { apiKey },
    });

    if (!client || !client.active) {
      logger.warn(`[Auth] Invalid or inactive API key attempt: ${apiKey.substring(0, 8)}...`);
      return res.status(401).json({ error: "Invalid or inactive API key" });
    }

    // Attach client info to request for downstream use
    (req as any).apiClient = client;
    next();
  } catch (error) {
    next(error);
  }
};
