import { Router } from "express";
import prisma from "../services/prisma";
import { getTreasuryBalance } from "../services/solana";
import { Prisma } from "@prisma/client";

const router = Router();

/**
 * @openapi
 * /api/v1/dashboard/transactions:
 *   get:
 *     summary: Paginated, filterable transaction list
 *     tags: [Dashboard]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get("/transactions", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (req.query.status) {
      where.status = req.query.status as any;
    }
    if (req.query.employeeId) {
      where.employeeId = req.query.employeeId as string;
    }
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) {
        where.createdAt.gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        where.createdAt.lte = new Date(req.query.to as string);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { employee: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/dashboard/analytics:
 *   get:
 *     summary: Summary statistics
 *     tags: [Dashboard]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Volume and success rate data
 */
router.get("/analytics", async (req, res, next) => {
  try {
    const [statusCounts, totalVolume, totalTransactions, activeEmployees, recentTransactions, treasury] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        _sum: { amountUSD: true },
        where: { status: "COMPLETED" },
      }),
      prisma.transaction.count(),
      prisma.employee.count(),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { employee: { select: { name: true } } }
      }),
      getTreasuryBalance().catch(() => ({ balance: 0, address: "N/A" }))
    ]);

    const completedCount = statusCounts.find((s) => s.status === "COMPLETED")?._count.id || 0;
    const successRate = totalTransactions > 0 ? (completedCount / totalTransactions) * 100 : 0;

    const countryDistribution = await prisma.employee.groupBy({
      by: ["country"],
      _count: { id: true },
    });

    // Calculate Simulated Yield (5% APY on Pending/Staged funds)
    const pendingFunds = await prisma.transaction.aggregate({
      _sum: { amountUSD: true },
      where: { status: { in: ["PENDING_APPROVAL", "ON_RAMP_SUCCESS"] } }
    });
    
    const pendingAmount = Number(pendingFunds._sum.amountUSD || 0);
    // Rough estimation: (Amount * 0.05) / 365 days / 24 hours ... let's just show a "Potential Daily Yield"
    const potentialDailyYield = (pendingAmount * 0.05) / 365;

    return res.status(200).json({
      totalVolume: totalVolume._sum.amountUSD || 0,
      treasuryBalance: treasury.balance,
      activeEmployees,
      successRate: Math.round(successRate),
      recentTransactions,
      potentialDailyYield: potentialDailyYield.toFixed(4),
      pendingStagedFunds: pendingAmount,
      countryDistribution: countryDistribution.map(c => ({
        country: c.country,
        count: c._count.id
      })),
      volumeData: [
        { name: "Mon", volume: 0 },
        { name: "Tue", volume: 0 },
        { name: "Wed", volume: 0 },
        { name: "Thu", volume: 0 },
        { name: "Fri", volume: 0 },
        { name: "Sat", volume: 0 },
        { name: "Sun", volume: 0 },
      ]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/dashboard/treasury:
 *   get:
 *     summary: Live treasury USDC balance
 *     tags: [Dashboard]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Current treasury status
 */
router.get("/treasury", async (req, res, next) => {
  try {
    const { balance, address } = await getTreasuryBalance();

    return res.status(200).json({
      treasuryAddress: address,
      balanceUSDC: balance,
      network: process.env.SOLANA_RPC_URL?.includes("devnet") ? "devnet" : "mainnet-beta",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/prices", async (req, res, next) => {
  try {
    const { OracleService } = require("../services/oracle");
    const snapshot = await OracleService.getMarketSnapshot();
    return res.status(200).json(snapshot);
  } catch (error) {
    next(error);
  }
});

export default router;
