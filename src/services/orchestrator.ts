import prisma from "./prisma";
import { transferUSDC } from "./solana";
import { simulateOnRamp, simulateOffRamp } from "./ramp";
import { sendWebhookNotification } from "./webhook";
import { OracleService } from "./oracle";
import logger from "./logger";

interface PayrollResult {
  success: boolean;
  transactionId: string;
  solanaSignature?: string;
  status: string;
  error?: string;
}

/**
 * Processes a single payroll payment through the full pipeline:
 * Validate → On-Ramp → Solana Transfer → Off-Ramp → Webhook
 */
export const processPayroll = async (
  employeeId: string,
  amount: number,
  idempotencyKey?: string,
  contractVersion: string = "v1.0.0"
): Promise<PayrollResult> => {
  // 1. Idempotency check
  if (idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return {
        success: existing.status === "COMPLETED",
        transactionId: existing.id,
        solanaSignature: existing.solanaSignature || undefined,
        status: existing.status,
      };
    }
  }

  // 2. Fetch employee
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  // 3. Oracle Check
  const currentRate = await OracleService.getUsdcExchangeRate();
  logger.info({ message: "Staging payroll with Oracle rate", rate: currentRate });

  // 4. Create pending transaction (Staged for CEO Approval)
  const transaction = await prisma.transaction.create({
    data: {
      employeeId: employee.id,
      amountUSD: amount,
      idempotencyKey,
      status: "PENDING_APPROVAL",
      contractVersion
    },
  });

  logger.info({
    message: "Payroll staged for approval",
    service: "orchestrator",
    transactionId: transaction.id,
    employee: employee.name,
    amount,
  });

  await sendWebhookNotification(employee.webhookUrl, {
    event: "payroll.staged",
    transactionId: transaction.id,
    employeeId: employee.id,
    amount: amount,
    status: "PENDING_APPROVAL"
  });

  return {
    success: true,
    transactionId: transaction.id,
    status: "PENDING_APPROVAL",
  };
};

/**
 * Executes a staged transaction after CEO Approval.
 * Includes the Automated Tax Splitter workflow.
 */
export const executeApprovedPayroll = async (
  transactionId: string,
  taxWallet?: string | null
): Promise<PayrollResult> => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { employee: true },
  });

  if (!transaction) throw new Error("Transaction not found");
  
  const validStates = ["PENDING_APPROVAL", "PARTIALLY_APPROVED"];
  if (!validStates.includes(transaction.status)) {
    throw new Error(`Transaction is not staged for approval (Current status: ${transaction.status})`);
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "PENDING" },
  });

  try {
    // 1. On-Ramp
    await simulateOnRamp(Number(transaction.amountUSD));
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "ON_RAMP_SUCCESS" },
    });

    // 2. Solana Transfer (With Automated Global Tax Split)
    const { getTaxRule } = require("./tax");
    const taxRule = getTaxRule(transaction.employee.country || "USA");
    
    const transferOptions = { 
      taxWallet: taxRule.authorityWallet, 
      taxPercentage: taxRule.percentage 
    };

    const signature = await transferUSDC(
      transaction.employee.solanaWallet, 
      Number(transaction.amountUSD),
      transferOptions
    );
    
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { solanaSignature: signature, status: "SOLANA_SETTLED" },
    });

    // 3. Off-Ramp
    await simulateOffRamp(transaction.employee.bankAccount, Number(transaction.amountUSD));
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "OFF_RAMP_SUCCESS" },
    });

    // 4. Mark completed
    const completedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" },
    });

    await sendWebhookNotification(transaction.employee.webhookUrl, {
      event: "payroll.completed",
      transactionId: completedTx.id,
      amount: Number(transaction.amountUSD),
      solanaSignature: signature,
      taxWithheld: !!taxWallet
    });

    return {
      success: true,
      transactionId: completedTx.id,
      solanaSignature: signature,
      status: "COMPLETED",
    };
  } catch (error: any) {
    logger.error({ message: "Approval Execution failed", error: error.message });
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "FAILED", failureReason: error.message },
    });
    return { success: false, transactionId, status: "FAILED", error: error.message };
  }
};

/**
 * Processes multiple payrolls concurrently using Promise.allSettled.
 * Returns results for each item regardless of individual failures.
 */
export const processBatchPayroll = async (
  items: Array<{ employeeId: string; amount: number; idempotencyKey?: string }>
): Promise<PayrollResult[]> => {
  logger.info({
    message: "Batch payroll started",
    service: "orchestrator",
    count: items.length,
  });

  const results = await Promise.allSettled(
    items.map((item) =>
      processPayroll(item.employeeId, item.amount, item.idempotencyKey)
    )
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      success: false,
      transactionId: "",
      status: "FAILED",
      error: result.reason?.message || "Unknown error",
    };
  });
};

/**
 * Retries a previously FAILED transaction.
 */
export const retryTransaction = async (
  transactionId: string
): Promise<PayrollResult> => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { employee: true },
  });

  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (transaction.status !== "FAILED") {
    throw new Error(
      `Cannot retry transaction with status: ${transaction.status}. Only FAILED transactions can be retried.`
    );
  }

  logger.info({
    message: "Retrying failed transaction",
    service: "orchestrator",
    transactionId,
  });

  // Reset to pending
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "PENDING", failureReason: null },
  });

  try {
    // Re-run from on-ramp
    await simulateOnRamp(Number(transaction.amountUSD));
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "ON_RAMP_SUCCESS" },
    });

    const signature = await transferUSDC(
      transaction.employee.solanaWallet,
      Number(transaction.amountUSD)
    );
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { solanaSignature: signature, status: "SOLANA_SETTLED" },
    });

    await simulateOffRamp(
      transaction.employee.bankAccount,
      Number(transaction.amountUSD)
    );
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "OFF_RAMP_SUCCESS" },
    });

    const completedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" },
    });

    await sendWebhookNotification(transaction.employee.webhookUrl, {
      event: "payroll.retry.completed",
      transactionId: completedTx.id,
      solanaSignature: signature,
    });

    return {
      success: true,
      transactionId: completedTx.id,
      solanaSignature: signature,
      status: "COMPLETED",
    };
  } catch (error: any) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "FAILED", failureReason: error.message },
    });

    return {
      success: false,
      transactionId,
      status: "FAILED",
      error: error.message,
    };
  }
};
