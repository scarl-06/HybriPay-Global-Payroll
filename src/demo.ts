import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:3000/api/v1";
// Use the API key generated during seeding
const API_KEY = "708a8724-3e88-445d-80e0-d87c8cc216d5"; 

const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

async function runDemo() {
  console.log("🚀 Starting Hybrid Payroll API Demo...");

  try {
    // 1. Create a test employee
    console.log("\n👤 Step 1: Creating a test employee...");
    const employeeRes = await axios.post(
      `${API_BASE}/employees`,
      {
        name: "Demo Employee",
        email: `demo-${Date.now()}@example.com`,
        bankAccount: "9876543210",
        solanaWallet: "HQ8kZmqYwnryAvWZpAhguCQ7RLEsD9JcsQ5kyCYKuR3p", // Use treasury as recipient for demo
      },
      { headers }
    );
    const employee = employeeRes.data;
    console.log(`✅ Employee created: ${employee.name} (${employee.id})`);

    // 2. Initiate payroll
    console.log("\n💸 Step 2: Initiating payroll payment...");
    const payrollRes = await axios.post(
      `${API_BASE}/payroll/initiate`,
      {
        employeeId: employee.id,
        amount: 0.1, // Small amount for demo
        idempotencyKey: `demo-tx-${Date.now()}`,
      },
      { headers }
    );
    console.log("✅ Payroll processed!");
    console.log(`🔗 Solana Signature: ${payrollRes.data.solanaSignature}`);

    // 3. Check Analytics
    console.log("\n📊 Step 3: Fetching dashboard analytics...");
    const analyticsRes = await axios.get(`${API_BASE}/dashboard/analytics`, { headers });
    console.log("📈 Current Stats:", JSON.stringify(analyticsRes.data, null, 2));

    console.log("\n✨ Demo completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Demo failed!");
    if (error.response) {
      console.error("Error Details:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runDemo();
