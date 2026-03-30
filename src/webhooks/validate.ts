import { createHmac, timingSafeEqual } from "crypto";

/**
 * Validate only the HMAC-SHA256 signature of a webhook payload.
 *
 * @param payload - Raw request body as string
 * @param signature - Value of X-Hub-Signature-256 header (format: "sha256=<hex>")
 * @param secret - Webhook secret configured when creating the webhook
 * @returns true if signature matches
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature.startsWith("sha256=")) return false;

  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");

  if (expected.length !== signature.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export interface ValidateWebhookOptions {
  /** Value of X-GitForge-Timestamp header (unix seconds). */
  timestamp?: string;
  /** Max age in seconds. Default 300. Set to 0 to disable timestamp check. */
  maxAgeSeconds?: number;
}

/**
 * Full webhook validation: HMAC signature + optional timestamp replay protection.
 *
 * Signature is always verified over the raw payload. When a timestamp is
 * provided and maxAgeSeconds > 0, an additional freshness check rejects
 * replayed deliveries.
 */
export function validateWebhook(
  payload: string,
  secret: string,
  signature: string,
  options?: ValidateWebhookOptions,
): boolean {
  if (!validateWebhookSignature(payload, signature, secret)) return false;

  const timestamp = options?.timestamp;
  const maxAge = options?.maxAgeSeconds ?? 300;

  // If timestamp is present and maxAge > 0, enforce freshness
  if (timestamp && maxAge > 0) {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > maxAge) return false;
  }

  return true;
}
