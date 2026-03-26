import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { GitForgeError } from "../errors";
import { WebhooksResource } from "../resources/webhooks";
import type { Webhook, WebhookDelivery, PaginatedResponse } from "../types";
import type { WebhookTestResult } from "../resources/webhooks";
import { createMockFetch, mockOk, mockError } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";
const repoId = "d361989f-a82e-4d64-aa30-25e6521e4f31";
const webhookId = "wh-a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function makeWebhook(overrides: Partial<Webhook> = {}): Webhook {
  return {
    id: webhookId,
    url: "https://example.com/webhook",
    events: ["push", "pull_request"],
    active: true,
    ...overrides,
  };
}

function makeDelivery(overrides: Partial<WebhookDelivery> = {}): WebhookDelivery {
  return {
    id: "del-001",
    eventType: "push",
    payload: '{"ref":"refs/heads/main"}',
    responseStatus: "200",
    responseBody: "OK",
    deliveredAt: "2026-03-25T12:00:00.000Z",
    createdAt: "2026-03-25T11:59:59.000Z",
    ...overrides,
  };
}

describe("WebhooksResource", () => {
  describe("create", () => {
    it("sends POST /repos/:id/webhooks with url", async () => {
      const webhook = makeWebhook();
      const { fetch, calls } = mockOk(webhook);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.create(repoId, {
        url: "https://example.com/webhook",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/webhooks`);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({ url: "https://example.com/webhook" });
      expect(result).toEqual(webhook);
    });

    it("sends POST with secret and events options", async () => {
      const webhook = makeWebhook({ events: ["push"] });
      const { fetch, calls } = mockOk(webhook);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.create(repoId, {
        url: "https://example.com/webhook",
        secret: "my-secret-123",
        events: ["push"],
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].body).toEqual({
        url: "https://example.com/webhook",
        secret: "my-secret-123",
        events: ["push"],
      });
      expect(result.events).toEqual(["push"]);
    });
  });

  describe("list", () => {
    it("sends GET /repos/:id/webhooks", async () => {
      const paginated: PaginatedResponse<Webhook> = {
        data: [makeWebhook()],
        total: 1,
        limit: 25,
        offset: 0,
        hasMore: false,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.list(repoId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/webhooks`);
      expect(calls[0].method).toBe("GET");
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(webhookId);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it("sends GET with limit and offset query params", async () => {
      const paginated: PaginatedResponse<Webhook> = {
        data: [makeWebhook()],
        total: 50,
        limit: 10,
        offset: 20,
        hasMore: true,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.list(repoId, { limit: 10, offset: 20 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `${baseUrl}/repos/${repoId}/webhooks?limit=10&offset=20`,
      );
      expect(calls[0].method).toBe("GET");
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
      expect(result.hasMore).toBe(true);
    });
  });

  describe("delete", () => {
    it("sends DELETE /repos/:id/webhooks/:webhookId", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.delete(repoId, webhookId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${baseUrl}/repos/${repoId}/webhooks/${webhookId}`);
      expect(calls[0].method).toBe("DELETE");
      expect(result).toBeNull();
    });
  });

  describe("test", () => {
    it("sends POST /repos/:id/webhooks/:webhookId/test", async () => {
      const testResult: WebhookTestResult = {
        success: true,
        status: 200,
        responseBody: "OK",
        durationMs: 142,
        error: null,
      };
      const { fetch, calls } = mockOk(testResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.test(repoId, webhookId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `${baseUrl}/repos/${repoId}/webhooks/${webhookId}/test`,
      );
      expect(calls[0].method).toBe("POST");
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.durationMs).toBe(142);
      expect(result.error).toBeNull();
    });
  });

  describe("deliveries", () => {
    it("sends GET /repos/:id/webhooks/:webhookId/deliveries", async () => {
      const paginated: PaginatedResponse<WebhookDelivery> = {
        data: [makeDelivery()],
        total: 1,
        limit: 25,
        offset: 0,
        hasMore: false,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.deliveries(repoId, webhookId);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `${baseUrl}/repos/${repoId}/webhooks/${webhookId}/deliveries`,
      );
      expect(calls[0].method).toBe("GET");
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("del-001");
      expect(result.data[0].eventType).toBe("push");
      expect(result.total).toBe(1);
    });

    it("sends GET deliveries with limit and offset", async () => {
      const paginated: PaginatedResponse<WebhookDelivery> = {
        data: [makeDelivery(), makeDelivery({ id: "del-002", eventType: "pull_request" })],
        total: 30,
        limit: 5,
        offset: 10,
        hasMore: true,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.deliveries(repoId, webhookId, { limit: 5, offset: 10 });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(
        `${baseUrl}/repos/${repoId}/webhooks/${webhookId}/deliveries?limit=5&offset=10`,
      );
      expect(calls[0].method).toBe("GET");
      expect(result.data).toHaveLength(2);
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(10);
      expect(result.hasMore).toBe(true);
    });
  });

  describe("return shapes", () => {
    it("Webhook has all expected fields", async () => {
      const webhook = makeWebhook({ events: null });
      const paginated: PaginatedResponse<Webhook> = {
        data: [webhook],
        total: 1,
        limit: 25,
        offset: 0,
        hasMore: false,
      };
      const { fetch } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.list(repoId);
      const w = result.data[0];

      expect(w.id).toBe(webhookId);
      expect(w.url).toBe("https://example.com/webhook");
      expect(w.events).toBeNull();
      expect(w.active).toBe(true);
    });

    it("WebhookTestResult with error has all expected fields", async () => {
      const testResult: WebhookTestResult = {
        success: false,
        status: null,
        responseBody: null,
        durationMs: 5012,
        error: "Connection refused",
      };
      const { fetch } = mockOk(testResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.test(repoId, webhookId);

      expect(result.success).toBe(false);
      expect(result.status).toBeNull();
      expect(result.responseBody).toBeNull();
      expect(result.durationMs).toBe(5012);
      expect(result.error).toBe("Connection refused");
    });

    it("WebhookDelivery has all expected fields", async () => {
      const delivery = makeDelivery({
        responseStatus: null,
        responseBody: null,
        deliveredAt: null,
      });
      const paginated: PaginatedResponse<WebhookDelivery> = {
        data: [delivery],
        total: 1,
        limit: 25,
        offset: 0,
        hasMore: false,
      };
      const { fetch } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      const result = await resource.deliveries(repoId, webhookId);
      const d = result.data[0];

      expect(d.id).toBe("del-001");
      expect(d.eventType).toBe("push");
      expect(d.payload).toBe('{"ref":"refs/heads/main"}');
      expect(d.responseStatus).toBeNull();
      expect(d.responseBody).toBeNull();
      expect(d.deliveredAt).toBeNull();
      expect(d.createdAt).toBe("2026-03-25T11:59:59.000Z");
    });
  });

  describe("errors", () => {
    it("throws GitForgeError 404 when webhook not found", async () => {
      const { fetch } = mockError(404, "not_found", "Webhook not found");
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      try {
        await resource.delete(repoId, "nonexistent-id");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitForgeError);
        const e = err as GitForgeError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Webhook not found");
      }
    });
  });

  describe("auth header", () => {
    it("includes Bearer token on create", async () => {
      const { fetch, calls } = mockOk(makeWebhook());
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      await resource.create(repoId, { url: "https://example.com/hook" });
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on list", async () => {
      const paginated: PaginatedResponse<Webhook> = {
        data: [],
        total: 0,
        limit: 25,
        offset: 0,
        hasMore: false,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      await resource.list(repoId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on delete", async () => {
      const { fetch, calls } = createMockFetch([{ status: 204, body: null, ok: true }]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      await resource.delete(repoId, webhookId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on test", async () => {
      const testResult: WebhookTestResult = {
        success: true,
        status: 200,
        responseBody: "OK",
        durationMs: 100,
        error: null,
      };
      const { fetch, calls } = mockOk(testResult);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      await resource.test(repoId, webhookId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    it("includes Bearer token on deliveries", async () => {
      const paginated: PaginatedResponse<WebhookDelivery> = {
        data: [],
        total: 0,
        limit: 25,
        offset: 0,
        hasMore: false,
      };
      const { fetch, calls } = mockOk(paginated);
      const client = new HttpClient({ baseUrl, token, fetch });
      const resource = new WebhooksResource(client);

      await resource.deliveries(repoId, webhookId);
      expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
