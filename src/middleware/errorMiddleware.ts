import { Request, Response, NextFunction } from "express";
import logger from "../services/logger";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  logger.error({
    message,
    status,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
};
