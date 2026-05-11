import { Connection, Keypair } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

const AMOUNT = 50_000; // 50,000 USDC
const DECIMALS = 6;

async function main() {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    { commitment: "confirmed", confirmTransactionInitialTimeout: 120000 }
  );

  const secretKey = process.env.TREASURY_PRIVATE_KEY;
  if (!secretKey) throw new Error("TREASURY_PRIVATE_KEY not found in .env");

  const treasury = Keypair.fromSecretKey(bs58.decode(secretKey));
  console.log("Treasury Address:", treasury.publicKey.toBase58());

  // Check SOL balance first
  const solBalance = await connection.getBalance(treasury.publicKey);
  console.log("SOL Balance:", solBalance / 1e9, "SOL");
  if (solBalance < 0.05 * 1e9) {
    console.error("ERROR: You need at least 0.05 SOL. Use https://faucet.solana.com/");
    return;
  }

  // Step 1: Create a new token mint (you are the mint authority)
  console.log("\nCreating new USDC mint...");
  const mint = await createMint(
    connection,
    treasury,       // payer
    treasury.publicKey, // mint authority
    null,           // freeze authority
    DECIMALS        // 6 decimals like real USDC
  );
  console.log("New Mint Address:", mint.toBase58());

  // Step 2: Create Associated Token Account for treasury
  console.log("Creating token account...");
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mint,
    treasury.publicKey
  );
  console.log("Token Account:", ata.address.toBase58());

  // Step 3: Mint 50,000 tokens
  const rawAmount = AMOUNT * Math.pow(10, DECIMALS);
  console.log(`\nMinting ${AMOUNT} USDC...`);
  const sig = await mintTo(
    connection,
    treasury,
    mint,
    ata.address,
    treasury.publicKey,
    rawAmount
  );
  console.log("Mint Tx Signature:", sig);

  // Final output
  console.log("\n========================================");
  console.log("SUCCESS! Update your .env with:");
  console.log(`USDC_MINT_ADDRESS=${mint.toBase58()}`);
  console.log("========================================");
}

main().catch(console.error);
