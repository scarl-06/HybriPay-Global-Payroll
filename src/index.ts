import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Middleware
import { authMiddleware } from "./middleware/authMiddleware";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware";
import { requestLogger } from "./middleware/requestLogger";
import { errorMiddleware } from "./middleware/errorMiddleware";

// Routes
import payrollRoutes from "./routes/payroll";
import employeeRoutes from "./routes/employees";
import dashboardRoutes from "./routes/dashboard";
import approvalRoutes from "./routes/approval";
import transactionRoutes from "./routes/transactions";
import reportRoutes from "./routes/reports";

// Services
import prisma from "./services/prisma";
import { pingSolanaRpc } from "./services/solana";
import logger from "./services/logger";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./services/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(rateLimitMiddleware);

// ─── Deep Health Check (No Auth Required) ────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HybriPay API",
    status: "online",
    docs: "/api-docs",
    health: "/health"
  });
});

app.get("/health", async (req, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);
  const solanaHealthy = await pingSolanaRpc();

  const status = dbHealthy && solanaHealthy ? "healthy" : "degraded";

  res.status(status === "healthy" ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? "connected" : "disconnected",
      solana: solanaHealthy ? "connected" : "disconnected",
    },
  });
});

// ─── Auth Middleware (All routes below require API key) ──────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(authMiddleware);

// ─── Protected Routes (API Key Required) ──────────────────────────────
app.use("/api/v1/payroll", payrollRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/approvals", approvalRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/reports", reportRoutes);

// ─── Error Handling (Must be last) ───────────────────────────────────
app.use(errorMiddleware);

// ─── Start Server ────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Hybrid Payroll API running on http://localhost:${PORT}`);
  logger.info(`📡 Health check: http://localhost:${PORT}/health`);
});
