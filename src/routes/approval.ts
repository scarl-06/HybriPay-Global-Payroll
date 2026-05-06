import { Router } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { executeApprovedPayroll } from "../services/orchestrator";

const router = Router();

const approvalSchema = z.object({
  transactionId: z.string().uuid("transactionId must be a valid UUID")
});

/**
 * @openapi
 * /api/v1/approvals/pending:
 *   get:
 *     summary: Get all pending approvals
 *     tags: [Approvals]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/pending", async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { 
        status: { in: ["PENDING_APPROVAL", "PARTIALLY_APPROVED"] } 
      },
      include: { employee: true }
    });
    return res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post("/execute", async (req, res, next) => {
  try {
    const parsed = approvalSchema.parse(req.body);
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: parsed.transactionId }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    const nextApprovals = transaction.approvalsReceived + 1;

    if (nextApprovals < transaction.approvalsRequired) {
      // First approval: Move to PARTIALLY_APPROVED
      const updated = await prisma.transaction.update({
        where: { id: parsed.transactionId },
        data: { 
          approvalsReceived: nextApprovals,
          status: "PARTIALLY_APPROVED"
        }
      });
      return res.status(200).json({ 
        success: true, 
        message: `Approval recorded. (${nextApprovals}/${transaction.approvalsRequired})`,
        status: updated.status 
      });
    }

    // Final approval: Execute!
    const result = await executeApprovedPayroll(parsed.transactionId);
    
    await prisma.transaction.update({
      where: { id: parsed.transactionId },
      data: { approvalsReceived: nextApprovals }
    });

    const statusCode = result.success ? 200 : 500;
    return res.status(statusCode).json(result);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/approvals/reject:
 *   post:
 *     summary: CEO Rejection of a staged payroll batch
 *     tags: [Approvals]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/reject", async (req, res, next) => {
  try {
    const parsed = approvalSchema.parse(req.body);
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: parsed.transactionId }
    });

    if (!transaction || transaction.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ error: "Invalid transaction state." });
    }

    const updated = await prisma.transaction.update({
      where: { id: parsed.transactionId },
      data: { status: "FAILED", failureReason: "Rejected by CEO." }
    });

    return res.status(200).json({ success: true, transactionId: updated.id, status: updated.status });
  } catch (error: any) {
    next(error);
  }
});

export default router;
