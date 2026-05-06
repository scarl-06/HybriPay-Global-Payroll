import axios from "axios";
import crypto from "crypto";
import logger from "./logger";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "hybripay_default_secret_12345";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

/**
 * Sends a cryptographically signed webhook notification to a target URL.
 */
export const sendWebhookNotification = async (
  url: string | null | undefined,
  payload: any
): Promise<void> => {
  if (!url) {
    logger.info({ message: "No webhook URL registered for this event. Skipping." });
    return;
  }

  const webhookPayload: WebhookPayload = {
    event: payload.event || "unknown",
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const payloadString = JSON.stringify(webhookPayload);
  
  // Create HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payloadString)
    .digest("hex");

  try {
    logger.info({ message: "Dispatching webhook", url, event: webhookPayload.event });
    
    await axios.post(url, webhookPayload, {
      headers: {
        "Content-Type": "application/json",
        "X-HybriPay-Signature": signature,
        "User-Agent": "HybriPay-Webhook-Engine/1.0",
      },
      timeout: 5000, // 5 second timeout
    });

    logger.info({ message: "Webhook delivered successfully", url });
  } catch (error: any) {
    logger.error({ 
      message: "Webhook delivery failed", 
      url, 
      error: error.message,
      status: error.response?.status 
    });
    // In a production system, we would queue this for a retry here.
  }
};
