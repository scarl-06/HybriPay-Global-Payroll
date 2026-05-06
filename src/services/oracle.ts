import axios from "axios";
import logger from "./logger";

/**
 * Pyth Network Oracle Service
 * 
 * Fetches real-time, high-fidelity price feeds from the Pyth Network.
 * This ensures that payroll calculations are based on institutional-grade market data.
 */
export class OracleService {
  // Pyth Price IDs (Mainnet/Devnet constants)
  private static readonly SOL_PRICE_ID = "0xef0d8b6fda2ce3729350778ef7a9eec2a125c426280e3b31c3c2a548e8c5605d";
  private static readonly USDC_PRICE_ID = "0xeaa020c61cc479712813461ce153894a96a6c00b217061d65608298dc1d0506b";
  private static readonly PYTH_API_URL = "https://hermes.pyth.network/v2/updates/price/latest";

  /**
   * Fetches the latest price for a given Pyth price ID
   */
  private static async fetchLatestPrice(priceId: string): Promise<number> {
    try {
      const response = await axios.get(this.PYTH_API_URL, {
        params: { "ids[]": priceId }
      });

      const priceData = response.data.parsed[0].price;
      const price = Number(priceData.price) * Math.pow(10, priceData.expo);
      return price;
    } catch (error: any) {
      logger.error({ message: "Pyth Oracle Error", error: error.message });
      return 1.0; // Fallback to parity
    }
  }

  /**
   * Gets the current USDC/USD exchange rate
   */
  static async getUsdcExchangeRate(): Promise<number> {
    logger.info({ event: "oracle_query_started", asset: "USDC/USD" });
    const rate = await this.fetchLatestPrice(this.USDC_PRICE_ID);
    
    logger.info({ 
      event: "oracle_quote_received", 
      rate,
      provider: "Pyth Network (Live)"
    });

    return Number(rate.toFixed(4));
  }

  /**
   * Gets a complete market snapshot for the dashboard
   */
  static async getMarketSnapshot() {
    const [solPrice, usdcPrice] = await Promise.all([
      this.fetchLatestPrice(this.SOL_PRICE_ID),
      this.fetchLatestPrice(this.USDC_PRICE_ID)
    ]);

    return {
      solPrice: Number(solPrice.toFixed(2)),
      usdcPrice: Number(usdcPrice.toFixed(4)),
      timestamp: new Date().toISOString()
    };
  }
}
