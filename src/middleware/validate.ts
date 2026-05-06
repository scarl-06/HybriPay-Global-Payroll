import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Generic Zod validation middleware.
 * Usage: router.post("/route", validate(myZodSchema), handler)
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Validation failed:", error.issues);
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((issue: any) => ({
            field: String(issue.path?.join?.(".") ?? ""),
            message: String(issue.message ?? "Unknown validation error"),
          })),
        });
      }
      next(error);
    }
  };
};
