# Phase 5: Real-Time Webhooks & Event Notification System

## 1. The Core Objective
To transform HybriPay from a standalone dashboard into an **integrated financial platform**. Webhooks allow external systems (like Slack, accounting software, or custom HR portals) to react instantly when a payroll event occurs on the blockchain.

## 2. The Architecture
We will implement an **Asynchronous Event Pipeline**:

1.  **Event Trigger**: The `orchestrator.ts` finishes a Solana transaction.
2.  **Event Dispatch**: It pushes an event (e.g., `payroll.success`) to the `WebhookService`.
3.  **Security Layer**: The service generates a cryptographic signature (HMAC-SHA256) of the payload.
4.  **Delivery**: The system sends a `POST` request to the employee's registered `webhookUrl`.

## 3. Supported Events
| Event Name | Trigger Point | Payload Data |
| :--- | :--- | :--- |
| `payroll.staged` | When HR initiates a payout | `transactionId`, `amount`, `employeeId` |
| `payroll.completed` | When CEO approves & Solana transfer clears | `signature`, `netAmount`, `taxWithheld` |
| `payroll.failed` | When a transaction fails (e.g. low balance) | `error`, `transactionId`, `step` |

## 4. Security: The HMAC Handshake
To prevent "Webhook Spoofing," we will include a header: `x-hybripay-signature`.
*   **The Secret**: A shared secret key between HybriPay and the client.
*   **The Hash**: `HMAC_SHA256(Secret, JSON_Payload)`.
*   **The Benefit**: The client can verify that the notification actually came from our server and wasn't tampered with.

## 5. Implementation Roadmap
1.  **[NEW]** `src/services/webhook.ts`: The engine that handles the POSTing and signing.
2.  **[MODIFY]** `src/services/orchestrator.ts`: Integrate triggers into every stage of the pipeline.
3.  **[MODIFY]** `frontend/src/app/employees/page.tsx`: Add a field to the "Add Employee" modal for the Webhook URL.
4.  **[TEST]** Create a local "Webhook Listener" script to verify the signatures.

---
> **Next Step**: Say "Execute Phase 5" to begin the implementation.
