import { Router } from "express";
import prisma from "../services/prisma";

const router = Router();

/**
 * @openapi
 * /api/v1/reports/compliance:
 *   get:
 *     summary: Get a global compliance summary by jurisdiction
 */
router.get("/compliance", async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      include: { employee: true }
    });

    const jurisdictions: any = {
      USA: { totalPaid: 0, taxWithheld: 0, count: 0 },
      India: { totalPaid: 0, taxWithheld: 0, count: 0 },
      Europe: { totalPaid: 0, taxWithheld: 0, count: 0 },
      Japan: { totalPaid: 0, taxWithheld: 0, count: 0 }
    };

    transactions.forEach(tx => {
      const country = tx.employee?.country || "USA";
      if (jurisdictions[country]) {
        const amount = Number(tx.amountUSD);
        // Simulate tax splitting based on our service logic (approx 15-20%)
        const taxRate = country === "India" ? 0.30 : (country === "USA" ? 0.20 : 0.15);
        const tax = amount * taxRate;

        jurisdictions[country].totalPaid += amount;
        jurisdictions[country].taxWithheld += tax;
        jurisdictions[country].count += 1;
      }
    });

    return res.status(200).json({
      summary: jurisdictions,
      totalGlobalVolume: transactions.reduce((acc, tx) => acc + Number(tx.amountUSD), 0),
      totalGlobalTax: Object.values(jurisdictions).reduce((acc: any, j: any) => acc + j.taxWithheld, 0),
      lastAuditTimestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/reports/ledger:
 *   get:
 *     summary: Get the audit-ready transaction ledger
 */
router.get("/ledger", async (req, res, next) => {
  try {
    const ledger = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: { employee: true },
      take: 50
    });

    return res.status(200).json(ledger);
  } catch (error) {
    next(error);
  }
});

export default router;
