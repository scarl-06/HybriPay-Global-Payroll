import { Router } from "express";
import prisma from "../services/prisma";

const router = Router();

/**
 * @openapi
 * /api/v1/transactions:
 *   get:
 *     summary: List all payroll transactions
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/", async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            country: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    return res.status(200).json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    next(error);
  }
});

export default router;
