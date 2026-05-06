import { Router } from "express";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { validate } from "../middleware/validate";
import prisma from "../services/prisma";

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────────

const createEmployeeSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email("Must be a valid email"),
  bankAccount: z.string().min(1, "bankAccount is required"),
  solanaWallet: z.string().refine((val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Solana address format"),
  country: z.string().optional(),
  webhookUrl: z.string().url("Must be a valid URL").optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, bankAccount, solanaWallet]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               bankAccount:
 *                 type: string
 *               solanaWallet:
 *                 type: string
 *               webhookUrl:
 *                 type: string
 *                 format: url
 *     responses:
 *       201:
 *         description: Employee created
 */
router.post("/", validate(createEmployeeSchema), async (req, res, next) => {
  try {
    const { name, email, bankAccount, solanaWallet, webhookUrl, country } = req.body;

    const employee = await prisma.employee.create({
      data: { name, email, bankAccount, solanaWallet, webhookUrl, country },
    });

    return res.status(201).json(employee);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "An employee with this email already exists" });
    }
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/employees:
 *   get:
 *     summary: List all employees
 *     tags: [Employees]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get("/", async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    return res.status(200).json({ count: employees.length, employees });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/employees/{id}:
 *   get:
 *     summary: Get employee details and history
 *     tags: [Employees]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Not found
 */
router.get("/:id", async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.status(200).json(employee);
  } catch (error) {
    next(error);
  }
});

export default router;
