import { describe, expect, it } from "bun:test";
import { HttpClient } from "../http";
import { JobsResource } from "../resources/jobs";
import { mockOk, createMockFetch } from "./helpers";

const baseUrl = "https://api.gitforge.dev";
const token = "gf_test_token_abc123";

const mockJob = {
  id: "j1",
  type: "patch-fleet",
  status: "completed",
  progress: { completed: 2, failed: 0, total: 2 },
  result: null,
  error: null,
  createdAt: "2026-04-01T00:00:00Z",
  startedAt: "2026-04-01T00:00:01Z",
  completedAt: "2026-04-01T00:00:10Z",
};

describe("JobsResource", () => {
  describe("list", () => {
    it("sends GET /jobs with query params", async () => {
      const response = { data: [mockJob], total: 1, limit: 20, offset: 0, hasMore: false };
      const { fetch, calls } = mockOk(response);
      const client = new HttpClient({ baseUrl, token, fetch });
      const jobs = new JobsResource(client);

      await jobs.list({ status: "completed", limit: 10 });

      expect(calls[0].method).toBe("GET");
      expect(calls[0].url).toContain("/jobs");
      expect(calls[0].url).toContain("status=completed");
      expect(calls[0].url).toContain("limit=10");
    });
  });

  describe("get", () => {
    it("sends GET /jobs/:jobId", async () => {
      const { fetch, calls } = mockOk(mockJob);
      const client = new HttpClient({ baseUrl, token, fetch });
      const jobs = new JobsResource(client);

      const result = await jobs.get("j1");

      expect(calls[0].url).toContain("/jobs/j1");
      expect(result.status).toBe("completed");
    });
  });

  describe("cancel", () => {
    it("sends DELETE /jobs/:jobId", async () => {
      const { fetch, calls } = mockOk({ status: "cancelled" });
      const client = new HttpClient({ baseUrl, token, fetch });
      const jobs = new JobsResource(client);

      await jobs.cancel("j1");

      expect(calls[0].method).toBe("DELETE");
      expect(calls[0].url).toContain("/jobs/j1");
    });
  });

  describe("waitFor", () => {
    it("polls until job completes", async () => {
      const running = { ...mockJob, status: "running", completedAt: null };
      const completed = { ...mockJob, status: "completed" };
      const { fetch } = createMockFetch([
        { status: 200, body: running },
        { status: 200, body: completed },
      ]);
      const client = new HttpClient({ baseUrl, token, fetch });
      const jobs = new JobsResource(client);

      const result = await jobs.waitFor("j1", { pollIntervalMs: 10 });

      expect(result.status).toBe("completed");
    });
  });
});
