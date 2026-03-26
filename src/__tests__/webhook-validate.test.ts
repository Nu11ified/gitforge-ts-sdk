import { describe, it, expect } from "bun:test";
import { validateWebhook, validateWebhookSignature } from "../webhooks/validate";
import { createHmac } from "crypto";

function sign(payload: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

describe("validateWebhookSignature", () => {
  it("returns true for valid signature", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const sig = sign(payload, secret);
    expect(validateWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it("returns false for tampered payload", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const sig = sign(payload, secret);
    expect(validateWebhookSignature('{"event":"hack"}', sig, secret)).toBe(false);
  });

  it("returns false for wrong secret", () => {
    const payload = '{"event":"push"}';
    const sig = sign(payload, "correct-secret");
    expect(validateWebhookSignature(payload, sig, "wrong-secret")).toBe(false);
  });

  it("returns false for missing sha256= prefix", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const rawHex = createHmac("sha256", secret).update(payload).digest("hex");
    expect(validateWebhookSignature(payload, rawHex, secret)).toBe(false);
  });
});

describe("validateWebhook", () => {
  it("returns true when signature and timestamp are valid", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const sig = sign(payload, secret);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    expect(validateWebhook(payload, secret, sig, { timestamp })).toBe(true);
  });

  it("returns false for expired timestamp", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const sig = sign(payload, secret);
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600);
    expect(validateWebhook(payload, secret, sig, {
      timestamp: oldTimestamp,
      maxAgeSeconds: 300,
    })).toBe(false);
  });

  it("skips timestamp check when maxAgeSeconds is 0", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const sig = sign(payload, secret);
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 99999);
    expect(validateWebhook(payload, secret, sig, {
      timestamp: oldTimestamp,
      maxAgeSeconds: 0,
    })).toBe(true);
  });

  it("skips timestamp check when timestamp not provided", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const sig = sign(payload, secret);
    expect(validateWebhook(payload, secret, sig)).toBe(true);
  });

  it("uses default maxAgeSeconds of 300", () => {
    const payload = '{"event":"push"}';
    const secret = "my-secret";
    const sig = sign(payload, secret);
    const recentTimestamp = String(Math.floor(Date.now() / 1000) - 200);
    expect(validateWebhook(payload, secret, sig, {
      timestamp: recentTimestamp,
    })).toBe(true);
  });

  it("returns false when signature is invalid regardless of timestamp", () => {
    const payload = '{"event":"push"}';
    const sig = sign(payload, "wrong");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    expect(validateWebhook(payload, "correct", sig, { timestamp })).toBe(false);
  });
});
