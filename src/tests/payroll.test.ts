import request from "supertest";
import express from "express";
import payrollRoutes from "../routes/payroll";
import { errorMiddleware } from "../middleware/errorMiddleware";

// Mock the services
jest.mock("../services/solana", () => ({
  transferUSDC: jest.fn().mockResolvedValue("mock-signature"),
  getTreasuryBalance: jest.fn().mockResolvedValue({ balance: 1000, address: "mock-address" }),
}));

jest.mock("../services/ramp", () => ({
  simulateOnRamp: jest.fn().mockResolvedValue("mock-on-ramp-ref"),
  simulateOffRamp: jest.fn().mockResolvedValue("mock-off-ramp-ref"),
}));

jest.mock("../services/prisma", () => ({
  transaction: {
    findUnique: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: "mock-tx-id", status: "PENDING", amountUSD: 100 }),
    update: jest.fn().mockResolvedValue({ id: "mock-tx-id", status: "COMPLETED" }),
  },
  employee: {
    findUnique: jest.fn().mockResolvedValue({ 
      id: "mock-emp-id", 
      name: "Test Employee", 
      solanaWallet: "mock-wallet",
      bankAccount: "mock-bank"
    }),
  },
  apiClient: {
    findUnique: jest.fn().mockResolvedValue({ id: "mock-client-id", apiKey: "test-key", active: true }),
  }
}));

const app = express();
app.use(express.json());

// Mock auth middleware behavior for testing or use a dummy key
app.use((req, res, next) => {
  req.headers["x-api-key"] = "test-key";
  next();
});

app.use("/api/v1/payroll", payrollRoutes);
app.use(errorMiddleware);

describe("Payroll API", () => {
  it("should initiate a payroll payment successfully", async () => {
    const response = await request(app)
      .post("/api/v1/payroll/initiate")
      .send({
        employeeId: "00000000-0000-0000-0000-000000000000", // Valid UUID format
        amount: 50,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("status", "COMPLETED");
    expect(response.body).toHaveProperty("solanaSignature", "mock-signature");
  });

  it("should fail if employeeId is missing", async () => {
    const response = await request(app)
      .post("/api/v1/payroll/initiate")
      .send({ amount: 50 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Validation failed");
  });
});
