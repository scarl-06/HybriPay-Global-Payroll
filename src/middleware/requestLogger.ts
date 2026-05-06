import { Request, Response, NextFunction } from "express";
import logger from "../services/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  logger.info({
    message: "Request started",
    method: req.method,
    path: req.originalUrl,
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      message: "Request completed",
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    });
  });

  next();
};
