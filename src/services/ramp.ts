import logger from "./logger";
import { v4 as uuidv4 } from "uuid";

/**
 * Simulated On-Ramp: Captures fiat from the employer's bank account.
 * In production, this would call Circle, Stripe, or a banking API.
 */
export const simulateOnRamp = async (amount: number): Promise<string> => {
  const referenceId = `ONRAMP-${uuidv4().substring(0, 8).toUpperCase()}`;

  // Simulate processing delay (200-500ms)
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  logger.info({
    message: "On-Ramp completed",
    service: "ramp",
    direction: "on-ramp",
    amount,
    referenceId,
  });

  return referenceId;
};

/**
 * Simulated Off-Ramp: Sends local fiat to the employee's bank account.
 * In production, this would call Stripe Payouts, Wise, or a local banking API.
 */
export const simulateOffRamp = async (
  bankAccount: string,
  amount: number
): Promise<string> => {
  const payoutId = `PAYOUT-${uuidv4().substring(0, 8).toUpperCase()}`;

  // Simulate processing delay (300-800ms)
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

  logger.info({
    message: "Off-Ramp completed",
    service: "ramp",
    direction: "off-ramp",
    bankAccount: `****${bankAccount.slice(-4)}`,
    amount,
    payoutId,
  });

  return payoutId;
};
