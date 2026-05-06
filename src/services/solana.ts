import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint,
  getAccount,
} from "@solana/spl-token";
import dotenv from "dotenv";
import bs58 from "bs58";
import logger from "./logger";

dotenv.config();

const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  "confirmed"
);

// Treasury wallet setup
const getTreasuryKeypair = () => {
  const secretKeyString = process.env.TREASURY_PRIVATE_KEY;
  if (!secretKeyString) {
    throw new Error("TREASURY_PRIVATE_KEY is not defined in .env");
  }
  return Keypair.fromSecretKey(bs58.decode(secretKeyString));
};

const USDC_MINT = new PublicKey(
  process.env.USDC_MINT_ADDRESS || "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
);

/**
 * Returns the current USDC balance of the Treasury wallet.
 */
export const getTreasuryBalance = async (): Promise<{
  balance: number;
  address: string;
}> => {
  const treasury = getTreasuryKeypair();
  const mintInfo = await getMint(connection, USDC_MINT);

  try {
    const treasuryAta = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      USDC_MINT,
      treasury.publicKey
    );

    const account = await getAccount(connection, treasuryAta.address);
    const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);

    return {
      balance,
      address: treasury.publicKey.toBase58(),
    };
  } catch (error: any) {
    logger.error(`[Solana] Failed to get treasury balance: ${error.message}`);
    return {
      balance: 0,
      address: treasury.publicKey.toBase58(),
    };
  }
};

/**
 * Pings the Solana RPC to verify connectivity.
 */
export const pingSolanaRpc = async (): Promise<boolean> => {
  try {
    await connection.getSlot();
    return true;
  } catch {
    return false;
  }
};

/**
 * Transfers USDC from the Treasury wallet to a recipient.
 * @param recipientAddress The Solana address of the recipient.
 * @param amount The amount of USDC to transfer (in units, e.g., 1.00 USDC).
 * @returns The transaction signature.
 */
export const transferUSDC = async (
  recipientAddress: string,
  amount: number,
  options?: { taxWallet: string; taxPercentage: number }
): Promise<string> => {
  const treasury = getTreasuryKeypair();
  
  if (process.env.TREASURY_DEMO_MODE === "true" || !treasury) {
    logger.info(`[Demo Mode] Simulating USDC transfer of ${amount} to ${recipientAddress}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `DEMO-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  }

  const recipientPublicKey = new PublicKey(recipientAddress);

  // 1. Get mint info to determine decimals
  const mintInfo = await getMint(connection, USDC_MINT);

  // Calculate Split
  let taxAmount = 0;
  let employeeAmount = amount;
  if (options && options.taxWallet && options.taxPercentage > 0) {
    taxAmount = amount * (options.taxPercentage / 100);
    employeeAmount = amount - taxAmount;
  }

  const adjustedEmployeeAmount = employeeAmount * Math.pow(10, mintInfo.decimals);
  const adjustedTaxAmount = taxAmount * Math.pow(10, mintInfo.decimals);
  const totalAdjustedAmount = amount * Math.pow(10, mintInfo.decimals);

  // 2. Get or create ATA for Treasury
  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    USDC_MINT,
    treasury.publicKey
  );

  // 3. Pre-flight balance check
  const treasuryAccount = await getAccount(connection, treasuryAta.address);
  if (Number(treasuryAccount.amount) < totalAdjustedAmount) {
    throw new Error(
      `Insufficient treasury USDC balance. Required: ${amount}, Available: ${Number(treasuryAccount.amount) / Math.pow(10, mintInfo.decimals)
      }`
    );
  }

  const transaction = new Transaction();

  // 4. Employee Transfer
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    USDC_MINT,
    recipientPublicKey
  );

  transaction.add(
    createTransferInstruction(
      treasuryAta.address,
      recipientAta.address,
      treasury.publicKey,
      adjustedEmployeeAmount
    )
  );

  // 5. Tax Transfer (if applicable)
  if (options && options.taxWallet && taxAmount > 0) {
    const taxPublicKey = new PublicKey(options.taxWallet);
    const taxAta = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      USDC_MINT,
      taxPublicKey
    );

    transaction.add(
      createTransferInstruction(
        treasuryAta.address,
        taxAta.address,
        treasury.publicKey,
        adjustedTaxAmount
      )
    );

    logger.info({ message: "Tax splitter activated", taxAmount, employeeAmount });
  }

  // 6. Send and Confirm Atomic Transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    treasury,
  ]);

  logger.info({
    message: "USDC transfer confirmed",
    service: "solana",
    signature,
    recipient: recipientAddress,
    totalAmount: amount,
    isSplit: !!options?.taxWallet
  });

  return signature;
};
