import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { processPayroll, processBatchPayroll, retryTransaction } from "../services/orchestrator";

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────────

const initiateSchema = z.object({
  employeeId: z.string().uuid("employeeId must be a valid UUID"),
  amount: z.number().positive("amount must be a positive number"),
  idempotencyKey: z.string().optional(),
});

const batchSchema = z.object({
  payments: z
    .array(
      z.object({
        employeeId: z.string().uuid("employeeId must be a valid UUID"),
        amount: z.number().positive("amount must be a positive number"),
        idempotencyKey: z.string().optional(),
      })
    )
    .min(1, "At least one payment is required")
    .max(50, "Maximum 50 payments per batch"),
});

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/payroll/initiate:
 *   post:
 *     summary: Initiate a single payroll payment
 *     tags: [Payroll]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, amount]
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payroll initiated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Solana or internal error
 */
router.post("/initiate", validate(initiateSchema), async (req, res, next) => {
  try {
    const { employeeId, amount, idempotencyKey } = req.body;
    const result = await processPayroll(employeeId, amount, idempotencyKey);

    const statusCode = result.success ? 200 : 500;
    return res.status(statusCode).json(result);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/payroll/batch:
 *   post:
 *     summary: Process multiple payroll payments concurrently
 *     tags: [Payroll]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payments]
 *             properties:
 *               payments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [employeeId, amount]
 *                   properties:
 *                     employeeId:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                     idempotencyKey:
 *                       type: string
 *     responses:
 *       200:
 *         description: Batch processed
 */
router.post("/batch", validate(batchSchema), async (req, res, next) => {
  try {
    const { payments } = req.body;
    const results = await processBatchPayroll(payments);

    const summary = {
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };

    return res.status(200).json({ summary, results });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/payroll/retry/{transactionId}:
 *   post:
 *     summary: Retry a previously failed transaction
 *     tags: [Payroll]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Retry successful
 *       400:
 *         description: Cannot retry (not failed or not found)
 */
router.post("/retry/:transactionId", async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const result = await retryTransaction(transactionId);

    const statusCode = result.success ? 200 : 500;
    return res.status(statusCode).json(result);
  } catch (error: any) {
    if (error.message.includes("not found") || error.message.includes("Cannot retry")) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
